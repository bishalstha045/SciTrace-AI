import { useEffect, useState } from 'react';
import { Search, FileText, CheckCircle2, ChevronRight, Download, Filter, ArrowUpDown, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
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

export default function Results() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterPaper, setFilterPaper] = useState('all');
  const [sortMode, setSortMode] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const id = analysisId || 'demo-analysis';
        const data = await mockAnalysisService.getAnalysisById(id);
        setAnalysis(data);
      } catch (err) {
        console.error("Analysis not found:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading analysis results...</div>;
  if (!analysis) return <div className="p-10 text-center font-bold text-red-500">Analysis not found.</div>;

  // Derive stats dynamically
  const totalClaims = analysis.claims?.length || 0;
  const paperCount = analysis.papers?.length || 0;
  const relationships = analysis.relationships || [];
  
  const supporting = relationships.filter(r => r.type === 'supporting');
  const contradictions = relationships.filter(r => r.type === 'contradiction');
  const neutral = relationships.filter(r => r.type === 'neutral' || r.type === 'related');

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
      
      {/* Navbar */}
      <nav className="sticky top-0 w-full h-[80px] flex items-center justify-between px-6 lg:px-[60px] z-50 border-b border-slate-200/50 bg-white">
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
            <Link to="/analysis/new" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-50 flex items-center gap-2">
              New Analysis
            </Link>
            <Link to={`/analysis/${analysis.id}/export`} className="bg-[#0b1f1b] text-white px-5 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-2">
              Export <Download className="w-4 h-4"/>
            </Link>
            <ProfileMenu />
          </div>
        </nav>

        {/* Background Stack of Papers (Right Side) */}
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
        <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-[60px] py-10 flex flex-col relative z-10 flex-1">
          
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 Workspace <ChevronRight className="w-3 h-3"/> Analysis Results
              </div>
              <h1 className="text-[40px] font-serif text-[#0f2a24] leading-none mb-3 tracking-tight">
                {analysis.title}
              </h1>
              <p className="text-[15px] text-slate-500 mb-2">
                Comparison of scientific claims across your uploaded papers.
              </p>
              <div className="flex items-center gap-3 text-[13px] text-slate-500 font-medium">
                <span>{paperCount} Papers</span> &bull; <span>{totalClaims} Claims</span> &bull; <span>{relationships.length} Claim Comparisons</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                 <CheckCircle2 className="w-5 h-5"/>
                 <div>
                   <p className="text-[12px] font-bold leading-none">Analysis completed</p>
                   <p className="text-[10px] opacity-80 mt-0.5">Just now</p>
                 </div>
               </div>
               <Link to="/analysis/new" className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium text-[14px] hover:bg-slate-50 flex items-center gap-2 shadow-sm">
                 New Analysis
               </Link>
               <Link to={`/analysis/${analysis.id}/export`} className="bg-[#0b1f1b] text-white px-5 py-2.5 rounded-lg font-medium text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-2">
                 <Download className="w-4 h-4"/> Export Report
               </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><FileText className="w-5 h-5"/></div>
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
            <div className="flex-1 bg-red-50 rounded-xl border border-red-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center shrink-0 border border-red-200 shadow-sm"><AlertTriangle className="w-5 h-5"/></div>
              <div>
                <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider mb-0.5">POTENTIAL CONTRADICTIONS</p>
                <h3 className="text-[28px] font-bold text-red-600 leading-none mb-1">{contradictions.length}</h3>
                <p className="text-[11px] text-red-500/80">Relationships requiring investigation</p>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200"><LogoIcon className="w-5 h-5"/></div>
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
          <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
            {/* Left Column */}
            <div className="flex-[2.5] flex flex-col gap-6 min-h-0 w-full overflow-hidden">
              
              {/* Chart Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col lg:flex-row gap-10">
                <div className="w-[180px]">
                  <h3 className="font-bold text-[16px] text-slate-800 mb-1">Claim Relationships</h3>
                  <p className="text-[12px] text-slate-500 mb-6">How the analyzed claims relate to one another.</p>
                  
                  {/* Fake Donut Chart */}
                  <div className="w-[140px] h-[140px] mx-auto relative rounded-full border-[16px] border-slate-100 flex items-center justify-center">
                    <div className="absolute inset-[-16px] rounded-full border-[16px] border-emerald-500 [clip-path:polygon(0_0,50%_0,50%_50%,0_0)] transform rotate-[0deg]"></div>
                    <div className="absolute inset-[-16px] rounded-full border-[16px] border-emerald-500 [clip-path:polygon(50%_0,100%_0,100%_50%,50%_50%)]"></div>
                    <div className="absolute inset-[-16px] rounded-full border-[16px] border-slate-300 [clip-path:polygon(100%_50%,100%_100%,0_100%,0_50%,50%_50%)]"></div>
                    <div className="absolute inset-[-16px] rounded-full border-[16px] border-red-500 [clip-path:polygon(100%_50%,100%_80%,50%_50%)]"></div>
                    
                    <div className="text-center">
                      <p className="text-[24px] font-bold text-slate-800 leading-none mb-1">{relationships.length}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Total Pairs</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-4 pt-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> <CheckCircle2 className="w-4 h-4 text-emerald-600"/> Supporting</div>
                    <div className="flex gap-10 text-[13px] font-bold text-slate-800"><span>{supporting.length}</span> <span className="text-slate-400 font-normal">{((supporting.length / relationships.length || 0) * 100).toFixed(1)}%</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700"><div className="w-3 h-3 rounded-full bg-red-500"></div> <AlertTriangle className="w-4 h-4 text-red-600"/> Potential Contradiction</div>
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
                      }).sort((a,b) => b.total - a.total).slice(0,3);
                      
                      return paperStats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-4 text-[11px]">
                          <span className="text-slate-600 w-24 truncate" title={stat.title}>{stat.title}</span>
                          <div className="flex-1 h-3 flex rounded-sm overflow-hidden bg-slate-100">
                             {stat.total > 0 && (
                               <>
                                 <div className="bg-emerald-400" style={{width: `${(stat.sup/stat.total)*100}%`}}></div>
                                 <div className="bg-red-400" style={{width: `${(stat.con/stat.total)*100}%`}}></div>
                                 <div className="bg-slate-300" style={{width: `${(stat.neu/stat.total)*100}%`}}></div>
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

                  <div className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-2 w-[180px] focus-within:border-emerald-500 transition-colors">
                    <Search className="w-3.5 h-3.5 text-slate-400"/> 
                    <input 
                      type="text" 
                      placeholder="Search claims..." 
                      className="bg-transparent border-none outline-none w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Claims List */}
              <div className="flex-1 overflow-y-auto bg-transparent rounded-xl flex flex-col gap-4 pr-2 pb-10">
                <div className="flex justify-between items-end mb-1">
                  <div>
                    <h3 className="text-[20px] font-serif text-slate-800">
                      {filterType === 'all' ? 'All Relationships' : filterType === 'supporting' ? 'Supporting Evidence' : filterType === 'contradiction' ? 'Potential Contradictions' : 'Neutral Findings'}
                    </h3>
                    <p className="text-[12px] text-slate-500">
                      {filterType === 'contradiction' ? 'Claims that appear to make incompatible statements and may require further investigation.' : 'Explore the specific findings and their sources.'}
                    </p>
                  </div>
                  <div className="text-[12px] text-slate-500 flex items-center gap-3">
                    <span>{filteredRelationships.length} relationships</span>
                    <div 
                      className="flex items-center gap-1 cursor-pointer font-bold text-slate-700 hover:text-emerald-600 transition-colors"
                      onClick={() => setSortMode(prev => prev === 'relevance' ? 'confidence' : 'relevance')}
                    >
                      <ArrowUpDown className="w-3 h-3"/> Sort by {sortMode === 'relevance' ? 'Relevance' : 'Confidence'}
                    </div>
                  </div>
                </div>

                {filteredRelationships.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 shadow-sm">
                     No relationships found for this filter.
                  </div>
                ) : (
                  filteredRelationships.map((rel, idx) => {
                    const sourceClaim = getClaimById(rel.sourceClaimId);
                    const targetClaim = getClaimById(rel.targetClaimId);
                    if (!sourceClaim || !targetClaim) return null;

                    const sourcePaper = getPaperById(sourceClaim.paperId);
                    const targetPaper = getPaperById(targetClaim.paperId);

                    const isContradiction = rel.type === 'contradiction';
                    const isSupporting = rel.type === 'supporting';

                    return (
                      <div key={rel.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm ${isContradiction ? 'border-red-200' : isSupporting ? 'border-emerald-200' : 'border-slate-200'}`}>
                        <div className={`${isContradiction ? 'bg-red-50/50 border-red-100 text-red-700' : isSupporting ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'} px-4 py-2 border-b flex justify-between items-center`}>
                          <div className="flex items-center gap-2 text-[12px] font-bold">
                            {isContradiction ? <AlertTriangle className="w-4 h-4 fill-red-100"/> : isSupporting ? <CheckCircle2 className="w-4 h-4 fill-emerald-100"/> : <LogoIcon className="w-4 h-4"/>} 
                            {isContradiction ? 'Potential contradiction' : isSupporting ? 'Supporting evidence' : 'Neutral relationship'}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[11px] font-bold ${isContradiction ? 'text-red-600' : isSupporting ? 'text-emerald-600' : 'text-slate-500'}`}>{rel.confidence}% relationship confidence</span>
                            <div className={`w-24 h-2 rounded-full overflow-hidden ${isContradiction ? 'bg-red-100' : isSupporting ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                              <div className={`h-full rounded-full ${isContradiction ? 'bg-red-500' : isSupporting ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{width: `${rel.confidence}%`}}></div>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isContradiction ? 'text-red-300' : isSupporting ? 'text-emerald-300' : 'text-slate-300'} rotate-90`}/>
                          </div>
                        </div>
                        <div className="p-5 overflow-x-auto">
                          <div className="flex flex-col md:flex-row gap-6 relative min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-slate-800">Paper A</p>
                                  <p className="text-[11px] font-semibold text-blue-600 truncate">{sourcePaper?.title}</p>
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
                                {isContradiction ? <ArrowUpDown className="w-4 h-4 mb-0.5"/> : isSupporting ? <CheckCircle2 className="w-4 h-4 mb-0.5"/> : <LogoIcon className="w-4 h-4 mb-0.5"/>}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0"/>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-slate-800">Paper B</p>
                                  <p className="text-[11px] font-semibold text-blue-600 truncate">{targetPaper?.title}</p>
                                  <p className="text-[10px] text-slate-400">Page {targetClaim.page}</p>
                                </div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-[13px] text-slate-700 font-medium italic break-words">"{targetClaim.text}"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {(rel.contextDifferences?.length > 0) && (
                          <div className="bg-amber-50/50 px-5 py-3 border-t border-amber-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                              <span className="text-[11px] font-bold text-amber-700">Possible contextual difference</span>
                              <span className="text-slate-300 px-1">|</span>
                              <span className="text-[11px] font-semibold text-amber-600 bg-amber-100/50 px-2 rounded">Methodology</span>
                              <span className="text-[11px] text-amber-600/80">{rel.contextDifferences[0]} <Info className="w-3 h-3 inline pb-0.5"/></span>
                            </div>
                            <div className="flex gap-2">
                              <Link to={`/analysis/${analysis.id}/paper/${sourcePaper?.id}`} className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50">Open Paper &nearr;</Link>
                              <Link to={`/analysis/${analysis.id}/evidence/${rel.id}`} className="text-[11px] font-bold text-white bg-slate-800 px-3 py-1.5 rounded shadow-sm hover:bg-slate-900">View Evidence &rarr;</Link>
                            </div>
                          </div>
                        )}
                        {(!rel.contextDifferences || rel.contextDifferences.length === 0) && (
                          <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
                            <div className="flex gap-2">
                              <Link to={`/analysis/${analysis.id}/paper/${sourcePaper?.id}`} className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50">Open Paper &nearr;</Link>
                              <Link to={`/analysis/${analysis.id}/evidence/${rel.id}`} className="text-[11px] font-bold text-white bg-slate-800 px-3 py-1.5 rounded shadow-sm hover:bg-slate-900">View Evidence &rarr;</Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column (Sidebar) */}
            <div className="flex-1 flex flex-col gap-6">
              
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
                        <CheckCircle2 className="w-3 h-3"/> Analyzed
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Key Findings Mini Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-[14px] text-slate-800 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500"/> Key Findings</h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer"/>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                     <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="w-3 h-3"/></div>
                     <div>
                       <p className="text-[12px] font-bold text-slate-800 leading-tight">{supporting.length} <span className="font-medium text-slate-600">Supporting relationships</span></p>
                       <p className="text-[10px] text-slate-500">Claims that agree with each other.</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle className="w-3 h-3"/></div>
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
                   <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Info className="w-3 h-3"/></div>
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
