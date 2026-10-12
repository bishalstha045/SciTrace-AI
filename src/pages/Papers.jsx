import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, FileText, CheckCircle2, Clock } from 'lucide-react';
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

export default function Papers() {
  const [scale, setScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [papers, setPapers] = useState([]);

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
    <div className="w-full bg-[#f8fafc] overflow-x-hidden flex justify-center font-sans" style={{ minHeight: '100vh', height: `${1000 * scale}px` }}>
      <div 
        className="relative bg-[#f8fafc] shrink-0 origin-top" 
        style={{ width: '1440px', height: '1000px', transform: `scale(${scale})` }}
      >
        {/* Navbar */}
        <nav className="absolute top-0 left-0 w-full h-[80px] flex items-center justify-between px-[60px] z-50 border-b border-slate-200/50 bg-white">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <LogoIcon className="w-7 h-7 text-emerald-500" strokeWidth={2} />
            <span className="font-serif font-bold text-[#0f2a24] text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </Link>

          <div className="flex items-center gap-10">
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Workspace</Link>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Analyses</Link>
            <div className="relative h-full flex items-center">
              <Link to="/papers" className="text-slate-900 font-semibold text-[14px] cursor-pointer pt-7 pb-7">Papers</Link>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ProfileMenu />
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="absolute left-[60px] top-[120px] w-[1320px] z-10 flex flex-col">
          
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-[44px] font-serif text-[#0f2a24] leading-none mb-3 tracking-tight">
                All Papers
              </h1>
              <p className="text-[16px] text-slate-500 mb-6">
                Browse all documents uploaded across your analyses.
              </p>
              
              <div className="flex items-center gap-6 text-[14px] text-slate-600 font-medium">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> <span className="font-bold text-slate-800">{papers.length}</span> papers total</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search papers by title or author..." 
                className="w-full bg-white pl-11 pr-10 py-3 rounded-xl border border-slate-200 text-[14px] font-medium outline-none focus:border-emerald-500 shadow-sm"
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

          {/* List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
               <div className="col-span-5">Title & Author</div>
               <div className="col-span-2">Status</div>
               <div className="col-span-3">Part of Analysis</div>
               <div className="col-span-2 text-right pr-4">Action</div>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {filteredPapers.length === 0 ? (
                 <div className="text-center py-20 text-slate-500 font-medium flex flex-col items-center gap-3">
                   <p>No papers found matching your search.</p>
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
                    <div key={paper.id} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors">
                      <div className="col-span-5 flex gap-4 items-center">
                         <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                           <FileText className="w-5 h-5"/>
                         </div>
                         <div className="overflow-hidden">
                           <Link 
                             to={`/analysis/${paper.analysisId}/paper/${paper.id}`}
                             className="font-bold text-[14px] text-slate-800 leading-tight hover:text-emerald-600 transition-colors block truncate"
                             title={paper.title}
                           >
                             {paper.title}
                           </Link>
                           <p className="text-[12px] text-slate-500 truncate" title={authorStr}>{authorStr}</p>
                         </div>
                      </div>
                      <div className="col-span-2">
                         <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
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
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
