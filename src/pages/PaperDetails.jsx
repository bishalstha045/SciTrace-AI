import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Download, FileText, CheckCircle2, AlertTriangle, BookOpen, Share2, MoreVertical, ExternalLink, Activity, Info, X } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { analysisApi } from '../services/api';
import { getPaperStats } from '../utils/analysisStats';
import Navbar from '../components/Navbar';

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

export default function PaperDetails() {
  const { analysisId, paperId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClaimType, setFilterClaimType] = useState('all');
  const [sortClaimsBy, setSortClaimsBy] = useState('page');
  const [showModal, setShowModal] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);
  const [selectedPage, setSelectedPage] = useState('all');

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const isDemo = !analysisId || analysisId === 'demo-analysis' || analysisId === 'demo' || analysisId === 'demo_analysis';
        if (isDemo) {
          const data = await mockAnalysisService.getAnalysisById('demo-analysis');
          setAnalysis(data);
          return;
        }

        const res = await analysisApi.getAnalysisResults(analysisId);
        if (res.success && res.data) {
          const raw = res.data;
          const analysisObj = raw.analysis || raw;
          const merged = {
            ...analysisObj,
            createdAt: analysisObj.created_at || analysisObj.createdAt,
            papers: (raw.papers || analysisObj.papers || []).map(p => ({
              ...p,
              title: p.title || p.filename || p.name || 'Untitled Document',
              name: p.filename || p.name || 'Untitled Document',
              pageCount: p.page_count || p.pageCount || 1,
              pages: p.page_count || p.pages || 1,
              year: p.year || new Date().getFullYear(),
              authors: p.authors || [],
            })),
            claims: (raw.claims || analysisObj.claims || []).map(c => ({
              ...c,
              text: c.claim_text || c.text || '',
              claim_text: c.claim_text || c.text || '',
              page: c.page_number || c.page || 1,
              page_number: c.page_number || c.page || 1,
              paperId: c.paper_id || c.paperId || '',
              paper_id: c.paper_id || c.paperId || '',
              section: c.section_name || c.section || '',
            })),
            relationships: (raw.relationships || analysisObj.relationships || []).map(r => ({
              ...r,
              type: r.classification || r.type || 'related',
              sourceClaimId: r.source_claim_id || r.sourceClaimId,
              targetClaimId: r.target_claim_id || r.targetClaimId,
              confidence: r.confidence || r.confidence_score || 50,
            })),
          };
          setAnalysis(merged);
        } else {
          setError(res.error || "Analysis not found or could not be loaded.");
        }
      } catch (err) {
        console.error("PaperDetails fetch error:", err);
        setError(err.message || "Failed to load paper details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[15px] font-bold text-slate-700">Loading paper details...</p>
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
            The analysis record could not be loaded. You can view the demo results or go back to your workspace.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/analysis/demo-analysis/results" className="bg-[#0b1f1b] text-white py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-900 transition-colors">
              Open Demo Analysis
            </Link>
            <Link to="/analyses" className="bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-colors">
              Back to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const targetPaperId = paperId || analysis.papers?.[0]?.id || 'paper-A';
  const paperStats = getPaperStats(analysis, targetPaperId);
  
  if (!paperStats || !paperStats.paper) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-[22px] font-serif font-bold text-slate-800 mb-2">Paper Not Found</h2>
          <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
            The paper ID "{targetPaperId}" was not found in this analysis.
          </p>
          <div className="flex flex-col gap-2">
            <Link to={`/analysis/${analysis.id}/results`} className="bg-[#0b1f1b] text-white py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-900 transition-colors">
              Back to Analysis Results
            </Link>
            {analysis.papers?.[0] && (
              <Link to={`/analysis/${analysis.id}/paper/${analysis.papers[0].id}`} className="bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-colors">
                View First Paper ({analysis.papers[0].title.substring(0, 20)}...)
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { paper, paperClaims, paperRelationships, supporting, contradictions, neutral, distinctPages } = paperStats;
  const supportingCount = supporting.length;
  const contradictionCount = contradictions.length;
  const neutralCount = neutral.length;

  const getFilteredClaims = () => {
    let result = paperClaims.filter(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedPage !== 'all') {
      result = result.filter(c => c.page === selectedPage);
    }

    if (filterClaimType !== 'all') {
      result = result.filter(c => {
        const rels = paperRelationships.filter(r => r.sourceClaimId === c.id || r.targetClaimId === c.id);
        if (filterClaimType === 'contradiction') return rels.some(r => r.type === 'contradiction');
        if (filterClaimType === 'supporting') return rels.some(r => r.type === 'supporting');
        if (filterClaimType === 'neutral') return rels.length === 0 || rels.every(r => r.type !== 'contradiction' && r.type !== 'supporting');
        return true;
      });
    }

    if (sortClaimsBy === 'page') {
      result.sort((a, b) => a.page - b.page);
    } else if (sortClaimsBy === 'length') {
      result.sort((a, b) => b.text.length - a.text.length);
    }

    return result;
  };

  const filteredClaims = getFilteredClaims();

  // Find relationships for a specific claim
  const getRelationshipsForClaim = (claimId) => {
    return paperRelationships.filter(r => r.sourceClaimId === claimId || r.targetClaimId === claimId);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col overflow-x-hidden">
      {/* Responsive Navbar */}
      <Navbar 
        activeTab="papers" 
        actions={
          <>
            <Link to={`/analysis/${analysis.id}/results`} className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-medium text-[13px] hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs">
              <ChevronLeft className="w-4 h-4"/> Back to Results
            </Link>
            <Link to={`/analysis/${analysis.id}/export`} className="bg-[#0b1f1b] text-white px-4 py-1.5 rounded-lg font-medium text-[13px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-1.5">
              Export <Download className="w-4 h-4"/>
            </Link>
          </>
        }
      />

      {/* Main Content Area */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[60px] py-6 sm:py-10 flex flex-col flex-1">
        
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
           <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link> 
           <ChevronRight className="w-3 h-3 text-slate-400"/> 
           <Link to={`/analysis/${analysis.id}/results`} className="hover:text-emerald-500 transition-colors">Analysis Results</Link> 
           <ChevronRight className="w-3 h-3 text-slate-400"/> 
           <span className="text-slate-700 font-semibold">Paper Details</span>
        </div>

        {/* Demonstration Notice */}
        {(analysis.id === 'demo-analysis' || analysis.isDemo || analysis.isSimulation) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-amber-800 shadow-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Demonstration Mode:</strong> Extracted claims and statistics shown for this paper are simulated demo data.</span>
            </div>
            <Link to={`/analysis/${analysis.id}/results`} className="font-bold text-amber-900 hover:underline shrink-0">
              Back to Results &rarr;
            </Link>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start shadow-xs mb-6 gap-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
            {/* Paper Icon */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center w-[60px] sm:w-[70px] h-[80px] sm:h-[90px] shrink-0 shadow-xs relative">
              <div className="w-[28px] h-[2px] bg-slate-300 mb-[4px] rounded-full"></div>
              <div className="w-[28px] h-[2px] bg-slate-300 mb-[4px] rounded-full"></div>
              <div className="w-[18px] h-[2px] bg-slate-300 mb-[4px] rounded-full self-start ml-[6px]"></div>
              <div className="w-[28px] h-[2px] bg-slate-300 mb-[4px] rounded-full"></div>
              <div className="w-[28px] h-[2px] bg-slate-300 rounded-full"></div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-[#e11d48] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs z-10">PDF</div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-[32px] font-serif text-[#0f2a24] leading-tight mb-1">
                {paper.title}
              </h1>
              <p className="text-[13px] sm:text-[14px] text-slate-500 mb-4">Research Paper</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[12px] sm:text-[13px] text-slate-600">
                  <div className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> {paper.pages || '?'} pages</div>
                  <div className="flex items-center gap-1.5"><LogoIcon className="w-4 h-4"/> {paperClaims.length} claims extracted</div>
                  <div className="flex items-center gap-1.5"><Share2 className="w-4 h-4"/> {paperRelationships.length} related claims</div>
                  {contradictionCount > 0 && <div className="flex items-center gap-1.5 text-red-600"><AlertTriangle className="w-4 h-4"/> {contradictionCount} potential contradictions</div>}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
                   <CheckCircle2 className="w-4 h-4"/>
                   <span className="text-[12px] font-bold">Analysis Complete</span>
                 </div>
              </div>
              <p className="text-[11px] text-slate-400">Analyzed {new Date(analysis.updatedAt).toLocaleDateString()}</p>
              
              <div className="flex gap-3">
                <Link to={`/analysis/${analysis.id}/export`} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-[13px] hover:bg-slate-50 flex items-center gap-2 shadow-sm">
                  <Download className="w-4 h-4"/> Export Paper Analysis
                </Link>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-[#0b1f1b] text-white px-4 py-2 rounded-lg font-medium text-[13px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4"/> Open Paper
                </button>
              </div>
            </div>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm text-center md:text-left">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><FileText className="w-5 h-5"/></div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 mb-0.5">Claims</p>
                <h3 className="text-[26px] font-bold text-slate-800 leading-none mb-1">{paperClaims.length}</h3>
                <p className="text-[11px] text-slate-500 leading-tight">Scientific statements<br/>identified.</p>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm text-center md:text-left">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100"><Share2 className="w-5 h-5"/></div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 mb-0.5">Related Claims</p>
                <h3 className="text-[26px] font-bold text-slate-800 leading-none mb-1">{paperRelationships.length}</h3>
                <p className="text-[11px] text-slate-500 leading-tight">Claims connected to<br/>other papers.</p>
              </div>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl border border-red-200 p-5 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm text-center md:text-left">
              <div className="w-12 h-12 rounded-lg bg-white text-red-600 flex items-center justify-center shrink-0 border border-red-200 shadow-sm"><AlertTriangle className="w-5 h-5"/></div>
              <div>
                <p className="text-[11px] font-bold text-red-700 mb-0.5">Potential Contradictions</p>
                <h3 className="text-[26px] font-bold text-red-600 leading-none mb-1">{contradictionCount}</h3>
                <p className="text-[11px] text-red-600/70 leading-tight">Relationships requiring<br/>investigation.</p>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm text-center md:text-left">
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200"><BookOpen className="w-5 h-5"/></div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 mb-0.5">Pages Referenced</p>
                <h3 className="text-[26px] font-bold text-slate-800 leading-none mb-1">{distinctPages.length}</h3>
                <p className="text-[11px] text-slate-500 leading-tight">Pages containing<br/>relevant claims.</p>
              </div>
            </div>
          </div>

          {/* Middle Row */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            
            {/* Paper Overview */}
            <div className="flex-[1.5] bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[16px] text-slate-800">Paper Overview</h3>
                <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><LogoIcon className="w-3 h-3"/> AI-generated overview</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                This paper explores key concepts related to {analysis.title.toLowerCase()}. Through systematic analysis, it establishes findings regarding various hypotheses. The system extracted {paperClaims.length} distinct claims that either support, contradict, or extend findings in the other analyzed literature.
              </p>
            </div>

            {/* Claim Relationships Chart */}
            <div className="flex-[1.2] bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <h3 className="font-bold text-[16px] text-slate-800 mb-1 flex items-center gap-2">Claim Relationships <Info className="w-3.5 h-3.5 text-slate-400"/></h3>
                <p className="text-[12px] text-slate-500 mb-6">How claims from this paper relate to claims in other papers.</p>
                
                <div className="flex flex-col sm:flex-row justify-between items-center pr-0 lg:pr-6 gap-6">
                  <div className="w-[120px] h-[120px] relative rounded-full border-[12px] border-slate-100 flex items-center justify-center shrink-0">
                    <div className="absolute inset-[-12px] rounded-full border-[12px] border-emerald-500 [clip-path:polygon(0_0,50%_0,50%_50%,0_0)]"></div>
                    <div className="absolute inset-[-12px] rounded-full border-[12px] border-emerald-500 [clip-path:polygon(50%_0,100%_0,100%_20%,50%_50%)]"></div>
                    <div className="absolute inset-[-12px] rounded-full border-[12px] border-slate-300 [clip-path:polygon(100%_20%,100%_100%,0_100%,0_50%,50%_50%)]"></div>
                    <div className="absolute inset-[-12px] rounded-full border-[12px] border-red-500 [clip-path:polygon(0_50%,0_0,50%_50%)]"></div>
                    
                    <div className="text-center">
                      <p className="text-[20px] font-bold text-slate-800 leading-none mb-1">{paperClaims.length}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Total Claims</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Supporting</div>
                      <div className="flex gap-4 text-[12px] font-bold text-slate-800"><span>{supportingCount}</span> <span className="text-slate-400 font-normal">{((supportingCount/paperRelationships.length||0)*100).toFixed(1)}%</span></div>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Potential Contradiction</div>
                      <div className="flex gap-4 text-[12px] font-bold text-slate-800"><span>{contradictionCount}</span> <span className="text-slate-400 font-normal">{((contradictionCount/paperRelationships.length||0)*100).toFixed(1)}%</span></div>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div> Neutral / Undetermined</div>
                      <div className="flex gap-4 text-[12px] font-bold text-slate-800"><span>{neutralCount}</span> <span className="text-slate-400 font-normal">{((neutralCount/paperRelationships.length||0)*100).toFixed(1)}%</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Relevant Pages Table */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[14px] text-slate-800">Relevant Pages</h3>
                {selectedPage !== 'all' && (
                  <button 
                    onClick={() => setSelectedPage('all')}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Clear page filter
                  </button>
                )}
              </div>
              <div className="w-full bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-1 flex flex-col">
                <div className="grid grid-cols-2 px-4 py-2 border-b border-slate-200 text-[11px] font-bold text-slate-600 bg-white">
                  <div>Page</div>
                  <div className="text-right">Claims</div>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto max-h-[160px]">
                  {(showAllPages ? distinctPages : distinctPages.slice(0, 5)).map((page, idx) => {
                    const claimsOnPage = paperClaims.filter(c => c.page === page).length;
                    const isSelected = selectedPage === page;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedPage(isSelected ? 'all' : page)}
                        className={`grid grid-cols-2 px-4 py-2 text-[12px] text-left transition-colors border-b border-slate-100 cursor-pointer ${
                          isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : idx % 2 === 1 ? 'bg-white text-slate-700 hover:bg-slate-50' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div>Page {page}</div>
                        <div className="text-right">{claimsOnPage}</div>
                      </button>
                    );
                  })}
                </div>
                {distinctPages.length > 5 && (
                  <button 
                    onClick={() => setShowAllPages(!showAllPages)}
                    className="w-full py-2 text-[11px] font-bold text-emerald-600 bg-white hover:bg-slate-50 border-t border-slate-200 flex justify-center items-center gap-1 cursor-pointer"
                  >
                    {showAllPages ? 'Show Fewer Pages' : `View All ${distinctPages.length} Pages`} &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 min-h-0 flex-1">
            {/* Left Column Data */}
            <div className="flex-[2] flex flex-col gap-6">
              
              {/* Extracted Claims Section */}
              <div className="flex-1 flex flex-col gap-4 pb-10">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-800">Extracted Claims</h3>
                    <p className="text-[12px] text-slate-500">Scientific statements identified from this paper.</p>
                  </div>
                  {(searchQuery || filterClaimType !== 'all' || selectedPage !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setFilterClaimType('all'); setSelectedPage('all'); }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 relative min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search claims in this paper..." 
                      className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-[13px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select 
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none shadow-sm text-slate-700 font-medium cursor-pointer"
                    value={filterClaimType}
                    onChange={(e) => setFilterClaimType(e.target.value)}
                  >
                    <option value="all">All Claims</option>
                    <option value="supporting">Supporting</option>
                    <option value="contradiction">Contradicting</option>
                    <option value="neutral">Neutral</option>
                  </select>
                  <select 
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] outline-none shadow-sm text-slate-700 font-medium cursor-pointer"
                    value={sortClaimsBy}
                    onChange={(e) => setSortClaimsBy(e.target.value)}
                  >
                    <option value="page">Sort by Page</option>
                    <option value="length">Sort by Length</option>
                  </select>
                </div>

                {/* Notice banner */}
                {contradictionCount > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 fill-red-100"/>
                      <div>
                        <h4 className="text-[12px] font-bold text-red-800">Claims Requiring Attention</h4>
                        <p className="text-[11px] text-red-600/80">Claims with potential contradictions or high-confidence relationships.</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-red-600 bg-white px-2 py-1 rounded shadow-sm border border-red-100">{contradictionCount} claims</span>
                  </div>
                )}

                {/* Claims List */}
                <div className="flex flex-col gap-3">
                  {filteredClaims.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center gap-3">
                      <p className="text-[13px] font-medium text-slate-600">No claims match your filter criteria.</p>
                      <button
                        onClick={() => { setSearchQuery(''); setFilterClaimType('all'); setSelectedPage('all'); }}
                        className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[12px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    filteredClaims.map((claim, idx) => {
                      const rels = getRelationshipsForClaim(claim.id);
                      // find most severe relationship to highlight (contradiction > supporting > neutral)
                      const hasContradiction = rels.some(r => r.type === 'contradiction');
                      const hasSupporting = rels.some(r => r.type === 'supporting');
                      const maxConfidence = rels.reduce((max, r) => r.confidence > max ? r.confidence : max, 0);

                      let severityColor = "bg-slate-100 text-slate-500";
                      let severityIcon = <div className="w-2 h-2 rounded-full bg-slate-400"></div>;
                      let severityLabel = "Neutral";
                      let barColor = "bg-slate-200";
                      let barFill = "bg-slate-400";
                      
                      if (hasContradiction) {
                        severityColor = "bg-red-50 text-red-600";
                        severityIcon = <AlertTriangle className="w-3 h-3"/>;
                        severityLabel = "Potential Contradiction";
                        barColor = "bg-red-100";
                        barFill = "bg-red-500";
                      } else if (hasSupporting) {
                        severityColor = "bg-emerald-50 text-emerald-600";
                        severityIcon = <CheckCircle2 className="w-3 h-3"/>;
                        severityLabel = "Supporting";
                        barColor = "bg-emerald-100";
                        barFill = "bg-emerald-500";
                      }

                      return (
                        <div key={claim.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 shadow-sm md:items-center">
                          <div className="flex gap-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[12px] font-bold text-slate-800 leading-none mb-1">{(idx + 1).toString().padStart(2, '0')}</span>
                              <span className="text-[9px] text-slate-500">Page {claim.page}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] text-slate-800 font-medium leading-relaxed break-words">"{claim.text}"</p>
                          </div>
                          <div className="w-full md:w-[180px] shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-1 md:pl-4">
                            {rels.length > 0 ? (
                              <>
                                <div className={`flex items-center gap-1.5 mb-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${severityColor}`}>
                                  {severityIcon} {severityLabel}
                                </div>
                                <p className="text-[11px] font-medium text-slate-700">{rels.length} related claim{rels.length > 1 ? 's' : ''}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] text-slate-400">{maxConfidence}% max conf</span>
                                  <div className={`w-8 h-1.5 rounded-full ${barColor}`}><div className={`h-full rounded-full ${barFill}`} style={{width: `${maxConfidence}%`}}></div></div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> Neutral
                                </div>
                                <p className="text-[11px] font-medium text-slate-500">No strong relationship</p>
                                <div className="flex items-center gap-2 mt-1"><span className="text-[9px] text-slate-400">—</span></div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0 justify-end md:justify-start border-t md:border-none border-slate-100 pt-3 md:pt-0">
                            {rels.length > 0 ? (
                              <Link to={`/analysis/${analysis.id}/evidence/${rels[0].id}`} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-[11px] font-bold shadow-sm hover:bg-slate-50 flex items-center gap-1.5">View Evidence &rarr;</Link>
                            ) : (
                              <button disabled className="bg-slate-50 border border-slate-200 text-slate-400 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 opacity-50 cursor-not-allowed">View Evidence &rarr;</button>
                            )}
                            <button className="p-1.5 text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4"/></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Right Column Data */}
            <div className="flex-[1] flex flex-col gap-6">
              {/* Source Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-[14px] text-slate-800 mb-4">Source Information</h3>
                <div className="flex gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg w-10 h-10 flex items-center justify-center shrink-0 text-blue-600 mt-1">
                    <FileText className="w-5 h-5"/>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-y-2 text-[11px] w-full">
                    <span className="text-slate-500">File</span><span className="font-medium text-blue-600 truncate" title={paper.fileName}>{paper.fileName}</span>
                    <span className="text-slate-500">Pages</span><span className="font-medium text-slate-800">{paper.pages || '?'}</span>
                    <span className="text-slate-500">Claims extracted</span><span className="font-medium text-slate-800">{paperClaims.length}</span>
                    <span className="text-slate-500">Analysis status</span><span className="font-medium text-slate-800">Complete</span>
                  </div>
                </div>
              </div>

              {/* AI-assisted interpretation */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 mt-auto">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><LogoIcon className="w-3 h-3"/></div>
                   <h4 className="font-bold text-[13px] text-blue-900">AI-assisted interpretation</h4>
                 </div>
                 <div className="pl-9">
                   <p className="text-[12px] font-bold text-slate-800 mb-1">Keep the evidence in context</p>
                   <p className="text-[11px] text-slate-600 leading-relaxed">
                     Extracted claims are AI-assisted selections from the document. Review the surrounding text before interpreting an individual claim.
                   </p>
                 </div>
              </div>

              {/* Actions List */}
              <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm">
                 <div className="flex items-center gap-2 mb-2 p-3 pb-1">
                   <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Activity className="w-3 h-3"/></div>
                   <h4 className="font-bold text-[13px] text-slate-800">Actions</h4>
                 </div>
                 <div className="space-y-1">
                   <Link to={`/analysis/${analysis.id}/results`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                     <div className="flex items-center gap-3 text-[12px] font-bold text-slate-700 group-hover:text-blue-600"><ExternalLink className="w-4 h-4"/> Compare with Another Paper</div>
                     <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600"/>
                   </Link>
                   <Link to={`/analysis/${analysis.id}/export`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                     <div className="flex items-center gap-3 text-[12px] font-bold text-slate-700 group-hover:text-blue-600"><Download className="w-4 h-4"/> Export Paper Analysis</div>
                     <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600"/>
                   </Link>
                   <Link to={`/analysis/${analysis.id}/results`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                     <div className="flex items-center gap-3 text-[12px] font-bold text-slate-700 group-hover:text-blue-600"><ChevronLeft className="w-4 h-4"/> Back to Results</div>
                   </Link>
                 </div>
              </div>

            </div>
          </div>
        </main>

        {/* Document Reader Preview Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[18px] text-slate-900">Document Reader</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{paper.fileName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-[13px] text-slate-600">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start text-[12px] gap-4">
                    <span className="text-slate-500 shrink-0">Title:</span>
                    <span className="font-semibold text-slate-800 text-right">{paper.title}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">File Name:</span>
                    <span className="font-mono text-slate-700">{paper.fileName}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">Total Pages:</span>
                    <span className="font-semibold text-slate-800">{paper.pages || '?'}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">Extracted Claims:</span>
                    <span className="font-semibold text-emerald-600">{paperClaims.length} claims</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-[12px] text-emerald-800 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Verified Document Record:</strong> Text and page references extracted via PyMuPDF. All candidate assertions are linked to their corresponding source pages.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-[13px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  to={`/analysis/${analysis.id}/results`}
                  className="px-4 py-2 text-[13px] font-bold bg-[#0b1f1b] text-white hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
                >
                  View All Evidence &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
