import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, ChevronDown, CheckCircle2, FileText, RefreshCw, LayoutGrid, List, Plus, Trash2 } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { analysisApi } from '../services/api';
import { getAnalysisStats } from '../utils/analysisStats';
import Navbar, { LogoIcon } from '../components/Navbar';

export default function Analyses() {
  const [analyses, setAnalyses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await analysisApi.getAnalyses();
        let all = (res.success && res.data) ? res.data : [];
        const demoRes = analysisApi.getDemoAnalysis();
        const demo = demoRes.data || (await mockAnalysisService.getAnalysisById('demo-analysis'));
        if (demo && !all.find(a => a.id === demo.id)) {
          all = [...all, demo];
        }
        setAnalyses(all);
      } catch (e) {
        console.error("Failed to load analyses:", e);
      }
    };
    fetchAnalyses();
  }, []);

  const handleDelete = async (id) => {
    if (id === 'demo-analysis') {
      alert("Demonstration analysis is protected and cannot be deleted.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this analysis?")) {
      const res = await analysisApi.deleteAnalysis(id);
      if (res.success) {
        setAnalyses(prev => prev.filter(a => a.id !== id));
      } else {
        alert(res.error || "Failed to delete analysis.");
      }
    }
  };

  const handleRetry = async (id) => {
    await analysisApi.retryAnalysis(id);
    navigate(`/analysis/${id}/progress`);
  };

  let filteredAnalyses = analyses.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (statusFilter !== "all") {
    filteredAnalyses = filteredAnalyses.filter(a => a.status === statusFilter);
  }

  if (sortBy === "recent") {
    filteredAnalyses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === "oldest") {
    filteredAnalyses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === "name") {
    filteredAnalyses.sort((a, b) => a.title.localeCompare(b.title));
  }

  const totalPapers = analyses.reduce((acc, a) => acc + (a.papers?.length || 0), 0);
  const totalClaims = analyses.reduce((acc, a) => acc + (a.claims?.length || 0), 0);
  const totalRelationships = analyses.reduce((acc, a) => acc + (a.relationships?.length || 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
      {/* Responsive Navbar */}
      <Navbar activeTab="analyses" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col relative z-10">

          <div className="flex flex-col lg:flex-row justify-between items-start mb-6 sm:mb-8 gap-6">
            <div className="max-w-2xl">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:gap-2">
                 <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link> 
                 <ChevronRight className="w-3 h-3 text-slate-400"/> 
                 <span>Analysis History</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-[44px] font-serif text-[#0f2a24] leading-tight mb-2 sm:mb-3 tracking-tight">
                Analysis History
              </h1>
              <p className="text-[14px] sm:text-[16px] text-slate-500 mb-4 sm:mb-6">
                Review, reopen, and explore your previous research analyses.
              </p>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[12px] sm:text-[14px] text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-slate-200/60 shadow-xs sm:shadow-none">
                  <FileText className="w-4 h-4 text-slate-500"/> 
                  <span><strong className="text-slate-800">{analyses.length}</strong> analyses</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-slate-200/60 shadow-xs sm:shadow-none">
                  <FileText className="w-4 h-4 text-slate-500"/> 
                  <span><strong className="text-slate-800">{totalPapers}</strong> papers</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-slate-200/60 shadow-xs sm:shadow-none">
                  <LogoIcon className="w-4 h-4 text-emerald-500"/> 
                  <span><strong className="text-slate-800">{totalClaims}</strong> claims</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border sm:border-0 border-slate-200/60 shadow-xs sm:shadow-none">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600"/> 
                  <span><strong className="text-slate-800">{totalRelationships}</strong> relationships</span>
                </div>
              </div>
            </div>

            {/* Top Right Graphic (Hidden on mobile/tablet to avoid overflow) */}
            <div className="hidden xl:block w-[380px] h-[130px] relative pointer-events-none shrink-0">
              <div className="absolute left-[60px] top-4 bg-white shadow-md border border-slate-100 rounded-lg p-2.5 w-[70px] h-[80px] flex flex-col justify-center items-center -rotate-6 z-10">
                 <div className="w-full h-1 bg-slate-200 rounded mb-1.5"></div><div className="w-2/3 h-1 bg-slate-200 rounded self-start"></div>
              </div>
              <div className="absolute left-[90px] top-8 bg-white shadow-md border border-slate-100 rounded-lg p-2.5 w-[70px] h-[80px] flex flex-col justify-center items-center rotate-6 z-20">
                 <div className="w-full h-1 bg-slate-200 rounded mb-1.5"></div><div className="w-1/2 h-1 bg-red-200 rounded self-start"></div>
              </div>
              
              <svg className="absolute right-0 top-0 w-[180px] h-[120px]" pointerEvents="none">
                 <path d="M 40 80 L 100 40" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3"/>
                 <path d="M 100 40 L 140 80" stroke="#a7f3d0" strokeWidth="2" strokeDasharray="3 3"/>
                 <path d="M 100 40 L 160 20" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3"/>
                 <circle cx="40" cy="80" r="4" fill="#3b82f6" />
                 <circle cx="100" cy="40" r="4" fill="#10b981" />
                 <circle cx="140" cy="80" r="4" fill="#10b981" />
                 <circle cx="160" cy="20" r="4" fill="#cbd5e1" />
              </svg>
              
              <div className="absolute right-[110px] top-[80px] bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 z-30">
                 <LogoIcon className="w-3 h-3 text-blue-500"/>
                 <div className="text-[10px] font-bold text-slate-700 leading-none">Analyses<br/><span className="text-[12px] text-slate-800">{analyses.length}</span></div>
              </div>
              <div className="absolute right-[30px] top-[50px] bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1 flex flex-col items-center z-30">
                 <div className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Claims</div>
                 <div className="text-[13px] font-bold text-slate-800 leading-none">{totalClaims}</div>
              </div>
              <div className="absolute right-[70px] -top-[5px] bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1 flex flex-col items-center z-30">
                 <div className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Papers</div>
                 <div className="text-[12px] font-bold text-slate-800 leading-none">{totalPapers}</div>
              </div>
            </div>
          </div>

          {/* Controls Bar - Fully Responsive Stack/Wrap */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6">
            <div className="flex-1 relative min-w-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                id="search-input"
                type="text" 
                placeholder="Search analyses by title..." 
                className="w-full bg-white pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-[13px] sm:text-[14px] font-medium outline-none focus:border-emerald-500 shadow-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3">
              <div className="relative w-full sm:w-[150px]">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 px-3.5 py-2.5 sm:py-3 pr-9 rounded-xl shadow-xs font-medium text-[13px] sm:text-[14px] text-slate-700 cursor-pointer outline-none focus:border-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
              </div>
              
              <div className="relative w-full sm:w-[160px]">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 px-3.5 py-2.5 sm:py-3 pr-9 rounded-xl shadow-xs font-medium text-[13px] sm:text-[14px] text-slate-700 cursor-pointer outline-none focus:border-emerald-500"
                >
                  <option value="recent">Recent First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
              </div>

              <div className="hidden sm:flex bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden shrink-0 h-[42px] sm:h-[46px]">
                <button 
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-slate-50 text-emerald-600' : 'bg-white text-slate-400 hover:bg-slate-50'} transition-colors cursor-pointer`}
                >
                  <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5"/>
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`px-3 py-2 border-l border-slate-200 ${viewMode === 'list' ? 'bg-slate-50 text-emerald-600' : 'bg-white text-slate-400 hover:bg-slate-50'} transition-colors cursor-pointer`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5"/>
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid / List - Fully Responsive */}
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6' : 'flex flex-col gap-4'} pb-12`}>
            
            {filteredAnalyses.length === 0 ? (
               <div className="col-span-full text-center py-16 sm:py-20 bg-white border border-slate-200 rounded-2xl shadow-sm px-4">
                 <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                   <LogoIcon className="w-6 h-6" />
                 </div>
                 <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Welcome to your Workspace</h3>
                 <p className="text-slate-500 font-medium text-[14px] mb-6 max-w-md mx-auto">
                   {searchQuery ? "No analyses match your search criteria. Try a different query." : "No analyses found. Create a new one or explore our interactive demo."}
                 </p>
                 <div className="flex flex-wrap items-center justify-center gap-3">
                   <Link to="/analysis/new" className="inline-flex items-center gap-2 bg-[#0f2a24] text-white px-5 py-2.5 rounded-xl text-[14px] font-medium hover:bg-slate-900 transition-colors shadow-sm">
                     <Plus className="w-4 h-4"/> New Analysis
                   </Link>
                   <Link to="/analysis/demo-analysis/results" className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-[14px] font-medium hover:bg-slate-50 transition-colors shadow-sm">
                     <LayoutGrid className="w-4 h-4"/> Explore Demo
                   </Link>
                 </div>
               </div>
            ) : (
              filteredAnalyses.map(analysis => {
                const isCompleted = analysis.status === 'completed';
                const isProcessing = analysis.status === 'processing';

                const stats = getAnalysisStats(analysis);
                const pCount = stats.paperCount;
                const cCount = stats.totalClaims;
                const rCount = stats.totalRelationships;
                
                const supporting = stats.supporting.length;
                const contradictions = stats.contradictions.length;
                const neutral = stats.neutral.length;

                const supPct = rCount > 0 ? (supporting / rCount) * 100 : 0;
                const conPct = rCount > 0 ? (contradictions / rCount) * 100 : 0;
                const neuPct = rCount > 0 ? (neutral / rCount) * 100 : 0;

                return (
                  <div key={analysis.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                    {isProcessing && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-100">
                        <div className="h-full bg-blue-500 w-[68%] animate-pulse"></div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${isProcessing ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center shrink-0`}>
                          <FileText className="w-5 h-5"/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-[14px] sm:text-[15px] text-slate-800 leading-snug truncate" title={analysis.title}>
                            {analysis.title}
                          </h3>
                          <p className="text-[11px] sm:text-[12px] text-slate-500 mt-0.5">
                            {pCount} research paper{pCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(analysis.id === 'demo-analysis' || analysis.id === 'demo' || analysis.isDemo) && (
                          <div className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 sm:py-1 rounded-full text-[10px] font-bold shrink-0">
                            Demo Dataset
                          </div>
                        )}
                        {isCompleted ? (
                           <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 sm:py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                             <CheckCircle2 className="w-3 h-3"/> Completed
                           </div>
                        ) : isProcessing ? (
                           <div className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 sm:py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                             <RefreshCw className="w-3 h-3 animate-spin"/> Processing
                           </div>
                        ) : (
                           <div className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 sm:py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                             <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Incomplete
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[12px] sm:text-[13px] text-slate-600 leading-snug mb-4 line-clamp-2">
                      Comparison of research claims extracted from uploaded papers regarding {analysis.title.toLowerCase()}.
                    </p>
                    
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                      <div className="flex -space-x-2">
                        {analysis.papers?.slice(0, 3).map((p, i) => (
                           <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded border-2 border-white bg-slate-100 flex items-center justify-center shadow-2xs" title={p.title}>
                             <FileText className="w-3.5 h-3.5 text-slate-400"/>
                           </div>
                        ))}
                        {pCount > 3 && (
                           <div className="w-7 h-7 sm:w-8 sm:h-8 rounded border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-2xs">
                             +{pCount - 3}
                           </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-slate-500">
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Metric Badges Grid */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4 text-center bg-slate-50/70 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-[13px] sm:text-[14px] text-slate-800 leading-none">{pCount}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-1">Papers</p>
                      </div>
                      <div className="border-l border-slate-200/60">
                        <p className="font-bold text-[13px] sm:text-[14px] text-blue-600 leading-none">{cCount}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-1">Claims</p>
                      </div>
                      <div className="border-l border-slate-200/60">
                        <p className="font-bold text-[13px] sm:text-[14px] text-slate-800 leading-none">{rCount}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold tracking-wider mt-1">Pairs</p>
                      </div>
                      <div className="border-l border-slate-200/60">
                        <p className={`font-bold text-[13px] sm:text-[14px] leading-none ${contradictions > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {contradictions}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-red-500/80 uppercase font-semibold tracking-wider mt-1">Contra</p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <p className="text-[11px] font-bold text-slate-700 mb-1.5 flex justify-between items-center">
                        <span>Relationships</span>
                        {rCount > 0 && <span className="text-[10px] font-medium text-slate-400">{rCount} evaluated</span>}
                      </p>
                      
                      {rCount > 0 ? (
                        <>
                          <div className="flex h-2 rounded-full overflow-hidden mb-2 bg-slate-100">
                             <div className="bg-emerald-500 transition-all" style={{width: `${supPct}%`}}></div>
                             <div className="bg-red-400 transition-all" style={{width: `${conPct}%`}}></div>
                             <div className="bg-slate-300 transition-all" style={{width: `${neuPct}%`}}></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-4 flex-wrap gap-1">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div> {supporting} Sup</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400 shrink-0"></div> {contradictions} Con</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div> {neutral} Neu</span>
                          </div>
                        </>
                      ) : (
                         <div className="text-[10px] text-slate-400 mb-4 italic text-center py-1">No cross-paper claims evaluated yet.</div>
                      )}
                      
                      <div className="flex gap-2 mt-auto">
                        {isCompleted ? (
                          <Link to={`/analysis/${analysis.id}/results`} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-white shadow-xs transition-colors">
                            View Results &rarr;
                          </Link>
                        ) : isProcessing ? (
                          <Link to={`/analysis/${analysis.id}/progress`} className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-blue-100 shadow-xs transition-colors">
                            View Progress &rarr;
                          </Link>
                        ) : (
                          <button onClick={() => handleRetry(analysis.id)} className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-amber-100 shadow-xs transition-colors cursor-pointer">
                            Try Again <RefreshCw className="w-3.5 h-3.5"/>
                          </button>
                        )}
                        <button onClick={() => handleDelete(analysis.id)} title="Delete Analysis" className="bg-white border border-red-200 text-red-500 px-3 py-2 sm:py-2.5 rounded-lg shadow-xs hover:bg-red-50 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

          </div>
      </main>
    </div>
  );
}
