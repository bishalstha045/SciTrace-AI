import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, CheckCircle2, ChevronRight, Plus, RefreshCw, Link as LinkIcon, BookOpen, BrainCircuit, Activity, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

const LogoIcon = ({ className, strokeWidth = 1.5 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="5" cy="5" r="1.5" />
    <circle cx="19" cy="5" r="1.5" />
    <circle cx="5" cy="19" r="1.5" />
    <circle cx="19" cy="19" r="1.5" />
    <line x1="10.5" y1="10.5" x2="6.5" y2="6.5" />
    <line x1="13.5" y1="10.5" x2="17.5" y2="6.5" />
    <line x1="10.5" y1="13.5" x2="6.5" y2="17.5" />
    <line x1="13.5" y1="13.5" x2="17.5" y2="17.5" />
  </svg>
);

const StepIcon = ({ active, complete, waiting, icon: Icon, colorClass, bgClass }) => {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
      complete ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
      active ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 
      'bg-slate-50 border-slate-200 text-slate-400'
    }`}>
      <Icon className="w-5 h-5" strokeWidth={2}/>
    </div>
  )
}

import { useNavigate, useParams } from 'react-router-dom';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { api } from '../services/api';
import ProfileMenu from '../components/ProfileMenu';

export default function Analyzing() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initializing AI contradiction pipeline...');
  const navigate = useNavigate();
  const { analysisId } = useParams();

  const isDemo = !analysisId || analysisId === 'demo-analysis' || analysisId === 'demo';

  useEffect(() => {
    const id = analysisId || 'demo-analysis';

    if (isDemo) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 1;
          if (next % 5 === 0) {
            mockAnalysisService.updateProgress(id, next, "processing");
          }
          if (next >= 100) {
            clearInterval(interval);
            mockAnalysisService.updateProgress(id, 100, "completed");
            setTimeout(() => navigate(`/analysis/${id}/results`), 500);
            return 100;
          }
          return next;
        });
      }, 60);
      return () => clearInterval(interval);
    }

    // Live backend status polling
    let isMounted = true;
    let pollCount = 0;
    let timerId = null;

    const poll = async () => {
      try {
        const res = await api.getAnalysis(id);
        if (!isMounted) return;

        if (res.data) {
          const data = res.data;
          setAnalysisData(data);
          const currentProgress = typeof data.progress === 'number' ? data.progress : 10;
          setProgress(prev => Math.max(prev, currentProgress));

          if (data.status === 'completed') {
            setProgress(100);
            setStatusMessage('Analysis complete! Redirecting to results...');
            setTimeout(() => {
              if (isMounted) navigate(`/analysis/${id}/results`);
            }, 600);
            return;
          } else if (data.status === 'failed') {
            setError(data.error || data.message || 'Analysis pipeline encountered an error.');
            setStatusMessage('Analysis failed');
            return;
          } else {
            if (currentProgress < 25) {
              setStatusMessage('Extracting document text with PyMuPDF...');
            } else if (currentProgress < 50) {
              setStatusMessage('Extracting candidate scientific claims...');
            } else if (currentProgress < 75) {
              setStatusMessage('Computing embeddings & matching related claims (all-MiniLM-L6-v2)...');
            } else {
              setStatusMessage('Evaluating contradiction and support relationships (BART-large-MNLI)...');
            }
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('Poll error:', err);
      }

      pollCount++;
      if (pollCount > 180) { // 3 minutes timeout
        if (isMounted) setError('Analysis timed out. Please check backend logs or reload.');
        return;
      }

      if (isMounted) {
        timerId = setTimeout(poll, 1500);
      }
    };

    timerId = setTimeout(poll, 600);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [navigate, analysisId, isDemo]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
      {/* Navbar */}
      <nav className="w-full bg-white px-6 sm:px-10 py-4 flex items-center justify-between border-b border-slate-200/50 z-50">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LogoIcon className="w-7 h-7 text-emerald-500" strokeWidth={2} />
          <span className="font-serif font-bold text-[#0f2a24] text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Analyses</Link>
          <Link to="/papers" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Papers</Link>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/analysis/new" className="bg-[#0b1f1b] text-white px-5 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-2 hidden sm:flex">
            New Analysis <Plus className="w-4 h-4"/>
          </Link>
          <ProfileMenu />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 flex flex-col xl:flex-row gap-10 relative">
        <div className="flex-[1] xl:max-w-[600px] mt-8 z-10">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">
            ANALYZING YOUR RESEARCH
          </div>
          <h1 className="text-[52px] font-serif text-[#0f2a24] leading-[1.05] mb-5 tracking-tight">
            Analyzing your <span className="relative inline-block mt-2 z-10 text-[#0f2a24]">
              <span className="absolute -inset-x-2 inset-y-1 bg-[#e0f7ef] rounded-[10px] -z-10"></span>
              research
            </span>
          </h1>
          {isDemo ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-2 text-[12px] text-amber-800">
              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] uppercase shrink-0">Simulated Analysis</span>
              <span>Demonstration extraction engine in progress.</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3 text-[13px] text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Analysis Pipeline Notice</p>
                <p className="text-red-700 mt-1">{error}</p>
                <Link to="/analyses" className="inline-block mt-3 bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-900">
                  Return to Analyses
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-6 flex items-center gap-2 text-[12px] text-emerald-800">
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase shrink-0">Live AI Pipeline</span>
              <span>Extracting scientific claims and evaluating contradictions with sentence embeddings and BART-large-MNLI.</span>
            </div>
          )}
          <p className="text-[16px] text-slate-500 leading-relaxed mb-8 max-w-[500px]">
            SciTrace AI is reading your papers, identifying scientific claims, and comparing related findings.
          </p>

          <div className="mb-6">
            <div className="flex justify-between items-end mb-3">
              <p className="text-[14px] font-semibold text-slate-700">
                {analysisData?.papers?.length ? `${analysisData.papers.length} paper(s)` : (isDemo ? '3 papers' : 'Research papers')}
                {' '}&bull;{' '}
                {analysisData?.claims?.length ? `${analysisData.claims.length} candidate claim(s)` : (isDemo ? '127 candidate claims' : 'Processing claims')}
              </p>
              <p className="text-[24px] font-bold text-slate-800 leading-none">{progress}%</p>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full relative overflow-hidden" style={{width: `${progress}%`}}>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-blue-600 font-medium text-[13px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {statusMessage}
            </div>
          </div>
        </div>

        {/* Top Right Graphics Area */}
        <div className="absolute left-[680px] top-[100px] w-[700px] h-[300px] z-10">
           {/* Connecting Lines */}
           <svg className="absolute inset-0 w-full h-full z-0" pointerEvents="none">
             {/* To middle column */}
             <path d="M 120 70 C 180 70, 160 50, 220 50" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3"/>
             <path d="M 120 70 C 180 70, 160 110, 220 110" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3"/>
             <path d="M 120 160 C 180 160, 160 170, 220 170" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3"/>
             <path d="M 120 250 C 180 250, 160 230, 220 230" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3"/>
             
             {/* To AI Node */}
             <path d="M 330 50 C 400 50, 400 160, 450 160" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.6"/>
             <path d="M 330 110 C 400 110, 400 160, 450 160" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.6"/>
             <path d="M 330 170 C 400 170, 400 160, 450 160" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.6"/>
             <path d="M 330 230 C 400 230, 400 160, 450 160" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.6"/>
             
             {/* To Results */}
             <path d="M 540 160 C 580 160, 580 80, 620 80" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" opacity="0.8"/>
             <path d="M 540 160 C 580 160, 580 160, 620 160" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" opacity="0.8"/>
             <path d="M 540 160 C 580 160, 580 240, 620 240" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" opacity="0.8"/>
             
             <circle cx="450" cy="160" r="4" fill="#3b82f6" />
           </svg>

           {/* Column 1: Papers */}
           <div className="absolute left-[0px] top-[40px] flex flex-col gap-5 z-10">
             <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 w-[120px] flex items-center gap-2">
               <div className="bg-red-50 text-red-600 text-[6px] font-bold px-1 py-0.5 rounded">PDF</div>
               <div><p className="text-[10px] font-bold text-slate-700">Paper A</p><p className="text-[8px] text-slate-400">142 pages</p></div>
             </div>
             <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 w-[120px] flex items-center gap-2">
               <div className="bg-red-50 text-red-600 text-[6px] font-bold px-1 py-0.5 rounded">PDF</div>
               <div><p className="text-[10px] font-bold text-slate-700">Paper B</p><p className="text-[8px] text-slate-400">96 pages</p></div>
             </div>
             <div className="bg-white p-2.5 rounded-lg shadow-sm border border-slate-200 w-[120px] flex items-center gap-2">
               <div className="bg-red-50 text-red-600 text-[6px] font-bold px-1 py-0.5 rounded">PDF</div>
               <div><p className="text-[10px] font-bold text-slate-700">Paper C</p><p className="text-[8px] text-slate-400">118 pages</p></div>
             </div>
           </div>

           {/* Column 2: Claims */}
           <div className="absolute left-[220px] top-[30px] flex flex-col gap-4 z-10">
             <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 w-[110px]"><div className="w-full h-1.5 bg-blue-100 rounded mb-1"></div><div className="w-2/3 h-1.5 bg-blue-100 rounded"></div></div>
             <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 w-[110px]"><div className="w-full h-1.5 bg-blue-100 rounded mb-1"></div><div className="w-3/4 h-1.5 bg-blue-100 rounded"></div></div>
             <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 w-[110px]"><div className="w-full h-1.5 bg-blue-100 rounded mb-1"></div><div className="w-1/2 h-1.5 bg-blue-100 rounded"></div></div>
             <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 w-[110px]"><div className="w-full h-1.5 bg-blue-100 rounded mb-1"></div><div className="w-4/5 h-1.5 bg-blue-100 rounded"></div></div>
           </div>

           {/* Column 3: AI Node */}
           <div className="absolute left-[450px] top-[115px] w-[90px] h-[90px] bg-white border-2 border-blue-100 p-4 rounded-[1rem] shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col items-center justify-center z-20">
             <LogoIcon className="w-7 h-7 text-blue-600 mb-1.5 animate-pulse" strokeWidth={2.5} />
             <span className="text-[10px] font-bold text-blue-800 text-center leading-tight">AI<br/>Analysis</span>
           </div>

           {/* Column 4: Results */}
           <div className="absolute left-[620px] top-[60px] flex flex-col gap-5 z-10">
             <div className="bg-white p-2 rounded-lg shadow-sm border border-emerald-100 flex items-center gap-2">
               <div className="bg-emerald-500 text-white rounded-full p-0.5"><CheckCircle2 className="w-3 h-3" strokeWidth={3}/></div>
               <span className="text-[9px] font-bold text-emerald-700 pr-2">Supporting</span>
             </div>
             <div className="bg-white p-2 rounded-lg shadow-sm border border-red-100 flex items-center gap-2">
               <div className="bg-red-500 text-white rounded-full p-0.5"><AlertTriangle className="w-3 h-3" strokeWidth={3}/></div>
               <span className="text-[9px] font-bold text-red-700 pr-2">Contradicting</span>
             </div>
             <div className="bg-white p-2 rounded-lg shadow-sm border border-amber-100 flex items-center gap-2">
               <div className="bg-amber-500 text-white rounded-full p-0.5"><LogoIcon className="w-3 h-3" strokeWidth={3}/></div>
               <span className="text-[9px] font-bold text-amber-700 pr-2">Related</span>
             </div>
           </div>

           {/* Labels */}
           <div className="absolute bottom-0 w-full flex justify-between px-4 text-[9px] font-bold text-slate-400">
             <span>Research Papers</span>
             <span className="ml-10">Extracted Claims</span>
             <span className="mr-8 text-blue-400">AI Analysis</span>
             <span className="mr-16">Claim Relationships</span>
             <span>Source Evidence</span>
           </div>
        </div>

        {/* Steps Tracker */}
        <div className="absolute left-[60px] top-[390px] w-[1320px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 p-6 z-20 flex justify-between items-center px-10">
           
           <div className="flex-1 flex flex-col relative">
             <div className="flex items-center gap-4 mb-3 relative z-10">
               <StepIcon active={progress >= 0} complete={progress > 20} icon={FileText} />
               <div className={`flex-1 h-[2px] mr-4 ${progress > 20 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
             </div>
             <span className="text-[10px] font-bold text-slate-400 mb-1">01</span>
             <h4 className="font-bold text-[14px] text-slate-800 mb-1">Extracting Document Text</h4>
             <p className="text-[12px] text-slate-500 mb-2">Reading text from your research papers.</p>
           </div>

           <div className="flex-1 flex flex-col relative">
             <div className="flex items-center gap-4 mb-3 relative z-10">
               <StepIcon active={progress >= 20} complete={progress > 40} icon={Search} />
               <div className={`flex-1 h-[2px] mr-4 ${progress > 40 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
             </div>
             <span className="text-[10px] font-bold text-slate-400 mb-1">02</span>
             <h4 className="font-bold text-[14px] text-slate-800 mb-1">Identifying Scientific Claims</h4>
             <p className="text-[12px] text-slate-500 mb-2">Finding relevant scientific statements.</p>
           </div>

           <div className="flex-1 flex flex-col relative">
             <div className="flex items-center gap-4 mb-3 relative z-10">
               <StepIcon active={progress >= 40} complete={progress > 70} icon={LinkIcon} />
               <div className={`flex-1 h-[2px] mr-4 ${progress > 70 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
             </div>
             <span className="text-[10px] font-bold text-slate-400 mb-1">03</span>
             <h4 className="font-bold text-[14px] text-slate-800 mb-1">Finding Related Claims</h4>
             <p className="text-[12px] text-slate-500 mb-2">Comparing claims based on semantic similarity.</p>
           </div>

           <div className="flex-1 flex flex-col relative">
             <div className="flex items-center gap-4 mb-3 relative z-10">
               <StepIcon active={progress >= 70} complete={progress > 90} icon={BrainCircuit} />
               <div className={`flex-1 h-[2px] mr-4 ${progress > 90 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
             </div>
             <span className="text-[10px] font-bold text-slate-400 mb-1">04</span>
             <h4 className="font-bold text-[14px] text-slate-800 mb-1">Analyzing Relationships</h4>
             <p className="text-[12px] text-slate-500 mb-2">Evaluating whether related claims support, contradict, or remain neutral.</p>
           </div>

           <div className="flex-1 flex flex-col relative">
             <div className="flex items-center gap-4 mb-3 relative z-10">
               <StepIcon active={progress >= 90} complete={progress >= 100} icon={BookOpen} />
             </div>
             <span className="text-[10px] font-bold text-slate-400 mb-1">05</span>
             <h4 className="font-bold text-[14px] text-slate-800 mb-1">Building Evidence Map</h4>
             <p className="text-[12px] text-slate-500 mb-2">Connecting findings to their original papers and page references.</p>
           </div>

        </div>

        {/* Bottom Three Cards Container */}
        <div className="absolute left-[60px] top-[560px] w-[1320px] flex gap-6 z-20">
          
          {/* Main Analyzing Card */}
          <div className="flex-[2] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><BrainCircuit className="w-5 h-5"/></div>
                <div>
                  <p className="text-[12px] font-bold text-slate-400">Currently analyzing</p>
                  <h3 className="text-[18px] font-bold text-slate-800 leading-tight">Comparing related claims</h3>
                </div>
              </div>
              <p className="text-[13px] text-slate-500 mb-8 max-w-[300px]">AI is evaluating relationships between potentially related scientific statements.</p>
              
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[14px] font-bold text-slate-700">Claim pair 42 of 84</p>
                  <p className="text-[14px] font-bold text-slate-500">50%</p>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 w-1/2 rounded-full relative">
                     <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-[1px] bg-slate-100"></div>

            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[12px] font-bold text-slate-400 mb-3">Example comparison</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3 relative">
                <div className="absolute left-4 top-5 w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                <p className="text-[12px] text-slate-700 font-medium pl-4">"Deep learning models significantly improve classification accuracy..."</p>
                <p className="text-[10px] text-slate-400 pl-4 mt-1">Page 12 &bull; Paper A</p>
              </div>
              <div className="flex justify-center -my-1 z-10"><Activity className="w-4 h-4 text-blue-400 bg-white"/></div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                <div className="absolute left-4 top-5 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                <p className="text-[12px] text-slate-700 font-medium pl-4">"Traditional machine learning performs similarly on small datasets..."</p>
                <p className="text-[10px] text-slate-400 pl-4 mt-1">Page 8 &bull; Paper B</p>
              </div>
            </div>
          </div>

          {/* Processing Summary & Info */}
          <div className="flex-1 flex flex-col gap-4">
             <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex-1">
               <h3 className="text-[14px] font-bold text-slate-800 mb-4">Processing Summary</h3>
               <div className="grid grid-cols-4 gap-4">
                 <div className="text-center">
                   <FileText className="w-5 h-5 text-blue-500 mx-auto mb-1"/>
                   <p className="text-[20px] font-bold text-slate-800">3</p>
                   <p className="text-[10px] text-slate-500">Papers</p>
                 </div>
                 <div className="text-center">
                   <span className="font-serif font-bold text-[20px] text-blue-500 block leading-none mb-1">"</span>
                   <p className="text-[20px] font-bold text-slate-800">127</p>
                   <p className="text-[10px] text-slate-500">Claims Found</p>
                 </div>
                 <div className="text-center">
                   <LogoIcon className="w-5 h-5 text-blue-500 mx-auto mb-1"/>
                   <p className="text-[20px] font-bold text-slate-800">84</p>
                   <p className="text-[10px] text-slate-500">Claim Pairs</p>
                 </div>
                 <div className="text-center">
                   <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1"/>
                   <p className="text-[20px] font-bold text-slate-800">42</p>
                   <p className="text-[10px] text-slate-500">Pairs Analyzed</p>
                 </div>
               </div>
             </div>

             <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex gap-4">
               <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                 <Info className="w-4 h-4" />
               </div>
               <div>
                 <h4 className="font-bold text-[13px] text-slate-800 mb-1">Why does this take a moment?</h4>
                 <p className="text-[11px] text-slate-600 leading-relaxed">SciTrace AI compares related claims rather than simply matching keywords. This allows the system to identify relationships even when different papers use different terminology.</p>
               </div>
             </div>
          </div>

        </div>

        {/* Papers Status Row */}
        <div className="absolute left-[60px] top-[790px] w-[860px] flex gap-4 z-20">
          <p className="absolute -top-6 left-0 text-[13px] font-bold text-slate-800">Research Papers</p>
          
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm">
            <div className="bg-slate-50 border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center w-[30px] h-[38px] shrink-0">
               <div className="w-[12px] h-[1px] bg-slate-300 mb-[2px]"></div>
               <div className="w-[12px] h-[1px] bg-slate-300 mb-[2px]"></div>
               <div className="w-[8px] h-[1px] bg-slate-300 self-start ml-[3px]"></div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[11px] text-slate-800 truncate pr-4">Deep Learning for Medical Image Classification</h4>
              <p className="text-[9px] text-slate-500 mb-1">142 pages</p>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                <CheckCircle2 className="w-3 h-3"/> Processed
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm">
            <div className="bg-slate-50 border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center w-[30px] h-[38px] shrink-0">
               <div className="w-[12px] h-[1px] bg-slate-300 mb-[2px]"></div>
               <div className="w-[12px] h-[1px] bg-slate-300 mb-[2px]"></div>
               <div className="w-[8px] h-[1px] bg-slate-300 self-start ml-[3px]"></div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[11px] text-slate-800 truncate pr-4">Comparative Study of Neural Classification Methods</h4>
              <p className="text-[9px] text-slate-500 mb-1">96 pages</p>
              <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px]">
                <RefreshCw className="w-3 h-3 animate-spin"/> Processing
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 flex gap-3 shadow-sm opacity-60">
            <div className="bg-slate-50 border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center w-[30px] h-[38px] shrink-0">
               <div className="w-[12px] h-[1px] bg-slate-300 mb-[2px]"></div>
               <div className="w-[12px] h-[1px] bg-slate-300 mb-[2px]"></div>
               <div className="w-[8px] h-[1px] bg-slate-300 self-start ml-[3px]"></div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[11px] text-slate-800 truncate pr-4">Evaluation of Modern Machine Learning Models</h4>
              <p className="text-[9px] text-slate-500 mb-1">118 pages</p>
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
                <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div> Waiting
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="absolute bottom-[20px] w-full flex justify-center z-30">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
             <ShieldCheck className="w-4 h-4"/>
             <span className="font-bold text-slate-700">AI predictions are not scientific conclusions.</span> SciTrace AI highlights potential relationships between research claims and provides source evidence for further investigation.
          </div>
          </div>
      </main>
    </div>
  );
}
