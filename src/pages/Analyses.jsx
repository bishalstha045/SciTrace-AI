import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, ChevronDown, CheckCircle2, FileText, AlertTriangle, RefreshCw, LayoutGrid, List, Plus, Trash2 } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { analysisApi } from '../services/api';
import { getAnalysisStats } from '../utils/analysisStats';
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
      {/* Navbar */}
      <nav className="w-full bg-white px-6 sm:px-10 py-4 flex items-center justify-between border-b border-slate-200/50 z-50">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LogoIcon className="w-7 h-7 text-emerald-500" strokeWidth={2} />
          <span className="font-serif font-bold text-[#0f2a24] text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link 
            to="/analyses" 
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors"
          >
            Workspace
          </Link>
          <div className="relative h-full flex items-center">
            <Link to="/analyses" className="text-slate-900 font-semibold text-[14px] cursor-pointer pt-2 pb-2">Analyses</Link>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>
          </div>
          <Link to="/papers" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Papers</Link>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/analysis/demo-analysis/results" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-50 flex items-center gap-2 hidden sm:flex">
            <LayoutGrid className="w-4 h-4"/> Demo
          </Link>
          <Link to="/analysis/new" className="bg-[#0b1f1b] text-white px-5 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-2 hidden sm:flex">
            <Plus className="w-4 h-4"/> New Analysis
          </Link>
          <ProfileMenu />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 py-8 flex flex-col relative z-10">

          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link> <ChevronRight className="w-3 h-3"/> Analysis History
              </div>
              <h1 className="text-[44px] font-serif text-[#0f2a24] leading-none mb-3 tracking-tight">
                Analysis History
              </h1>
              <p className="text-[16px] text-slate-500 mb-6">
                Review, reopen, and explore your previous research analyses.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-[14px] text-slate-600 font-medium">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> <span className="font-bold text-slate-800">{analyses.length}</span> analyses</div>
                <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> <span className="font-bold text-slate-800">{totalPapers}</span> papers analyzed</div>
                <div className="flex items-center gap-2"><LogoIcon className="w-4 h-4"/> <span className="font-bold text-slate-800">{totalClaims}</span> claims extracted</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600"/> <span className="font-bold text-slate-800">{totalRelationships}</span> relationships</div>
              </div>
            </div>

            {/* Top Right Graphic */}
            <div className="w-[400px] h-[140px] relative pointer-events-none">
              <div className="absolute left-[80px] top-4 bg-white shadow-md border border-slate-100 rounded-lg p-2.5 w-[70px] h-[80px] flex flex-col justify-center items-center -rotate-6 z-10">
                 <div className="w-full h-1 bg-slate-200 rounded mb-1.5"></div><div className="w-2/3 h-1 bg-slate-200 rounded self-start"></div>
              </div>
              <div className="absolute left-[110px] top-8 bg-white shadow-md border border-slate-100 rounded-lg p-2.5 w-[70px] h-[80px] flex flex-col justify-center items-center rotate-6 z-20">
                 <div className="w-full h-1 bg-slate-200 rounded mb-1.5"></div><div className="w-1/2 h-1 bg-red-200 rounded self-start"></div>
              </div>
              
              <svg className="absolute right-0 top-0 w-[200px] h-[120px]" pointerEvents="none">
                 <path d="M 50 80 L 120 40" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3"/>
                 <path d="M 120 40 L 160 80" stroke="#a7f3d0" strokeWidth="2" strokeDasharray="3 3"/>
                 <path d="M 120 40 L 180 20" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3"/>
                 <circle cx="50" cy="80" r="5" fill="#3b82f6" />
                 <circle cx="120" cy="40" r="5" fill="#10b981" />
                 <circle cx="160" cy="80" r="5" fill="#10b981" />
                 <circle cx="180" cy="20" r="5" fill="#cbd5e1" />
              </svg>
              
              <div className="absolute right-[130px] top-[90px] bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1.5 flex items-center gap-1.5 z-30">
                 <LogoIcon className="w-3 h-3 text-blue-500"/>
                 <div className="text-[10px] font-bold text-slate-700 leading-none">Analyses<br/><span className="text-[12px] text-slate-800">{analyses.length}</span></div>
              </div>
              <div className="absolute right-[40px] top-[60px] bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1.5 flex flex-col items-center z-30">
                 <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Claims</div>
                 <div className="text-[14px] font-bold text-slate-800 leading-none">{totalClaims}</div>
              </div>
              <div className="absolute right-[80px] -top-[10px] bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1.5 flex flex-col items-center z-30">
                 <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Papers</div>
                 <div className="text-[12px] font-bold text-slate-800 leading-none">{totalPapers}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                id="search-input"
                type="text" 
                placeholder="Search analyses..." 
                className="w-full bg-white pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-[14px] font-medium outline-none focus:border-emerald-500 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative min-w-[150px]">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 px-4 py-3 pr-10 rounded-xl shadow-sm font-medium text-[14px] text-slate-700 cursor-pointer outline-none focus:border-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed / Incomplete</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"/>
            </div>
            
            <div className="relative min-w-[150px]">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 px-4 py-3 pr-10 rounded-xl shadow-sm font-medium text-[14px] text-slate-700 cursor-pointer outline-none focus:border-emerald-500"
              >
                <option value="recent">Recently Updated</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"/>
            </div>

            <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0 h-[46px]">
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-slate-50 text-emerald-600' : 'bg-white text-slate-400 hover:bg-slate-50'} transition-colors`}
              >
                <LayoutGrid className="w-5 h-5"/>
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 border-l border-slate-200 ${viewMode === 'list' ? 'bg-slate-50 text-emerald-600' : 'bg-white text-slate-400 hover:bg-slate-50'} transition-colors`}
              >
                <List className="w-5 h-5"/>
              </button>
            </div>
          </div>

          {/* Cards Grid / List */}
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-3 gap-6' : 'flex flex-col gap-4'} h-[550px] overflow-y-auto pb-10 pr-2`}>
            
            {filteredAnalyses.length === 0 ? (
               <div className="col-span-3 text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to your Workspace</h3>
                 <p className="text-slate-500 font-medium mb-6">No analyses found. Create a new one or explore our interactive demo.</p>
                 <div className="flex items-center justify-center gap-4">
                   <Link to="/analysis/new" className="inline-flex items-center gap-2 bg-[#0f2a24] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-sm">
                     <Plus className="w-4 h-4"/> New Analysis
                   </Link>
                   <Link to="/analysis/demo-analysis/results" className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm">
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
                  <div key={analysis.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                    {isProcessing && <div className="absolute top-0 left-0 w-full h-1 bg-blue-100"><div className="h-full bg-blue-500 w-[68%]"></div></div>}
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg ${isProcessing ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center shrink-0`}><FileText className="w-5 h-5"/></div>
                        <div>
                          <h3 className="font-bold text-[15px] text-slate-800 leading-tight pr-2 truncate max-w-[200px]" title={analysis.title}>{analysis.title}</h3>
                          <p className="text-[12px] text-slate-500">Analyzed {pCount} research papers</p>
                        </div>
                      </div>
                      
                      {isCompleted ? (
                         <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3 h-3"/> Completed</div>
                      ) : isProcessing ? (
                         <div className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"><RefreshCw className="w-3 h-3 animate-spin"/> Processing</div>
                      ) : (
                         <div className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Incomplete</div>
                      )}
                    </div>
                    
                    <p className="text-[13px] text-slate-600 leading-snug mb-4 line-clamp-2 mt-2">Comparison of research claims extracted from uploaded papers regarding {analysis.title.toLowerCase()}.</p>
                    
                    <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-4">
                      <div className="flex -space-x-2">
                        {analysis.papers?.slice(0, 3).map((p, i) => (
                           <div key={i} className="w-8 h-8 rounded border-2 border-white bg-slate-100 flex items-center justify-center" title={p.title}><FileText className="w-3.5 h-3.5 text-slate-400"/></div>
                        ))}
                        {pCount > 3 && (
                           <div className="w-8 h-8 rounded border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500">+{pCount - 3}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-800">{new Date(analysis.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className={`flex ${viewMode === 'list' ? 'justify-start gap-8' : 'justify-between'} items-center mb-4 text-center`}>
                      <div><div className="flex items-center gap-1 justify-center text-slate-600 mb-0.5"><FileText className="w-4 h-4"/> <span className="font-bold text-[14px] text-slate-800">{pCount}</span></div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Papers</p></div>
                      {viewMode === 'grid' && <div className="w-[1px] h-8 bg-slate-100"></div>}
                      <div><div className="flex items-center gap-1 justify-center text-blue-600 mb-0.5"><span className="font-serif font-bold italic text-[16px]">"</span> <span className="font-bold text-[14px] text-slate-800">{cCount}</span></div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Claims</p></div>
                      {viewMode === 'grid' && <div className="w-[1px] h-8 bg-slate-100"></div>}
                      <div><div className="flex items-center gap-1 justify-center text-slate-600 mb-0.5"><LogoIcon className="w-4 h-4"/> <span className="font-bold text-[14px] text-slate-800">{rCount}</span></div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Relationships</p></div>
                      {viewMode === 'grid' && <div className="w-[1px] h-8 bg-slate-100"></div>}
                      <div><div className="flex items-center gap-1 justify-center text-red-500 mb-0.5"><AlertTriangle className="w-4 h-4"/> <span className="font-bold text-[14px] text-red-600">{contradictions}</span></div><p className="text-[10px] text-red-500/80 uppercase font-bold tracking-wide">Contradictions</p></div>
                    </div>

                    <div className="mt-auto">
                      <p className="text-[11px] font-bold text-slate-800 mb-1.5">Claim Relationships</p>
                      {rCount > 0 ? (
                        <>
                          <div className="flex h-2.5 rounded-full overflow-hidden mb-2">
                             <div className="bg-emerald-400" style={{width: `${supPct}%`}}></div>
                             <div className="bg-red-400" style={{width: `${conPct}%`}}></div>
                             <div className="bg-slate-300" style={{width: `${neuPct}%`}}></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-4">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {supporting} Supporting</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> {contradictions} Contradictions</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> {neutral} Neutral</span>
                          </div>
                        </>
                      ) : (
                         <div className="text-[10px] text-slate-400 mb-4 italic text-center py-2">Not enough data to calculate relationships.</div>
                      )}
                      
                      <div className="flex gap-2 mt-auto">
                        {isCompleted ? (
                          <Link to={`/analysis/${analysis.id}/results`} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-white shadow-sm transition-colors">View Results &rarr;</Link>
                        ) : isProcessing ? (
                          <Link to={`/analysis/${analysis.id}/progress`} className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-2 rounded-lg text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-blue-100 shadow-sm transition-colors">View Progress &rarr;</Link>
                        ) : (
                          <button onClick={() => handleRetry(analysis.id)} className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 py-2 rounded-lg text-[13px] font-bold flex justify-center items-center gap-1.5 hover:bg-amber-100 shadow-sm transition-colors">Try Again <RefreshCw className="w-3.5 h-3.5"/></button>
                        )}
                        <button onClick={() => handleDelete(analysis.id)} title="Delete Analysis" className="bg-white border border-red-200 text-red-500 px-3 py-2 rounded-lg shadow-sm hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4"/></button>
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
