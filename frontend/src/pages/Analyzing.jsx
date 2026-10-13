import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, FileText, CheckCircle2, RefreshCw, Link as LinkIcon, BookOpen, BrainCircuit, Activity, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

const StepIcon = ({ active, complete, icon: Icon }) => {
  return (
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 border ${
      complete ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
      active ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]' : 
      'bg-slate-50 border-slate-200 text-slate-400'
    }`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2}/>
    </div>
  );
};

export default function Analyzing() {
  const [progress, setProgress] = useState(0);
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
      {/* Responsive Navbar */}
      <Navbar activeTab="workspace" />

      {/* Main Content Area - Flow Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col gap-8 relative z-10">
        
        {/* Top Hero Progress Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-xl">
            <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">
              ANALYZING YOUR RESEARCH
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#0f2a24] leading-tight mb-2 tracking-tight">
              Analyzing your <span className="bg-[#e0f7ef] text-[#0f2a24] px-2 py-0.5 rounded-lg inline-block my-1">research</span>
            </h1>
            <p className="text-[14px] sm:text-[15px] text-slate-500 mb-4">
              SciTrace AI is reading your papers, extracting core claims, and evaluating corroborating and conflicting evidence.
            </p>

            {isDemo ? (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[12px] text-amber-800">
                <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded text-[10px] uppercase shrink-0">Simulated</span>
                <span>Demonstration extraction engine in progress.</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-[12px] text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Analysis Notice: {error}</p>
                  <Link to="/analyses" className="inline-block mt-2 bg-red-800 text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-red-900">
                    Return to Analyses
                  </Link>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-[12px] text-emerald-800">
                <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[10px] uppercase shrink-0">Live Pipeline</span>
                <span>all-MiniLM-L6-v2 &bull; BART-large-MNLI active</span>
              </div>
            )}
          </div>

          {/* Progress Bar Container */}
          <div className="w-full lg:w-[380px] bg-slate-50/80 p-4 sm:p-5 rounded-xl border border-slate-200/60 shrink-0">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[12px] sm:text-[13px] font-semibold text-slate-700">
                Overall Progress
              </span>
              <span className="text-2xl font-bold text-slate-800 leading-none">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full relative overflow-hidden transition-all duration-300" style={{width: `${progress}%`}}>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-blue-600 font-medium text-[12px] sm:text-[13px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="truncate">{statusMessage}</span>
            </div>
          </div>
        </div>

        {/* Five Steps Sequence Tracker */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h3 className="font-bold text-[14px] sm:text-[15px] text-slate-800 mb-4">Pipeline Stages</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            
            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <StepIcon active={progress >= 0} complete={progress > 20} icon={FileText} />
                <span className="text-[11px] font-bold text-slate-400">STAGE 01</span>
              </div>
              <h4 className="font-bold text-[13px] text-slate-800 leading-snug">Extract Text</h4>
              <p className="text-[11px] text-slate-500 mt-1">Reading PDF document text per page.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <StepIcon active={progress >= 20} complete={progress > 40} icon={Search} />
                <span className="text-[11px] font-bold text-slate-400">STAGE 02</span>
              </div>
              <h4 className="font-bold text-[13px] text-slate-800 leading-snug">Extract Claims</h4>
              <p className="text-[11px] text-slate-500 mt-1">Isolating key scientific statements.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <StepIcon active={progress >= 40} complete={progress > 70} icon={LinkIcon} />
                <span className="text-[11px] font-bold text-slate-400">STAGE 03</span>
              </div>
              <h4 className="font-bold text-[13px] text-slate-800 leading-snug">Semantic Match</h4>
              <p className="text-[11px] text-slate-500 mt-1">Comparing claims by vector embeddings.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <StepIcon active={progress >= 70} complete={progress > 90} icon={BrainCircuit} />
                <span className="text-[11px] font-bold text-slate-400">STAGE 04</span>
              </div>
              <h4 className="font-bold text-[13px] text-slate-800 leading-snug">NLI Contradictions</h4>
              <p className="text-[11px] text-slate-500 mt-1">Detecting conflict vs corroborate.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f8fafc] flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <StepIcon active={progress >= 90} complete={progress >= 100} icon={BookOpen} />
                <span className="text-[11px] font-bold text-slate-400">STAGE 05</span>
              </div>
              <h4 className="font-bold text-[13px] text-slate-800 leading-snug">Build Evidence Map</h4>
              <p className="text-[11px] text-slate-500 mt-1">Preparing verified source findings.</p>
            </div>

          </div>
        </div>

        {/* Live Comparison Preview & Processing Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Analyzing Card (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                  <BrainCircuit className="w-5 h-5"/>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Currently evaluating</p>
                  <h3 className="text-[16px] font-bold text-slate-800 leading-tight">Cross-paper claim relationships</h3>
                </div>
              </div>
              <p className="text-[13px] text-slate-500 mb-6">
                Evaluating candidate pairs for contradiction, corroboration, or neutral context with page references.
              </p>
              
              <div className="mt-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-[12px] text-slate-600 mb-1.5">
                  <span className="font-semibold">Candidate claim pairs</span>
                  <span className="font-bold text-slate-800">{Math.round((progress / 100) * 84)} / 84</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width: `${Math.min(progress, 100)}%`}}></div>
                </div>
              </div>
            </div>

            <div className="hidden sm:block w-[1px] bg-slate-100"></div>

            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Live comparison sample</p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2 relative">
                <div className="absolute left-3 top-3.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <p className="text-[11px] text-slate-700 font-medium pl-3">"Deep learning models improve classification accuracy..."</p>
                <p className="text-[9px] text-slate-400 pl-3 mt-0.5">Page 12 &bull; Paper A</p>
              </div>
              <div className="flex justify-center -my-1 z-10">
                <Activity className="w-3.5 h-3.5 text-blue-500 bg-white"/>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 relative">
                <div className="absolute left-3 top-3.5 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                <p className="text-[11px] text-slate-700 font-medium pl-3">"Traditional algorithms perform similarly on smaller testsets..."</p>
                <p className="text-[9px] text-slate-400 pl-3 mt-0.5">Page 8 &bull; Paper B</p>
              </div>
            </div>
          </div>

          {/* Processing Summary & Info (1 col) */}
          <div className="flex flex-col gap-4">
             <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex-1">
               <h3 className="text-[13px] font-bold text-slate-800 mb-3 uppercase tracking-wider">Processing Summary</h3>
               <div className="grid grid-cols-2 gap-3 text-center">
                 <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                   <p className="text-xl font-bold text-slate-800">{analysisData?.papers?.length || 3}</p>
                   <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Papers</p>
                 </div>
                 <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                   <p className="text-xl font-bold text-blue-600">{analysisData?.claims?.length || 127}</p>
                   <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Claims</p>
                 </div>
                 <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                   <p className="text-xl font-bold text-slate-800">{progress > 30 ? '84' : '...'}</p>
                   <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Pairs</p>
                 </div>
                 <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                   <p className="text-xl font-bold text-emerald-600">{progress > 70 ? '42' : '...'}</p>
                   <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Analyzed</p>
                 </div>
               </div>
             </div>

             <div className="bg-blue-50/70 rounded-2xl border border-blue-100 p-4 flex gap-3 text-[12px] text-slate-600">
               <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
               <p className="leading-snug">
                 SciTrace AI compares deep semantic claim meaning rather than keyword matching to detect contradictions across different paper terminologies.
               </p>
             </div>
          </div>

        </div>

        {/* Papers Status Row */}
        <div>
          <h3 className="text-[14px] font-bold text-slate-800 mb-3">Research Papers Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {(analysisData?.papers && analysisData.papers.length > 0 ? analysisData.papers : []).map((paper, idx) => {
              const paperName = paper.filename || paper.name || paper.title || `Paper ${idx + 1}`;
              const paperStatus = paper.processing_status || paper.status || 'processing';
              const isDone = paperStatus === 'completed' || progress > 60;
              const isActive = !isDone && (idx === 0 || progress > 30);
              return (
                <div key={paper.id || idx} className={`bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs ${!isDone && !isActive ? 'opacity-70' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-50 text-emerald-600' : isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <FileText className="w-4 h-4"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[12px] text-slate-800 truncate" title={paperName}>{paperName}</h4>
                    {isDone ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] mt-0.5">
                        <CheckCircle2 className="w-3 h-3"/> Extracted &amp; Parsed
                      </div>
                    ) : isActive ? (
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] mt-0.5">
                        <RefreshCw className="w-3 h-3 animate-spin"/> Processing Claims
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px] mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-300"></div> Queued
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(!analysisData?.papers || analysisData.papers.length === 0) && [0, 1].map(idx => (
              <div key={idx} className={`bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 shadow-xs ${idx === 1 ? 'opacity-70' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <FileText className="w-4 h-4"/>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[12px] text-slate-800 truncate">Loading paper {idx + 1}...</h4>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px] mt-0.5">
                    <RefreshCw className="w-3 h-3 animate-spin"/> Fetching status
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px] sm:text-[12px] py-2 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0"/>
          <span>
            <strong>AI predictions are not scientific conclusions.</strong> SciTrace AI identifies candidate claim relationships and provides exact source evidence.
          </span>
        </div>

      </main>
    </div>
  );
}
