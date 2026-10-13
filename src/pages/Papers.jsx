import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { analysisApi } from '../services/api';
import Navbar from '../components/Navbar';

export default function Papers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await analysisApi.getAnalyses();
        let all = (res.success && res.data) ? res.data : [];
        const demoRes = analysisApi.getDemoAnalysis();
        const demoAnalysis = demoRes.data || (await mockAnalysisService.getAnalysisById('demo-analysis'));
        if (demoAnalysis && !all.find(a => a.id === demoAnalysis.id)) {
          all.push(demoAnalysis);
        }
        
        let allPapers = [];
        all.forEach(analysis => {
          if (analysis.papers) {
            analysis.papers.forEach(p => {
              if (!allPapers.find(existing => existing.id === p.id)) {
                allPapers.push({
                  ...p,
                  title: p.title || p.filename || p.name || 'Untitled Document',
                  analysisTitle: analysis.title,
                  analysisId: analysis.id
                });
              }
            });
          }
        });
        setPapers(allPapers);
      } catch (e) {
        console.error("Failed to load papers:", e);
      }
    };
    fetchPapers();
  }, []);

  const filteredPapers = papers.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(p.authors) ? p.authors.join(' ') : p.authors || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
      {/* Responsive Navbar */}
      <Navbar activeTab="papers" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 sm:mb-8">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:gap-2">
               <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link> 
               <ChevronRight className="w-3 h-3 text-slate-400"/> 
               <span>Document Library</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-[44px] font-serif text-[#0f2a24] leading-tight mb-2 sm:mb-3 tracking-tight">
              All Papers
            </h1>
            <p className="text-[14px] sm:text-[16px] text-slate-500 mb-4 sm:mb-6">
              Browse all documents uploaded across your analyses.
            </p>
            
            <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-slate-600 font-medium">
              <FileText className="w-4 h-4 text-emerald-600"/> 
              <span><strong className="text-slate-800">{papers.length}</strong> papers total</span>
            </div>
          </div>
        </div>

        {/* Search Control */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search papers by title or author..." 
              className="w-full bg-white pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-[13px] sm:text-[14px] font-medium outline-none focus:border-emerald-500 shadow-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-[14px]"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Papers List - Responsive Table on MD+, Responsive Cards on Mobile */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 pb-4">
          
          {/* Table Header (Desktop/Tablet) */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
             <div className="col-span-5">Title & Author</div>
             <div className="col-span-2">Status</div>
             <div className="col-span-3">Part of Analysis</div>
             <div className="col-span-2 text-right pr-4">Action</div>
          </div>
          
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {filteredPapers.length === 0 ? (
               <div className="text-center py-16 sm:py-20 text-slate-500 font-medium flex flex-col items-center gap-3 px-4">
                 <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                   <FileText className="w-6 h-6" />
                 </div>
                 <p className="text-[15px]">No papers found matching your search.</p>
                 {searchQuery && (
                   <button
                     onClick={() => setSearchQuery('')}
                     className="text-[13px] font-bold text-emerald-600 underline cursor-pointer"
                   >
                     Clear search query
                   </button>
                 )}
               </div>
            ) : (
              filteredPapers.map(paper => {
                const authorStr = Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || 'Unknown Authors');
                return (
                  <div key={paper.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                    
                    {/* Desktop / Tablet Row (md+) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5 flex gap-3.5 items-center min-w-0">
                         <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                           <FileText className="w-5 h-5"/>
                         </div>
                         <div className="overflow-hidden flex-1 min-w-0">
                           <Link 
                             to={`/analysis/${paper.analysisId}/paper/${paper.id}`}
                             className="font-bold text-[14px] text-slate-800 leading-tight hover:text-emerald-600 transition-colors block truncate"
                             title={paper.title}
                           >
                             {paper.title}
                           </Link>
                           <p className="text-[12px] text-slate-500 truncate mt-0.5" title={authorStr}>{authorStr}</p>
                         </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-1.5">
                         {paper.analysisId === 'demo-analysis' && (
                           <div className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                             Demo
                           </div>
                         )}
                         <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
                           <CheckCircle2 className="w-3.5 h-3.5"/> Parsed
                         </div>
                      </div>
                      
                      <div className="col-span-3 text-[13px] font-medium text-slate-600 truncate pr-4">
                         <Link to={`/analysis/${paper.analysisId}/results`} className="hover:text-emerald-600 transition-colors hover:underline">
                           {paper.analysisTitle}
                         </Link>
                      </div>
                      
                      <div className="col-span-2 text-right pr-4">
                        <Link 
                          to={`/analysis/${paper.analysisId}/paper/${paper.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[12px] font-bold transition-colors inline-block"
                        >
                          Details &rarr;
                        </Link>
                      </div>
                    </div>

                    {/* Mobile Card (< md) */}
                    <div className="md:hidden flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/analysis/${paper.analysisId}/paper/${paper.id}`}
                            className="font-bold text-[14px] text-slate-800 leading-snug hover:text-emerald-600 transition-colors block"
                          >
                            {paper.title}
                          </Link>
                          <p className="text-[12px] text-slate-500 mt-0.5">{authorStr}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3"/> Parsed
                          </span>
                          <span className="text-slate-400 truncate max-w-[150px]">
                            {paper.analysisTitle}
                          </span>
                        </div>
                        
                        <Link 
                          to={`/analysis/${paper.analysisId}/paper/${paper.id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                          Details <ArrowRight className="w-3 h-3"/>
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
