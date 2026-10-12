import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, FileText, AlertTriangle, CheckCircle2, Copy, ExternalLink, Box, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { analysisApi } from '../services/api';
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
  const { analysisId, relationshipId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = analysisId || 'demo-analysis';
        const res = await analysisApi.getAnalysisById(id);
        if (res.success && res.data) {
          setAnalysis(res.data);
        } else {
          const fallback = await mockAnalysisService.getAnalysisById(id);
          setAnalysis(fallback);
        }
      } catch (err) {
        console.error("Evidence analysis fetch error:", err);
        try {
          const fallback = await mockAnalysisService.getAnalysisById(analysisId || 'demo-analysis');
          setAnalysis(fallback);
        } catch {
          setError(err.message || "Analysis not found");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  const activeAnalysisId = analysis?.id || analysisId || 'demo-analysis';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[15px] font-bold text-slate-700">Loading evidence comparison...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-[22px] font-serif font-bold text-slate-800 mb-2">Analysis Not Found</h2>
          <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
            The analysis you requested is not available. You can view the demo results or go back to your workspace.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/analysis/demo-analysis/results" className="bg-[#0b1f1b] text-white py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-900 transition-colors">
              Open Demo Results
            </Link>
            <Link to="/analyses" className="bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-colors">
              Back to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const relationships = analysis.relationships || [];
  const targetRelId = relationshipId || relationships[0]?.id;
  const rel = relationships.find(r => r.id === targetRelId) || relationships[0];

  if (!rel) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Info className="w-7 h-7" />
          </div>
          <h2 className="text-[22px] font-serif font-bold text-slate-800 mb-2">Relationship Not Found</h2>
          <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
            This analysis does not contain the specified relationship record.
          </p>
          <Link to={`/analysis/${activeAnalysisId}/results`} className="inline-block bg-[#0b1f1b] text-white px-6 py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-900 transition-colors">
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  const sourceClaim = analysis.claims?.find(c => c.id === (rel.sourceClaimId || rel.source_claim_id)) || {
    id: rel.source_claim_id,
    text: rel.source_claim_text || '',
    page: rel.source_page_number || 1,
    paperId: rel.source_paper_id,
  };
  const targetClaim = analysis.claims?.find(c => c.id === (rel.targetClaimId || rel.target_claim_id)) || {
    id: rel.target_claim_id,
    text: rel.target_claim_text || '',
    page: rel.target_page_number || 1,
    paperId: rel.target_paper_id,
  };
  const sourcePaper = analysis.papers?.find(p => p.id === (sourceClaim?.paperId || rel.source_paper_id)) || {
    id: sourceClaim?.paperId || rel.source_paper_id,
    title: 'Paper A',
  };
  const targetPaper = analysis.papers?.find(p => p.id === (targetClaim?.paperId || rel.target_paper_id)) || {
    id: targetClaim?.paperId || rel.target_paper_id,
    title: 'Paper B',
  };

  const isContradiction = rel.type === 'contradiction';
  const isSupporting = rel.type === 'supporting';

  const currentIndex = relationships.findIndex(r => r.id === rel.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < (relationships.length - 1);

  const goToRelationship = (dir) => {
    if (dir === 'prev' && hasPrev) {
      navigate(`/analysis/${activeAnalysisId}/evidence/${relationships[currentIndex - 1].id}`);
    } else if (dir === 'next' && hasNext) {
      navigate(`/analysis/${activeAnalysisId}/evidence/${relationships[currentIndex + 1].id}`);
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
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 w-full h-[80px] flex items-center justify-between px-6 lg:px-[60px] z-50 border-b border-slate-200/50 bg-white">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <LogoIcon className="w-7 h-7 text-emerald-500" strokeWidth={2} />
            <span className="font-serif font-bold text-[#0f2a24] text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </Link>

          <div className="flex items-center gap-10">
            <div className="relative h-full flex items-center">
              <Link to="/analyses" className="text-slate-900 font-semibold text-[14px] cursor-pointer pt-7 pb-7">Workspace</Link>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>
            </div>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Analyses</Link>
            <Link to="/papers" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Papers</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link to={`/analysis/${activeAnalysisId}/results`} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-50 flex items-center gap-2 transition-colors">
              <ChevronLeft className="w-4 h-4"/> Back to Results
            </Link>
            <ProfileMenu />
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-[60px] py-10 flex flex-col flex-1">
          
          {/* Demonstration Notice */}
          {(analysis.id === 'demo-analysis' || analysis.isDemo || analysis.isSimulation) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6 flex items-center justify-between text-[12px] text-amber-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Demonstration Mode:</strong> Claims and source excerpts shown below are from the demonstration corpus.</span>
              </div>
              <Link to={`/analysis/${activeAnalysisId}/results`} className="font-bold text-amber-900 hover:underline">
                View All Results &rarr;
              </Link>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2 flex-wrap">
                 <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link> 
                 <ChevronRight className="w-3 h-3"/> 
                 <Link to={`/analysis/${activeAnalysisId}/results`} className="hover:text-emerald-500 transition-colors">Analysis Results</Link> 
                 <ChevronRight className="w-3 h-3"/> 
                 <span className="text-slate-700 font-semibold">Evidence Comparison ({currentIndex + 1} of {relationships.length})</span>
              </div>
              <h1 className="text-[32px] font-serif text-[#0f2a24] leading-none tracking-tight">
                Evidence Comparison
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => goToRelationship('prev')}
                 disabled={!hasPrev}
                 className={`border border-slate-200 px-3 py-2 rounded-lg font-medium text-[13px] flex items-center gap-1.5 shadow-sm transition-colors ${hasPrev ? 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
               >
                 <ArrowLeft className="w-4 h-4"/> Previous
               </button>
               <span className="text-[12px] font-medium text-slate-500 px-1">
                 {currentIndex + 1} / {relationships.length}
               </span>
               <button 
                 onClick={() => goToRelationship('next')}
                 disabled={!hasNext}
                 className={`border border-slate-200 px-3 py-2 rounded-lg font-medium text-[13px] flex items-center gap-1.5 shadow-sm transition-colors ${hasNext ? 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
               >
                 Next <ArrowRight className="w-4 h-4"/>
               </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Side-by-Side Comparison */}
            <div className="flex-[2] flex flex-col md:flex-row gap-4">
               {/* Paper A */}
               <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
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
                      {sourceClaim?.source_evidence || sourceClaim?.sourceEvidence || rel.evidence?.source?.text ? (
                        <span>"{sourceClaim?.source_evidence || sourceClaim?.sourceEvidence || rel.evidence?.source?.text}"</span>
                      ) : (
                        <div className="text-slate-400 italic">Direct surrounding context not recorded in extraction index; refer to original document on Page {sourceClaim?.page || 1}.</div>
                      )}
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
               <div className="md:w-16 shrink-0 flex md:flex-col items-center justify-center md:pt-[150px] relative py-4 md:py-0">
                 <div className={`hidden md:block w-[1px] h-20 absolute top-[180px] -z-10 ${isContradiction ? 'bg-red-200' : isSupporting ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
                 <div className={`w-12 h-12 bg-white border rounded-full flex items-center justify-center shadow-sm z-10 relative ${isContradiction ? 'border-red-200 text-red-500' : isSupporting ? 'border-emerald-200 text-emerald-500' : 'border-slate-200 text-slate-500'}`}>
                   {isContradiction ? <AlertTriangle className="w-5 h-5"/> : isSupporting ? <CheckCircle2 className="w-5 h-5"/> : <LogoIcon className="w-5 h-5"/>}
                 </div>
                 <div className={`md:hidden absolute w-full h-[1px] left-0 top-1/2 -z-10 ${isContradiction ? 'bg-red-200' : isSupporting ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
                 
                 <div className={`${isContradiction ? 'bg-red-50 border-red-100 text-red-700' : isSupporting ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-700'} border text-[10px] font-bold px-2 py-1 rounded text-center md:-mt-2 z-10 bg-white ml-2 md:ml-0`}>
                   {isContradiction ? <>Potential<br className="hidden md:block"/>Contradiction</> : isSupporting ? <>Supporting<br className="hidden md:block"/>Evidence</> : <>Neutral</>}
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 md:mt-2 ml-2 md:ml-0">{rel.confidence}%</div>
               </div>

               {/* Paper B */}
               <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col opacity-95 min-w-0">
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
                      {targetClaim?.source_evidence || targetClaim?.sourceEvidence || rel.evidence?.target?.text ? (
                        <span>"{targetClaim?.source_evidence || targetClaim?.sourceEvidence || rel.evidence?.target?.text}"</span>
                      ) : (
                        <div className="text-slate-400 italic">Direct surrounding context not recorded in extraction index; refer to original document on Page {targetClaim?.page || 1}.</div>
                      )}
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
                   <h4 className="font-bold text-[15px] text-blue-900">
                     {analysis.isSimulation || analysis.id === 'demo-analysis' ? 'AI Relationship Analysis (Demo)' : 'AI Relationship Analysis'}
                   </h4>
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

              {rel.contextDifferences?.length > 0 ? (
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
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                   <div className="flex items-center gap-2.5 mb-2">
                     <div className="w-7 h-7 rounded-full bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0"><Info className="w-4 h-4"/></div>
                     <h4 className="font-bold text-[13px] text-slate-800">Contextual Differences</h4>
                   </div>
                   <p className="text-[11px] text-slate-500 leading-relaxed">
                     No explicit methodological divergence was extracted for this claim pair. Review the experimental sections of both papers to examine assay conditions and sample sizes.
                   </p>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-auto">
                 <h4 className="font-bold text-[14px] text-slate-800 mb-4">Evidence Traceability & Provenance</h4>
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">Analysis ID</span>
                     <span className="font-mono text-slate-800 font-medium truncate max-w-[150px]">{analysisId || 'demo-analysis'}</span>
                   </div>
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">Relationship ID</span>
                     <span className="font-mono text-slate-800 font-medium truncate max-w-[150px]">{rel.id}</span>
                   </div>
                   {rel.similarity_score !== undefined && rel.similarity_score !== null && (
                     <div className="flex justify-between items-center text-[12px]">
                       <span className="text-slate-500">Cosine Similarity</span>
                       <span className="font-mono text-blue-700 font-semibold">{(rel.similarity_score * 100).toFixed(1)}%</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">Similarity Model</span>
                     <span className="font-mono text-slate-700 text-[11px] truncate max-w-[150px]">{rel.model_metadata?.similarity_model || 'all-MiniLM-L6-v2'}</span>
                   </div>
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">NLI Model</span>
                     <span className="font-mono text-slate-700 text-[11px] truncate max-w-[150px]">{rel.model_metadata?.model_name || 'BART-large-MNLI'}</span>
                   </div>
                   <div className="flex justify-between items-center text-[12px]">
                     <span className="text-slate-500">Timestamp</span>
                     <span className="text-slate-800 font-medium">{new Date(rel.created_at || analysis.updatedAt || Date.now()).toLocaleDateString()}</span>
                   </div>
                 </div>
              </div>

            </div>

          </div>
        </main>

    </div>
  );
}
