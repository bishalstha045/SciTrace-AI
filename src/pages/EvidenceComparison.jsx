import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Search, FileText, AlertTriangle, CheckCircle2, Copy, ExternalLink, Box, ArrowRight, ArrowLeft } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import ProfileMenu from '../components/ProfileMenu';

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

export default function EvidenceComparison() {
  const [scale, setScale] = useState(1);
  const { analysisId, relationshipId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1440;
      setScale(scaleX > 1 ? 1 : scaleX);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await mockAnalysisService.getAnalysisById(analysisId || 'demo-analysis');
        setAnalysis(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading evidence...</div>;
  if (!analysis) return <div className="p-10 text-center font-bold text-red-500">Analysis not found.</div>;

  const relId = relationshipId || 'rel-1';
  const rel = analysis.relationships?.find(r => r.id === relId) || analysis.relationships[0];
  if (!rel) return <div className="p-10 text-center font-bold text-red-500">Relationship not found.</div>;

  const sourceClaim = analysis.claims?.find(c => c.id === rel.sourceClaimId);
  const targetClaim = analysis.claims?.find(c => c.id === rel.targetClaimId);
  const sourcePaper = analysis.papers?.find(p => p.id === sourceClaim?.paperId);
  const targetPaper = analysis.papers?.find(p => p.id === targetClaim?.paperId);

  const isContradiction = rel.type === 'contradiction';
  const isSupporting = rel.type === 'supporting';

  const currentIndex = analysis.relationships?.findIndex(r => r.id === relId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (analysis.relationships?.length - 1);

  const goToRelationship = (dir) => {
    if (dir === 'prev' && hasPrev) {
      navigate(`/analysis/${analysisId}/evidence/${analysis.relationships[currentIndex - 1].id}`);
    } else if (dir === 'next' && hasNext) {
      navigate(`/analysis/${analysisId}/evidence/${analysis.relationships[currentIndex + 1].id}`);
    }
  };

  const handleCopyCitation = (claim, paper) => {
    if (!claim || !paper) return;
    const citation = `"${claim.text}" - ${paper.title}, Page ${claim.page}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(claim.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full bg-[#f8fafc] overflow-x-hidden flex justify-center font-sans" style={{ minHeight: '100vh', height: `${1000 * scale}px` }}>
      <div 
        className="relative bg-[#f8fafc] shrink-0 origin-top" 
        style={{ width: '1440px', height: '1000px', transform: `scale(${scale})` }}
      >
        {/* Navbar */}
        <nav className="absolute top-0 left-0 w-full h-[80px] flex items-center justify-between px-[60px] z-50 border-b border-slate-200/50 bg-white">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <LogoIcon className="w-7 h-7 text-[#0f2a24]" strokeWidth={2} />
            <span className="font-serif font-bold text-[#0f2a24] text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </Link>

          <div className="flex items-center gap-10">
            <div className="relative h-full flex items-center">
              <Link to="/analyses" className="text-slate-900 font-semibold text-[14px] cursor-pointer pt-7 pb-7">Workspace</Link>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>
            </div>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Analyses</Link>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Papers</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/analyses" title="Search Analyses" className="text-slate-400 hover:text-slate-600">
              <Search className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link to={`/analysis/${analysisId || 'demo'}/results`} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-50 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Results
            </Link>
            <ProfileMenu />
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="absolute left-[60px] top-[120px] w-[1320px] flex flex-col">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 Workspace <ChevronRight className="w-3 h-3"/> Analysis Results <ChevronRight className="w-3 h-3"/> Evidence Comparison
              </div>
              <h1 className="text-[32px] font-serif text-[#0f2a24] leading-none tracking-tight">
                Evidence Comparison
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => goToRelationship('prev')}
                 disabled={!hasPrev}
                 className={`border border-slate-200 px-3 py-2 rounded-lg font-medium text-[13px] flex items-center gap-1.5 shadow-sm transition-colors ${hasPrev ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
               >
                 <ArrowLeft className="w-4 h-4"/> Previous
               </button>
               <button 
                 onClick={() => goToRelationship('next')}
                 disabled={!hasNext}
                 className={`border border-slate-200 px-3 py-2 rounded-lg font-medium text-[13px] flex items-center gap-1.5 shadow-sm transition-colors ${hasNext ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
               >
                 Next <ArrowRight className="w-4 h-4"/>
               </button>
            </div>
          </div>

          <div className="flex gap-8">
            
            {/* Side-by-Side Comparison */}
            <div className="flex-[2] flex gap-4">
               {/* Paper A */}
               <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                 <div className="flex items-start gap-3 mb-6 border-b border-slate-100 pb-4">
                   <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5"/></div>
                   <div>
                     <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-0.5">Paper A</p>
                     <h3 className="font-bold text-[14px] text-blue-700 leading-snug">{sourcePaper?.title}</h3>
                     <p className="text-[12px] text-slate-500 mt-1">Page {sourceClaim?.page}</p>
                   </div>
                 </div>

                 <div className="mb-6">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Extracted Claim</p>
                   <p className="text-[15px] text-slate-800 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                     "{sourceClaim?.text}"
                   </p>
                 </div>

                 <div className="flex-1">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Source Evidence</p>
                   <div className="bg-white border border-slate-200 p-5 rounded-xl text-[13px] text-slate-600 leading-loose shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)] relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-xl"></div>
                      {rel.evidence?.source?.text || sourceClaim?.text}
                   </div>
                 </div>
                 
                 <div className="mt-6 flex gap-3">
                   <Link to={`/analysis/${analysis.id}/paper/${sourcePaper?.id}`} className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-slate-50 shadow-sm transition-colors"><ExternalLink className="w-4 h-4"/> Open Paper</Link>
                   <button 
                     onClick={() => handleCopyCitation(sourceClaim, sourcePaper)}
                     title="Copy Citation"
                     className="bg-white border border-slate-200 text-slate-500 px-4 py-2.5 rounded-lg shadow-sm hover:text-slate-800 transition-colors"
                   >
                     {copiedId === sourceClaim?.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                   </button>
                 </div>
               </div>

               {/* Center Relationship Indicator */}
               <div className="w-16 shrink-0 flex flex-col items-center pt-[150px]">
                 <div className={`w-12 h-12 bg-white border rounded-full flex items-center justify-center shadow-sm z-10 ${isContradiction ? 'border-red-200 text-red-500' : isSupporting ? 'border-emerald-200 text-emerald-500' : 'border-slate-200 text-slate-500'}`}>
                   {isContradiction ? <AlertTriangle className="w-5 h-5"/> : isSupporting ? <CheckCircle2 className="w-5 h-5"/> : <LogoIcon className="w-5 h-5"/>}
                 </div>
                 <div className={`w-[1px] h-20 -mt-2 ${isContradiction ? 'bg-red-200' : isSupporting ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
                 <div className={`${isContradiction ? 'bg-red-50 border-red-100 text-red-700' : isSupporting ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-700'} border text-[10px] font-bold px-2 py-1 rounded text-center -mt-2 z-10`}>
                   {isContradiction ? <>Potential<br/>Contradiction</> : isSupporting ? <>Supporting<br/>Evidence</> : <>Neutral</>}
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 mt-2">{rel.confidence}%</div>
               </div>

               {/* Paper B */}
               <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col opacity-95">
                 <div className="flex items-start gap-3 mb-6 border-b border-slate-100 pb-4">
                   <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5"/></div>
                   <div>
                     <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-0.5">Paper B</p>
                     <h3 className="font-bold text-[14px] text-blue-700 leading-snug">{targetPaper?.title}</h3>
                     <p className="text-[12px] text-slate-500 mt-1">Page {targetClaim?.page}</p>
                   </div>
                 </div>

                 <div className="mb-6">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Extracted Claim</p>
                   <p className="text-[15px] text-slate-800 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                     "{targetClaim?.text}"
                   </p>
                 </div>

                 <div className="flex-1">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Source Evidence</p>
                   <div className="bg-white border border-slate-200 p-5 rounded-xl text-[13px] text-slate-600 leading-loose shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)] relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-l-xl"></div>
                      {rel.evidence?.target?.text || targetClaim?.text}
                   </div>
                 </div>

                 <div className="mt-6 flex gap-3">
                   <Link to={`/analysis/${analysis.id}/paper/${targetPaper?.id}`} className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-slate-50 shadow-sm transition-colors"><ExternalLink className="w-4 h-4"/> Open Paper</Link>
                   <button 
                     onClick={() => handleCopyCitation(targetClaim, targetPaper)}
                     title="Copy Citation"
                     className="bg-white border border-slate-200 text-slate-500 px-4 py-2.5 rounded-lg shadow-sm hover:text-slate-800 transition-colors"
                   >
                     {copiedId === targetClaim?.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                   </button>
                 </div>
               </div>
            </div>

            {/* Right Column - Analysis Info */}
            <div className="flex-[0.8] flex flex-col gap-4">
              
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center gap-3 mb-3 border-b border-blue-200/50 pb-3">
                   <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><LogoIcon className="w-4 h-4" strokeWidth={2}/></div>
                   <h4 className="font-bold text-[15px] text-blue-900">AI Relationship Analysis</h4>
                 </div>
                 <p className="text-[13px] text-slate-700 leading-relaxed mb-4">
                   {isContradiction ? "These claims appear to make incompatible statements. " : isSupporting ? "These claims appear to support each other. " : "These claims appear related but the relationship is neutral. "}
                   Paper A states "{sourceClaim?.text}" while Paper B states "{targetClaim?.text}".
                 </p>
                 <div className="bg-white/60 p-3 rounded-lg border border-blue-100/50">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Confidence Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden"><div className="w-[87%] h-full bg-blue-500 rounded-full" style={{width: `${rel.confidence}%`}}></div></div>
                      <span className="text-[12px] font-bold text-blue-700">{rel.confidence}%</span>
                    </div>
                 </div>
              </div>

              {rel.contextDifferences?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Box className="w-4 h-4"/></div>
                     <h4 className="font-bold text-[15px] text-amber-900">Possible Context Differences</h4>
                   </div>
                   <p className="text-[12px] text-slate-600 mb-4">The difference might be explained by methodology or context:</p>
                   
                   <ul className="space-y-2">
                     {rel.contextDifferences.map((diff, i) => (
                       <li key={i} className="flex items-start gap-2 bg-white/60 border border-amber-100 p-2.5 rounded-lg">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                         <span className="text-[13px] font-medium text-amber-900">{diff}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-auto">
                 <h4 className="font-bold text-[14px] text-slate-800 mb-4">Evidence Traceability</h4>
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">Analysis ID</span>
                     <span className="font-mono text-slate-800 font-medium">{analysisId || 'demo-analysis'}</span>
                   </div>
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">Relationship ID</span>
                     <span className="font-mono text-slate-800 font-medium">{rel.id}</span>
                   </div>
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">Extracted</span>
                     <span className="text-slate-800 font-medium">{new Date(analysis.updatedAt).toLocaleDateString()}</span>
                   </div>
                 </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
