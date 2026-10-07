import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Play, CheckCircle2, ShieldCheck, Database, Users, Cpu } from 'lucide-react';
import Footer from '../components/Footer';

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

const PdfDocIcon = () => (
  <div className="relative bg-[#f8fafc] border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center w-[32px] h-[40px] shrink-0 shadow-sm">
    <div className="w-[16px] h-[2px] bg-slate-300 mb-[3px] rounded-full"></div>
    <div className="w-[16px] h-[2px] bg-slate-300 mb-[3px] rounded-full"></div>
    <div className="w-[10px] h-[2px] bg-slate-300 rounded-full self-start ml-[2px]"></div>
    <div className="absolute -bottom-1 -right-1 bg-[#e11d48] text-white text-[6px] font-bold px-[4px] py-[1px] rounded-sm shadow-md z-10">PDF</div>
  </div>
);

export default function Landing() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1440;
      setScale(scaleX > 1 ? 1 : scaleX);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f8fafc]">
      <div className="w-full overflow-x-hidden flex justify-center" style={{ height: `${1150 * scale}px` }}>
      <div 
        className="relative bg-[#f8fafc] shrink-0 origin-top" 
        style={{ width: '1440px', height: '1150px', transform: `scale(${scale})` }}
      >
        
        {/* Background Stack of Papers (Right Side) */}
        <div className="absolute left-[700px] top-[450px] w-[800px] h-[500px] z-0 pointer-events-none opacity-90">
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute w-[800px] h-[400px] bg-white border-t border-l border-slate-200/80 shadow-[0_-2px_12px_rgba(0,0,0,0.03)] rounded-tl-lg" 
              style={{ 
                left: `${i * 12}px`, 
                top: `${i * 20}px`, 
                transform: `rotate(${-10 + i * 1.5}deg)` 
              }}
            >
               {i === 2 && <span className="absolute bottom-12 right-40 font-serif text-[22px] text-slate-400 opacity-70">Nature</span>}
               {i === 4 && <span className="absolute bottom-12 right-40 font-serif text-[22px] text-slate-400 opacity-70">Science</span>}
               {i === 7 && <span className="absolute bottom-12 right-40 font-serif text-[22px] text-slate-400 opacity-70">Cell</span>}
            </div>
          ))}
        </div>

        {/* Faint dot grid & Circular Rings behind AI Node */}
        <div className="absolute left-[550px] top-[0px] w-[600px] h-[600px] flex items-center justify-center opacity-30 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full border border-slate-300 border-dashed"></div>
          <div className="absolute w-[300px] h-[300px] rounded-full border border-slate-300"></div>
          <div className="absolute w-full h-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        </div>

        {/* Navbar */}
        <nav className="absolute top-0 left-0 w-full h-[100px] flex items-center justify-between px-[60px] z-50">
          <div className="flex items-center gap-2.5">
            <LogoIcon className="w-8 h-8 text-[#0f2a24]" strokeWidth={2} />
            <span className="font-serif font-bold text-[#0f2a24] text-[26px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </div>

          <div className="flex items-center gap-12 ml-12">
            <div className="relative">
              <Link to="/" className="text-slate-900 font-bold text-[15px] cursor-pointer">Home</Link>
              <div className="absolute -bottom-[8px] left-0 w-full h-[2px] bg-slate-900 rounded-full"></div>
            </div>
            <Link to="/how-it-works" className="text-slate-500 font-semibold text-[15px] hover:text-slate-900 cursor-pointer transition-colors">How It Works</Link>
            <Link to="/about" className="text-slate-500 font-semibold text-[15px] hover:text-slate-900 cursor-pointer transition-colors">About</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/analysis/demo-analysis/results" className="bg-slate-100/80 border border-slate-200/80 text-slate-800 px-6 py-2.5 rounded-lg font-bold text-[14px] hover:bg-slate-200 transition-colors shadow-sm">
              View Demo
            </Link>
            <Link to={localStorage.getItem('isAuthenticated') === 'true' ? "/analysis/new" : "/signin"} className="bg-[#0f172a] text-white px-6 py-2.5 rounded-lg font-bold text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-2">
              Start Analysis &rarr;
            </Link>
          </div>
        </nav>

        {/* Left Content */}
        <div className="absolute left-[60px] top-[150px] w-[420px] z-20">
          <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-6">
            AI-POWERED SCIENTIFIC LITERATURE ANALYSIS
          </div>
          <h1 className="text-[54px] font-serif text-[#0f2a24] leading-[1.05] mb-6 tracking-tight">
            Explore connections <br/> between <span className="relative inline-block mt-2 z-10 text-[#0f2a24]">
              <span className="absolute -inset-x-3 inset-y-1 bg-[#e0f7ef] rounded-[10px] -z-10"></span>
              research
            </span><br/> findings.
          </h1>
          <p className="text-[16px] text-slate-500 leading-relaxed mb-10">
            Upload research papers and let SciTrace AI discover related claims, identify potential contradictions, and trace every finding back to its original evidence.
          </p>

          <div className="flex items-center gap-4 mb-10">
            <Link to={localStorage.getItem('isAuthenticated') === 'true' ? "/analysis/new" : "/signin"} className="bg-[#0f172a] text-white px-7 py-4 rounded-xl font-bold text-[15px] hover:bg-slate-900 transition-all shadow-lg flex items-center gap-3">
              <FileText className="w-5 h-5 opacity-80" />
              Analyze Research Papers &rarr;
            </Link>
          </div>

          <div className="flex items-center gap-8 text-[14px] text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-500" />
              Evidence-first
            </div>
            <div className="w-[1px] h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-slate-500" />
              AI-assisted
            </div>
            <div className="w-[1px] h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-500" />
              Source traceable
            </div>
          </div>
        </div>

        {/* Floating Graphics & Cards (Right) */}
        
        {/* SVG Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full z-10" pointerEvents="none">
           {/* Climate Change -> AI Analysis */}
           <path d="M 790 180 C 840 180, 820 350, 860 350" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
           {/* Ocean Temp -> AI Analysis */}
           <path d="M 750 320 C 840 320, 820 350, 860 350" fill="none" stroke="#ef4444" strokeWidth="1.5" />
           {/* Marine Eco -> AI Analysis */}
           <path d="M 790 460 C 840 460, 820 350, 860 350" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
           
           {/* Dots to cards */}
           <circle cx="790" cy="180" r="3.5" fill="#10b981" />
           <circle cx="750" cy="320" r="3.5" fill="#ef4444" />
           <circle cx="790" cy="460" r="3.5" fill="#10b981" />
           
           {/* Lines from AI Node to Right Card */}
           <path d="M 910 350 C 960 350, 950 200, 1000 200" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"/>
           <path d="M 910 350 C 960 350, 950 300, 1000 300" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"/>
           <path d="M 910 350 C 960 350, 950 420, 1000 420" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"/>
           <path d="M 910 350 C 960 350, 950 520, 1000 520" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"/>
           
           {/* AI Node dot */}
           <circle cx="860" cy="350" r="4" fill="#059669" />
           <circle cx="910" cy="350" r="4" fill="#059669" />
        </svg>

        {/* Floating Paper 1 */}
        <div className="absolute left-[560px] top-[140px] w-[230px] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-slate-100 z-20 flex items-center gap-3">
          <PdfDocIcon />
          <div>
            <h4 className="font-semibold text-[11px] leading-tight mb-1 text-slate-800">Climate Change Impacts on Marine Ecosystems</h4>
            <p className="text-[9px] text-slate-500">Smith et al. (2023)</p>
            <p className="text-[9px] text-slate-400">Page 12, 18, 24</p>
          </div>
        </div>

        {/* Floating Paper 2 */}
        <div className="absolute left-[520px] top-[280px] w-[230px] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 z-20 flex items-center gap-3">
          <PdfDocIcon />
          <div>
            <h4 className="font-semibold text-[11px] leading-tight mb-1 text-slate-800">Ocean Temperature and Coral Bleaching</h4>
            <p className="text-[9px] text-slate-500">Johnson et al. (2022)</p>
            <p className="text-[9px] text-slate-400">Page 8, 15</p>
          </div>
        </div>

        {/* Floating Paper 3 */}
        <div className="absolute left-[560px] top-[420px] w-[230px] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-slate-100 z-20 flex items-center gap-3">
          <PdfDocIcon />
          <div>
            <h4 className="font-semibold text-[11px] leading-tight mb-1 text-slate-800">Marine Ecosystem Adaptation Mechanisms</h4>
            <p className="text-[9px] text-slate-500">Lee et al. (2021)</p>
            <p className="text-[9px] text-slate-400">Page 5, 27</p>
          </div>
        </div>

        {/* AI Node */}
        <div className="absolute left-[860px] top-[300px] w-[90px] h-[90px] bg-[#e0fdf4]/90 backdrop-blur-md border-2 border-emerald-100 p-4 rounded-[1.25rem] shadow-[0_0_40px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center z-30">
          <LogoIcon className="w-7 h-7 text-[#059669] mb-1.5" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-[#065f46] text-center leading-tight">AI<br/>Analysis</span>
        </div>

        {/* Claim Comparison Large Card */}
        <div className="absolute left-[1000px] top-[90px] w-[400px] bg-white/95 backdrop-blur-xl rounded-[24px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-slate-100 p-6 z-40">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-[16px] font-semibold text-slate-800">Claim Comparison</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">AI-identified relationships between research claims</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg></button>
          </div>

          <div className="space-y-3">
            {/* Main Quote */}
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-100">
              <div className="flex gap-4">
                <div className="bg-slate-200/70 text-slate-600 w-8 h-8 rounded-md flex items-center justify-center shrink-0 font-serif font-black text-[24px] leading-none pt-2 shadow-inner">"</div>
                <div>
                  <p className="text-[13px] font-bold text-slate-800 leading-snug">"Rising ocean temperatures increase coral bleaching."</p>
                  <p className="text-[10px] text-slate-500 mt-1.5">Smith et al. (2023)</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-slate-400">Page 12</p>
                    <span className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline">View in paper &nearr;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting */}
            <div className="bg-[#f0fdf4] rounded-xl p-4 border border-emerald-100/50">
              <div className="flex gap-3">
                <div className="bg-emerald-500 text-white rounded-full p-1 h-fit shrink-0"><CheckCircle2 className="w-3 h-3" strokeWidth={3}/></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[12px] font-bold text-emerald-700">Supporting Claim</p>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">92%</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug mb-1.5">Higher sea surface temperatures are significantly associated with coral bleaching events.</p>
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] text-slate-500">Johnson et al. (2022) &bull; Page 8, 15</p>
                    <FileText className="w-3.5 h-3.5 text-slate-400"/>
                  </div>
                </div>
              </div>
            </div>

            {/* Contradicting */}
            <div className="bg-[#fef2f2] rounded-xl p-4 border border-red-100/50">
              <div className="flex gap-3">
                <div className="bg-red-500 text-white rounded-full p-1 h-fit shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"></path></svg></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[12px] font-bold text-red-700">Contradicting Claim</p>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">78%</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug mb-1.5">Coral bleaching is not significantly affected by temperature alone.</p>
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] text-slate-500">Lee et al. (2021) &bull; Page 5, 27</p>
                    <FileText className="w-3.5 h-3.5 text-slate-400"/>
                  </div>
                </div>
              </div>
            </div>

            {/* Related */}
            <div className="bg-[#fffbeb] rounded-xl p-4 border border-amber-100/50">
              <div className="flex gap-3">
                <div className="bg-amber-500 text-white rounded-full p-1 h-fit shrink-0"><LogoIcon className="w-3 h-3" strokeWidth={3}/></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[12px] font-bold text-amber-700">Related Claim</p>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">65%</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug mb-1.5">Other factors like ocean acidification also contribute to coral bleaching.</p>
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] text-slate-500">Garcia et al. (2020) &bull; Page 10, 14</p>
                    <FileText className="w-3.5 h-3.5 text-slate-400"/>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Steps Bottom Row */}
        <div id="how-it-works" className="absolute left-[60px] top-[760px] w-[1320px] flex gap-4 z-30">
          <div className="flex-1 bg-white rounded-[20px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all">
            <span className="absolute top-4 right-5 text-slate-300 font-bold text-[12px]">01</span>
            <div className="w-[60px] h-[60px] rounded-lg shrink-0 overflow-hidden shadow-sm">
               <img src="/landing_card_1_upload_1791399557234.jpg" alt="Upload" className="w-full h-full object-cover scale-150" />
            </div>
            <div>
              <h4 className="font-bold text-[14px] text-slate-800 mb-1">Upload Papers</h4>
              <p className="text-[12px] text-slate-500 leading-snug">Add multiple research papers (PDF) in seconds.</p>
            </div>
          </div>
          
          <div className="flex-1 bg-white rounded-[20px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all">
            <span className="absolute top-4 right-5 text-slate-300 font-bold text-[12px]">02</span>
            <div className="w-[60px] h-[60px] rounded-lg shrink-0 overflow-hidden shadow-sm">
               <img src="/landing_card_2_extract_1791399577314.jpg" alt="Extract" className="w-full h-full object-cover scale-150" />
            </div>
            <div>
              <h4 className="font-bold text-[14px] text-slate-800 mb-1">Extract Claims</h4>
              <p className="text-[12px] text-slate-500 leading-snug">AI extracts key scientific claims from each paper.</p>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[20px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all">
            <span className="absolute top-4 right-5 text-slate-300 font-bold text-[12px]">03</span>
            <div className="w-[60px] h-[60px] rounded-lg shrink-0 overflow-hidden shadow-sm">
               <img src="/landing_card_3_relationships_1791399596346.jpg" alt="Relationships" className="w-full h-full object-cover scale-[1.3]" />
            </div>
            <div>
              <h4 className="font-bold text-[14px] text-slate-800 mb-1">Find Relationships</h4>
              <p className="text-[12px] text-slate-500 leading-snug">Discover supporting, contradicting, and related claims.</p>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[20px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-4 relative overflow-hidden group hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all">
            <span className="absolute top-4 right-5 text-slate-300 font-bold text-[12px]">04</span>
            <div className="w-[60px] h-[60px] rounded-lg shrink-0 overflow-hidden shadow-sm">
               <img src="/landing_card_4_trace_1791399614444.jpg" alt="Trace Evidence" className="w-full h-full object-cover scale-[1.8]" />
            </div>
            <div>
              <h4 className="font-bold text-[14px] text-slate-800 mb-1">Trace Evidence</h4>
              <p className="text-[12px] text-slate-500 leading-snug">View original evidence with paper names and page references.</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Stats */}
        <div id="about" className="absolute left-[60px] top-[920px] w-[1320px] h-[100px] bg-white rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-around z-30 px-10">
           <div className="flex items-center gap-4">
             <Users className="w-8 h-8 text-slate-800" strokeWidth={1.5}/>
             <div>
               <h4 className="font-bold text-[18px] text-slate-800">10,000+</h4>
               <p className="text-[12px] text-slate-500">Researchers & Students</p>
             </div>
           </div>
           <div className="w-[1px] h-10 bg-slate-100"></div>
           <div className="flex items-center gap-4">
             <FileText className="w-8 h-8 text-slate-800" strokeWidth={1.5}/>
             <div>
               <h4 className="font-bold text-[18px] text-slate-800">100,000+</h4>
               <p className="text-[12px] text-slate-500">Papers Analyzed</p>
             </div>
           </div>
           <div className="w-[1px] h-10 bg-slate-100"></div>
           <div className="flex items-center gap-4">
             <LogoIcon className="w-8 h-8 text-slate-800" strokeWidth={2}/>
             <div>
               <h4 className="font-bold text-[18px] text-slate-800">500,000+</h4>
               <p className="text-[12px] text-slate-500">Scientific Claims Mapped</p>
             </div>
           </div>
           <div className="w-[1px] h-10 bg-slate-100"></div>
           <div className="flex items-center gap-4">
             <ShieldCheck className="w-8 h-8 text-slate-800" strokeWidth={1.5}/>
             <div>
               <h4 className="font-bold text-[18px] text-slate-800">99%</h4>
               <p className="text-[12px] text-slate-500">Source Traceable Results</p>
             </div>
           </div>
        </div>

        <div className="absolute top-[1080px] w-full flex justify-center z-30">
          <div className="flex items-center gap-4 opacity-40">
             <div className="w-12 h-[1px] bg-slate-400"></div>
             <p className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">Built for a more connected scientific world</p>
             <div className="w-12 h-[1px] bg-slate-400"></div>
          </div>
        </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
