import { useEffect, useState } from 'react';
import { Search, FileText, CheckCircle2, ChevronRight, Download, ArrowUpDown, AlertTriangle, Info, Sparkles, X, ChevronDown, ChevronUp, LayoutList, Share2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { analysisApi } from '../services/api';
import { getAnalysisStats } from '../utils/analysisStats';
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

export default function Results() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterPaper, setFilterPaper] = useState('all');
  const [sortMode, setSortMode] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCards, setCollapsedCards] = useState({});
  const [viewLayout, setViewLayout] = useState('cards'); // 'cards' | 'diagram'

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
          // Backend returns { analysis, papers, claims, relationships, ai_status, message }
          // Frontend expects a flat object with papers, claims, relationships
          const analysisObj = raw.analysis || raw;
          const merged = {
            ...analysisObj,
            createdAt: analysisObj.created_at || analysisObj.createdAt,
            updatedAt: analysisObj.updated_at || analysisObj.updatedAt,
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
              section_name: c.section_name || c.section || '',
            })),
            relationships: (raw.relationships || analysisObj.relationships || []).map(r => ({
              ...r,
              type: r.classification || r.type || 'related',
              sourceClaimId: r.source_claim_id || r.sourceClaimId,
              targetClaimId: r.target_claim_id || r.targetClaimId,
              sourcePaperId: r.source_paper_id || r.sourcePaperId,
              targetPaperId: r.target_paper_id || r.targetPaperId,
              // Normalize evidence structure for UI compatibility
              evidence: r.evidence || {
                source: {
                  page: r.source_page_number || 1,
                  text: r.source_claim_text || '',
                  highlight: r.source_claim_text || '',
                },
                target: {
                  page: r.target_page_number || 1,
                  text: r.target_claim_text || '',
                  highlight: r.target_claim_text || '',
                },
              },
              contextDifferences: r.contextDifferences || r.context_differences || [],
              confidence: r.confidence || r.confidence_score || 50,
            })),
            ai_status: raw.ai_status,
            message: raw.message,
          };
          setAnalysis(merged);
        } else {
          setError(res.error || "Analysis not found or could not be loaded.");
        }
      } catch (err) {
        console.error("Analysis load error:", err);
        setError(err.message || "Failed to load analysis results.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  const toggleCard = (id) => {
    setCollapsedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const collapseAll = () => {
    const all = {};
    (analysis?.relationships || []).forEach(r => { all[r.id] = true; });
    setCollapsedCards(all);
  };

  const expandAll = () => {
    setCollapsedCards({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[15px] font-bold text-slate-700">Loading analysis results...</p>
        <p className="text-[12px] text-slate-400 mt-1">Preparing claim comparisons and evidence mapping</p>
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
            The requested analysis ID does not exist or has been removed. You can explore the demonstration dataset or create a new analysis.
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

  // Derive stats dynamically
  const stats = getAnalysisStats(analysis);
  const totalClaims = stats.totalClaims;
  const paperCount = stats.paperCount;
  const relationships = stats.relationships;
  const supporting = stats.supporting;
  const contradictions = stats.contradictions;
  const neutral = stats.neutral;

  const getFilteredRelationships = () => {
    let results = [];
    if (filterType === 'supporting') results = supporting;
    else if (filterType === 'contradiction') results = contradictions;
    else if (filterType === 'neutral') results = neutral;
    else results = [...contradictions, ...supporting, ...neutral];

    if (filterPaper !== 'all') {
      results = results.filter(rel => {
        const sc = analysis.claims.find(c => c.id === rel.sourceClaimId);
        const tc = analysis.claims.find(c => c.id === rel.targetClaimId);
        return sc?.paperId === filterPaper || tc?.paperId === filterPaper;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(rel => {
        const sc = analysis.claims.find(c => c.id === rel.sourceClaimId);
        const tc = analysis.claims.find(c => c.id === rel.targetClaimId);
        const sp = analysis.papers.find(p => p.id === sc?.paperId);
        const tp = analysis.papers.find(p => p.id === tc?.paperId);
        return sc?.text.toLowerCase().includes(q) || tc?.text.toLowerCase().includes(q) || sp?.title.toLowerCase().includes(q) || tp?.title.toLowerCase().includes(q);
      });
    }

    if (sortMode === 'confidence') {
      results.sort((a, b) => b.confidence - a.confidence);
    } else {
      // Relevance sorting (contradictions first, then supporting, then neutral)
      const typeWeight = { contradiction: 3, supporting: 2, neutral: 1 };
      results.sort((a, b) => typeWeight[b.type] - typeWeight[a.type]);
    }

    return results;
  };

  const filteredRelationships = getFilteredRelationships();
  const getClaimById = (id) => analysis.claims?.find(c => c.id === id);
  const getPaperById = (id) => analysis.papers?.find(p => p.id === id);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col overflow-x-hidden">

      {/* Responsive Navbar */}
      <Navbar
        activeTab="analyses"
        actions={
          <>
            <Link to="/analysis/new" className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-medium text-[13px] hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs">
              New Analysis
            </Link>
            <Link to={`/analysis/${analysis.id}/export`} className="bg-[#0b1f1b] text-white px-4 py-1.5 rounded-lg font-medium text-[13px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-1.5">
              Export <Download className="w-4 h-4" />
            </Link>
          </>
        }
      />

      {/* Background Stack of Papers (Right Side - Desktop Only) */}
      <div className="absolute right-0 top-[100px] w-[600px] h-[800px] z-0 pointer-events-none opacity-40 overflow-hidden hidden xl:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[800px] h-[600px] bg-white/50 border-t border-l border-slate-300 shadow-[0_-2px_12px_rgba(0,0,0,0.02)] rounded-tl-lg"
            style={{ left: `${i * 15}px`, top: `${i * 30}px`, transform: `rotate(${-5 + i * 2}deg)` }}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[60px] py-6 sm:py-10 flex flex-col relative z-10 flex-1">

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
          <div className="max-w-3xl">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:gap-2">
              <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Analysis Results</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-serif text-[#0f2a24] leading-tight mb-2 sm:mb-3 tracking-tight">
              {analysis.title}
            </h1>
            <p className="text-[14px] sm:text-[15px] text-slate-500 mb-2">
              Comparison of scientific claims across your uploaded papers.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] text-slate-500 font-medium">
              <span>{paperCount} Papers</span> &bull; <span>{totalClaims} Claims</span> &bull; <span>{relationships.length} Claim Comparisons</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {analysis.id !== 'demo-analysis' && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full border border-emerald-100 text-[12px]">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold">Completed</span>
              </div>
            )}
            <Link to="/analysis/new" className="flex-1 sm:flex-initial justify-center bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg font-medium text-[13px] sm:text-[14px] hover:bg-slate-50 flex items-center gap-1.5 shadow-xs">
              New Analysis
            </Link>
            <Link to={`/analysis/${analysis.id}/export`} className="flex-1 sm:flex-initial justify-center bg-[#0b1f1b] text-white px-4 py-2 rounded-lg font-medium text-[13px] sm:text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export Report
            </Link>
          </div>
        </div>

        {/* Demonstration Data Banner */}
        {(analysis.id === 'demo-analysis' || analysis.isDemo || analysis.isSimulation) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-amber-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span>
                <strong>Demonstration Data:</strong> This is an interactive demo showing how SciTrace AI correlates scientific literature. All findings are generated for workflow and UI evaluation.
              </span>
            </div>
            <Link to="/analysis/new" className="text-amber-900 font-bold hover:underline shrink-0 text-[11px] uppercase tracking-wide bg-amber-100/60 px-2.5 py-1 rounded">
              Upload Custom Papers &rarr;
            </Link>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><FileText className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">PAPERS ANALYZED</p>
              <h3 className="text-[28px] font-bold text-slate-800 leading-none mb-1">{paperCount.toString().padStart(2, '0')}</h3>
              <p className="text-[11px] text-slate-500">Research papers processed</p>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-serif font-bold text-xl pt-1">"</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CLAIMS EXTRACTED</p>
              <h3 className="text-[28px] font-bold text-slate-800 leading-none mb-1">{totalClaims}</h3>
              <p className="text-[11px] text-slate-500">Candidate scientific claims</p>
            </div>
          </div>
          {contradictions.length > 0 ? (
            <div className="flex-1 bg-red-50 rounded-xl border border-red-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center shrink-0 border border-red-200 shadow-sm"><AlertTriangle className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider mb-0.5">POTENTIAL CONTRADICTIONS</p>
                <h3 className="text-[28px] font-bold text-red-600 leading-none mb-1">{contradictions.length}</h3>
                <p className="text-[11px] text-red-500/80">Opposing relationships detected</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-emerald-50/70 rounded-xl border border-emerald-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-sm"><CheckCircle2 className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">NO CONTRADICTIONS</p>
                <h3 className="text-[28px] font-bold text-emerald-700 leading-none mb-1">0</h3>
                <p className="text-[11px] text-emerald-600">Corroborating or neutral findings</p>
              </div>
            </div>
          )}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200"><LogoIcon className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CLAIM PAIRS COMPARED</p>
              <h3 className="text-[28px] font-bold text-slate-800 leading-none mb-1">{relationships.length}</h3>
              <p className="text-[11px] text-slate-500">Potentially related claim pairs</p>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200 font-bold">-</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">NEUTRAL / UNDETERMINED</p>
              <h3 className="text-[28px] font-bold text-slate-800 leading-none mb-1">{neutral.length}</h3>
              <p className="text-[11px] text-slate-500">Claims without a clear relationship</p>
            </div>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-6 w-full">

            {/* Chart Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col lg:flex-row gap-10">
              <div className="w-[180px]">
                <h3 className="font-bold text-[16px] text-slate-800 mb-1">Claim Relationships</h3>
                <p className="text-[12px] text-slate-500 mb-6">How the analyzed claims relate to one another.</p>

                {/* Dynamic SVG Donut Chart */}
                {(() => {
                  const totalCount = relationships.length;
                  const r = 44;
                  const c = 2 * Math.PI * r; // ~276.46
                  if (totalCount === 0) {
                    return (
                      <div className="w-[140px] h-[140px] mx-auto relative flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                        </svg>
                        <div className="absolute text-center">
                          <p className="text-[22px] font-bold text-slate-400">0</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No Pairs</p>
                        </div>
                      </div>
                    );
                  }
                  const supLen = (supporting.length / totalCount) * c;
                  const conLen = (contradictions.length / totalCount) * c;
                  const neuLen = (neutral.length / totalCount) * c;

                  const supOffset = 0;
                  const conOffset = -supLen;
                  const neuOffset = -(supLen + conLen);

                  return (
                    <div className="w-[140px] h-[140px] mx-auto relative flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r={r} fill="transparent" stroke="#f8fafc" strokeWidth="15" />
                        {supporting.length > 0 && (
                          <circle
                            cx="60" cy="60" r={r} fill="transparent"
                            stroke="#10b981" strokeWidth="15"
                            strokeDasharray={`${supLen} ${c}`}
                            strokeDashoffset={supOffset}
                            className="transition-all duration-500"
                          />
                        )}
                        {contradictions.length > 0 && (
                          <circle
                            cx="60" cy="60" r={r} fill="transparent"
                            stroke="#ef4444" strokeWidth="15"
                            strokeDasharray={`${conLen} ${c}`}
                            strokeDashoffset={conOffset}
                            className="transition-all duration-500"
                          />
                        )}
                        {neutral.length > 0 && (
                          <circle
                            cx="60" cy="60" r={r} fill="transparent"
                            stroke="#cbd5e1" strokeWidth="15"
                            strokeDasharray={`${neuLen} ${c}`}
                            strokeDashoffset={neuOffset}
                            className="transition-all duration-500"
                          />
                        )}
                      </svg>
                      <div className="absolute text-center pointer-events-none">
                        <p className="text-[24px] font-bold text-slate-800 leading-none mb-1">{totalCount}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Total Pairs</p>
                      </div>
                    </div>
                  );
                })()}
              </div>


              <div className="flex-1 flex flex-col justify-center gap-4 pt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Supporting</div>
                  <div className="flex gap-10 text-[13px] font-bold text-slate-800"><span>{supporting.length}</span> <span className="text-slate-400 font-normal">{((supporting.length / relationships.length || 0) * 100).toFixed(1)}%</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-red-500"></div> <AlertTriangle className="w-4 h-4 text-red-600" /> Potential Contradiction</div>
                  <div className="flex gap-10 text-[13px] font-bold text-slate-800"><span>{contradictions.length}</span> <span className="text-slate-400 font-normal">{((contradictions.length / relationships.length || 0) * 100).toFixed(1)}%</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-slate-300"></div> <span className="font-bold text-slate-400 w-4 text-center">-</span> Neutral / Undetermined</div>
                  <div className="flex gap-10 text-[13px] font-bold text-slate-800"><span>{neutral.length}</span> <span className="text-slate-400 font-normal">{((neutral.length / relationships.length || 0) * 100).toFixed(1)}%</span></div>
                </div>
              </div>

              <div className="w-[1px] bg-slate-100 my-2"></div>

              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[12px] font-bold text-slate-800 mb-4">Relationship Distribution Across Papers</p>
                <div className="space-y-4">
                  {(() => {
                    const paperStats = analysis.papers.map(p => {
                      const rels = relationships.filter(r => {
                        const sc = getClaimById(r.sourceClaimId);
                        const tc = getClaimById(r.targetClaimId);
                        return sc?.paperId === p.id || tc?.paperId === p.id;
                      });
                      const sup = rels.filter(r => r.type === 'supporting').length;
                      const con = rels.filter(r => r.type === 'contradiction').length;
                      const neu = rels.filter(r => r.type === 'neutral' || r.type === 'related').length;
                      return { title: p.title, total: rels.length, sup, con, neu };
                    }).sort((a, b) => b.total - a.total).slice(0, 3);

                    return paperStats.map((stat, i) => (
                      <div key={i} className="flex items-center gap-4 text-[11px]">
                        <span className="text-slate-600 w-24 truncate" title={stat.title}>{stat.title}</span>
                        <div className="flex-1 h-3 flex rounded-sm overflow-hidden bg-slate-100">
                          {stat.total > 0 && (
                            <>
                              <div className="bg-emerald-400" style={{ width: `${(stat.sup / stat.total) * 100}%` }}></div>
                              <div className="bg-red-400" style={{ width: `${(stat.con / stat.total) * 100}%` }}></div>
                              <div className="bg-slate-300" style={{ width: `${(stat.neu / stat.total) * 100}%` }}></div>
                            </>
                          )}
                        </div>
                        <span className="text-slate-800 font-bold w-4 text-right">{stat.total}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setFilterType('all')} className={`${filterType === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'} px-4 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-colors`}>All ({relationships.length})</button>
              <button onClick={() => setFilterType('supporting')} className={`${filterType === 'supporting' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'} px-4 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors`}>Supporting ({supporting.length})</button>
              <button onClick={() => setFilterType('contradiction')} className={`${filterType === 'contradiction' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'} px-4 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-colors`}>Potential Contradictions ({contradictions.length})</button>
              <button onClick={() => setFilterType('neutral')} className={`${filterType === 'neutral' ? 'bg-slate-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'} px-4 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors`}>Neutral ({neutral.length})</button>

              <div className="ml-auto flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                <select
                  value={filterPaper}
                  onChange={(e) => setFilterPaper(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer outline-none hover:border-slate-300"
                >
                  <option value="all">All Papers</option>
                  {analysis.papers?.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer outline-none hover:border-slate-300"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="confidence">Sort by Confidence</option>
                </select>

                <div className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-2 w-[200px] focus-within:border-emerald-500 transition-colors relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search claims..."
                    className="bg-transparent border-none outline-none w-full pr-4"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Claims List */}
            <div className="flex flex-col gap-4 pb-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-1 gap-2">
                <div>
                  <h3 className="text-[20px] font-serif text-slate-800">
                    {filterType === 'all' ? 'All Relationships' : filterType === 'supporting' ? 'Supporting Evidence' : filterType === 'contradiction' ? 'Potential Contradictions' : 'Neutral Findings'}
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    {filterType === 'contradiction' ? 'Claims that appear to make incompatible statements and may require further investigation.' : 'Explore the specific findings and their sources.'}
                  </p>
                </div>
                <div className="text-[12px] text-slate-500 flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-inner">
                    <button
                      onClick={() => setViewLayout('cards')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${viewLayout === 'cards'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                      title="Standard Detailed Card View"
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      Cards
                    </button>
                    <button
                      onClick={() => setViewLayout('diagram')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${viewLayout === 'diagram'
                          ? 'bg-white text-emerald-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                      title="Interactive Visual Diagram & Evidence Map"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      Visual Diagram
                    </button>
                  </div>

                  {viewLayout === 'cards' && (
                    <>
                      <span>{filteredRelationships.length} relationships</span>
                      <button
                        onClick={Object.keys(collapsedCards).length > 0 ? expandAll : collapseAll}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-2.5 py-1 rounded-md shadow-sm transition-colors cursor-pointer"
                      >
                        {Object.keys(collapsedCards).length > 0 ? 'Expand All' : 'Collapse All'}
                      </button>
                    </>
                  )}
                  <div
                    className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 hover:text-emerald-600 transition-colors"
                    onClick={() => setSortMode(prev => prev === 'relevance' ? 'confidence' : 'relevance')}
                  >
                    <ArrowUpDown className="w-3 h-3" /> Sort by {sortMode === 'relevance' ? 'Relevance' : 'Confidence'}
                  </div>
                </div>
              </div>

              {filteredRelationships.length === 0 ? (
                filterType === 'contradiction' && contradictions.length === 0 ? (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-10 text-center shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-[18px] text-slate-800 mb-1.5 font-serif">Zero Opposing Claims Detected</h4>
                    <p className="text-[13px] text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
                      The natural language inference (NLI) model evaluated all semantically relevant claim pairs across the analyzed research papers and found <span className="font-semibold text-emerald-700">no direct contradictions</span>. The findings either corroborate each other or present distinct contextual conclusions.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setFilterType('supporting')}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> View Supporting Evidence ({supporting.length})
                      </button>
                      <button
                        onClick={() => setFilterType('all')}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                      >
                        View All Claims ({relationships.length})
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-[15px] text-slate-800 mb-1">No relationships match your filters</h4>
                    <p className="text-[13px] text-slate-500 mb-5">Try relaxing your search terms or selecting another category.</p>
                    <button
                      onClick={() => { setFilterType('all'); setFilterPaper('all'); setSearchQuery(''); }}
                      className="bg-[#0b1f1b] text-white px-4 py-2 rounded-xl text-[12px] font-bold hover:bg-slate-900 transition-colors shadow-sm cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )
              ) : viewLayout === 'diagram' ? (
                <div className="space-y-6">
                  {/* Diagrammatic Overview Header */}
                  <div className="bg-gradient-to-r from-slate-900 to-[#0f2a24] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-serif font-bold text-[16px] text-white tracking-wide">Scientific Evidence Relationship Diagram</h4>
                      </div>
                      <p className="text-[12px] text-slate-300">
                        Visual cross-mapping of extracted assertions showing semantic alignment and NLI tension vectors.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] bg-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                      <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Supporting</span>
                      <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span> Contradiction</span>
                      <span className="flex items-center gap-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Neutral</span>
                    </div>
                  </div>

                  {contradictions.length === 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-[12px] text-emerald-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Consensus Graph:</span> All connected assertions exhibit positive or neutral semantic concordance. No opposing contradictions detected between papers.
                      </div>
                    </div>
                  )}

                  {/* Diagrammatic Node Cards */}
                  <div className="space-y-5">
                    {filteredRelationships.map((rel) => {
                      const sourceClaim = getClaimById(rel.sourceClaimId);
                      const targetClaim = getClaimById(rel.targetClaimId);
                      if (!sourceClaim || !targetClaim) return null;

                      const sourcePaper = getPaperById(sourceClaim.paperId);
                      const targetPaper = getPaperById(targetClaim.paperId);

                      const isContradiction = rel.type === 'contradiction';
                      const isSupporting = rel.type === 'supporting';

                      return (
                        <div key={`diagram-${rel.id}`} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                          {/* Visual Node Flow */}
                          <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_1fr] items-center gap-4">
                            {/* Paper A Claim Node */}
                            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-full">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Paper A Assertion</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Page {sourceClaim.page}</span>
                                </div>
                                <Link
                                  to={`/analysis/${analysis.id}/paper/${sourcePaper?.id}`}
                                  className="text-[12px] font-bold text-slate-800 hover:text-blue-600 line-clamp-1 block mb-2"
                                  title={sourcePaper?.title}
                                >
                                  {sourcePaper?.title || 'Document A'}
                                </Link>
                                <p className="text-[12px] text-slate-700 italic bg-white p-3 rounded-lg border border-slate-100 font-serif leading-relaxed">
                                  "{sourceClaim.text}"
                                </p>
                              </div>
                              {sourceClaim.section && (
                                <div className="mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                  Section: {sourceClaim.section}
                                </div>
                              )}
                            </div>

                            {/* Central NLI Vector Bridge */}
                            <div className="flex flex-col items-center justify-center text-center py-2 relative">
                              <div className={`hidden lg:block w-full h-[2px] absolute top-1/2 -z-0 ${isContradiction ? 'bg-red-200' : isSupporting ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>

                              <div className={`relative z-10 px-3 py-2 rounded-xl border shadow-sm flex flex-col items-center gap-1 ${isContradiction
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : isSupporting
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}>
                                <div className="flex items-center gap-1 text-[11px] font-bold">
                                  {isContradiction ? (
                                    <>
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                      <span>Opposing</span>
                                    </>
                                  ) : isSupporting ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Supports</span>
                                    </>
                                  ) : (
                                    <>
                                      <LogoIcon className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Neutral</span>
                                    </>
                                  )}
                                </div>
                                <div className="text-[10px] font-bold tracking-tight">
                                  {rel.confidence}% NLI Conf.
                                </div>
                                {rel.similarity != null && (
                                  <div className="text-[9px] text-slate-400 font-medium">
                                    Sim: {Math.round(rel.similarity * 100)}%
                                  </div>
                                )}
                              </div>

                              <Link
                                to={`/analysis/${analysis.id}/evidence/${rel.id}`}
                                className="mt-2 text-[10px] font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-0.5 hover:underline"
                              >
                                Inspect Evidence <ArrowRight className="w-2.5 h-2.5" />
                              </Link>
                            </div>

                            {/* Paper B Claim Node */}
                            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-full">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">Paper B Assertion</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Page {targetClaim.page}</span>
                                </div>
                                <Link
                                  to={`/analysis/${analysis.id}/paper/${targetPaper?.id}`}
                                  className="text-[12px] font-bold text-slate-800 hover:text-blue-600 line-clamp-1 block mb-2"
                                  title={targetPaper?.title}
                                >
                                  {targetPaper?.title || 'Document B'}
                                </Link>
                                <p className="text-[12px] text-slate-700 italic bg-white p-3 rounded-lg border border-slate-100 font-serif leading-relaxed">
                                  "{targetClaim.text}"
                                </p>
                              </div>
                              {targetClaim.section && (
                                <div className="mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                  Section: {targetClaim.section}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Context Differences or Metadata Banner */}
                          {rel.contextDifferences?.length > 0 && (
                            <div className="mt-3 bg-amber-50/60 border border-amber-200/60 rounded-xl px-3.5 py-2 text-[11px] text-amber-800 flex items-center gap-2">
                              <span className="font-bold">Contextual Discrepancy:</span>
                              <span>{rel.contextDifferences[0]}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                filteredRelationships.map((rel) => {
                  const sourceClaim = getClaimById(rel.sourceClaimId);
                  const targetClaim = getClaimById(rel.targetClaimId);
                  if (!sourceClaim || !targetClaim) return null;

                  const sourcePaper = getPaperById(sourceClaim.paperId);
                  const targetPaper = getPaperById(targetClaim.paperId);

                  const isContradiction = rel.type === 'contradiction';
                  const isSupporting = rel.type === 'supporting';
                  const isCollapsed = !!collapsedCards[rel.id];

                  return (
                    <div key={rel.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${isContradiction ? 'border-red-200' : isSupporting ? 'border-emerald-200' : 'border-slate-200'}`}>
                      {/* Interactive Card Header */}
                      <div
                        onClick={() => toggleCard(rel.id)}
                        className={`${isContradiction ? 'bg-red-50/50 border-red-100 text-red-700 hover:bg-red-50' : isSupporting ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700 hover:bg-emerald-50' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/70'} px-4 py-2.5 border-b flex justify-between items-center cursor-pointer select-none transition-colors`}
                      >
                        <div className="flex items-center gap-2 text-[12px] font-bold">
                          {isContradiction ? <AlertTriangle className="w-4 h-4 fill-red-100" /> : isSupporting ? <CheckCircle2 className="w-4 h-4 fill-emerald-100" /> : <LogoIcon className="w-4 h-4" />}
                          <span>{isContradiction ? 'Potential contradiction' : isSupporting ? 'Supporting evidence' : 'Neutral relationship'}</span>
                          {isCollapsed && (
                            <span className="text-[11px] font-normal text-slate-500 ml-2 hidden sm:inline">
                              ({sourcePaper?.title?.substring(0, 25)}... &bull; {targetPaper?.title?.substring(0, 25)}...)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold ${isContradiction ? 'text-red-600' : isSupporting ? 'text-emerald-600' : 'text-slate-500'}`}>{rel.confidence}% confidence</span>
                          <div className={`w-20 sm:w-24 h-2 rounded-full overflow-hidden ${isContradiction ? 'bg-red-100' : isSupporting ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                            <div className={`h-full rounded-full ${isContradiction ? 'bg-red-500' : isSupporting ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${rel.confidence}%` }}></div>
                          </div>
                          <span className="p-1 rounded text-slate-400 hover:text-slate-700 transition-transform">
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>

                      {/* Collapsible Content */}
                      {!isCollapsed && (
                        <>
                          <div className="p-5 overflow-x-auto">
                            <div className="flex flex-col md:flex-row gap-6 relative min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-800">Paper A</p>
                                    <Link to={`/analysis/${analysis.id}/paper/${sourcePaper?.id}`} className="text-[11px] font-semibold text-blue-600 hover:underline truncate block" title={sourcePaper?.title}>
                                      {sourcePaper?.title}
                                    </Link>
                                    <p className="text-[10px] text-slate-400">Page {sourceClaim.page}</p>
                                  </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <p className="text-[13px] text-slate-700 font-medium italic break-words">"{sourceClaim.text}"</p>
                                </div>
                              </div>

                              {/* Connection Graphic */}
                              <div className="md:w-20 shrink-0 flex md:flex-col items-center justify-center relative my-2 md:my-0">
                                <div className={`hidden md:block w-full h-[1px] absolute top-1/2 -z-10 ${isContradiction ? 'bg-red-200' : isSupporting ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
                                <div className={`md:hidden h-full w-[1px] absolute left-1/2 -z-10 ${isContradiction ? 'bg-red-200' : isSupporting ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>
                                <div className={`w-10 h-10 bg-white border rounded-full flex flex-col items-center justify-center shadow-sm relative z-10 ${isContradiction ? 'border-red-200 text-red-500' : isSupporting ? 'border-emerald-200 text-emerald-500' : 'border-slate-200 text-slate-500'}`}>
                                  {isContradiction ? <ArrowUpDown className="w-4 h-4 mb-0.5" /> : isSupporting ? <CheckCircle2 className="w-4 h-4 mb-0.5" /> : <LogoIcon className="w-4 h-4 mb-0.5" />}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-800">Paper B</p>
                                    <Link to={`/analysis/${analysis.id}/paper/${targetPaper?.id}`} className="text-[11px] font-semibold text-blue-600 hover:underline truncate block" title={targetPaper?.title}>
                                      {targetPaper?.title}
                                    </Link>
                                    <p className="text-[10px] text-slate-400">Page {targetClaim.page}</p>
                                  </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <p className="text-[13px] text-slate-700 font-medium italic break-words">"{targetClaim.text}"</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer with Context Difference and Action Links */}
                          <div className={`${rel.contextDifferences?.length > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'} px-5 py-3 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}>
                            {rel.contextDifferences?.length > 0 ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                <span className="text-[11px] font-bold text-amber-700">Contextual difference</span>
                                <span className="text-slate-300 px-1">|</span>
                                <span className="text-[11px] font-semibold text-amber-600 bg-amber-100/60 px-2 rounded">Methodology</span>
                                <span className="text-[11px] text-amber-700/80">{rel.contextDifferences[0]} <Info className="w-3 h-3 inline pb-0.5" /></span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic">
                                Correlated findings across candidate publications
                              </div>
                            )}

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <Link to={`/analysis/${analysis.id}/paper/${sourcePaper?.id}`} title="Open Paper A details" className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                                Paper A &nearr;
                              </Link>
                              <Link to={`/analysis/${analysis.id}/paper/${targetPaper?.id}`} title="Open Paper B details" className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                                Paper B &nearr;
                              </Link>
                              <Link to={`/analysis/${analysis.id}/evidence/${rel.id}`} className="text-[11px] font-bold text-white bg-[#0b1f1b] px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-900 transition-colors flex items-center gap-1">
                                View Evidence &rarr;
                              </Link>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="flex flex-col gap-6">

            {/* Research Papers List */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[14px] text-slate-800">Research Papers</h3>
                <Link to="/analyses" className="text-[11px] font-bold text-blue-600 cursor-pointer hover:underline">View All</Link>
              </div>

              <div className="space-y-3">
                {analysis.papers.map(paper => (
                  <Link to={`/analysis/${analysis.id}/paper/${paper.id}`} key={paper.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex gap-3 hover:bg-white transition-colors cursor-pointer items-center">
                    <div className="bg-white border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center w-[28px] h-[34px] shrink-0 shadow-sm">
                      <div className="w-[10px] h-[1px] bg-slate-300 mb-[2px]"></div>
                      <div className="w-[10px] h-[1px] bg-slate-300 mb-[2px]"></div>
                      <div className="w-[6px] h-[1px] bg-slate-300 self-start ml-[2px]"></div>
                    </div>
                    <div className="flex-1 hover:opacity-80 min-w-0">
                      <h4 className="font-semibold text-[11px] text-slate-800 truncate pr-2 hover:underline" title={paper.title}>{paper.title}</h4>
                      <p className="text-[9px] text-slate-500 mb-1">{paper.pages || '?'} pages</p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] shrink-0 h-fit mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Analyzed
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Key Findings Mini Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[14px] text-slate-800 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500" /> Key Findings</h3>
                <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="w-3 h-3" /></div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800 leading-tight">{supporting.length} <span className="font-medium text-slate-600">Supporting relationships</span></p>
                    <p className="text-[10px] text-slate-500">Claims that agree with each other.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle className="w-3 h-3" /></div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800 leading-tight">{contradictions.length} <span className="font-medium text-slate-600">Potential contradictions</span></p>
                    <p className="text-[10px] text-slate-500">Claims that may make incompatible statements.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">-</div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800 leading-tight">{neutral.length} <span className="font-medium text-slate-600">Neutral / undetermined</span></p>
                    <p className="text-[10px] text-slate-500">No clear relationship or insufficient information.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why these results matter */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 mt-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Info className="w-3 h-3" /></div>
                <h4 className="font-bold text-[13px] text-slate-800">Why these results matter</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                SciTrace AI helps you quickly discover how research findings relate across multiple papers, highlighting supporting evidence, potential contradictions, and areas that need deeper investigation.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
