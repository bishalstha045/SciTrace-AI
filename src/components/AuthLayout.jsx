import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  <div className="relative bg-[#f8fafc] border border-slate-200 rounded p-1.5 flex flex-col items-center justify-center w-[36px] h-[44px] shrink-0 shadow-sm">
    <div className="w-[18px] h-[2px] bg-slate-300 mb-[4px] rounded-full"></div>
    <div className="w-[18px] h-[2px] bg-slate-300 mb-[4px] rounded-full"></div>
    <div className="w-[12px] h-[2px] bg-slate-300 rounded-full self-start ml-[3px]"></div>
    <div className="absolute -bottom-1.5 -right-1.5 bg-[#e11d48] text-white text-[7px] font-bold px-[5px] py-[2px] rounded-sm shadow-md z-10">PDF</div>
  </div>
);

export default function AuthLayout({ children }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1440;
      const scaleY = window.innerHeight / 900;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#f8fafc] overflow-hidden flex items-center justify-center font-sans">
      
      <div 
        className="relative bg-[#f8fafc] shrink-0 origin-center" 
        style={{ width: '1440px', height: '900px', transform: `scale(${scale})` }}
      >

        {/* Realistic Stack of Papers (Right Side Only) */}
        <div className="absolute left-[450px] top-[550px] w-[800px] h-[500px] z-0 pointer-events-none opacity-95">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute w-[800px] h-[400px] bg-white border border-slate-200/80 shadow-[0_-2px_12px_rgba(0,0,0,0.03)] rounded-tl-lg" 
              style={{ 
                left: `${i * 8}px`, 
                top: `${i * 18}px`, 
                transform: `rotate(${-8 + i * 1.2}deg)` 
              }}
            >
               {i === 2 && <span className="absolute bottom-16 right-32 font-serif text-[22px] text-slate-400 opacity-70">Nature</span>}
               {i === 6 && <span className="absolute bottom-16 right-32 font-serif text-[22px] text-slate-400 opacity-70">Science</span>}
               {i === 10 && <span className="absolute bottom-16 right-32 font-serif text-[22px] text-slate-400 opacity-70">Cell</span>}
            </div>
          ))}
        </div>

        {/* Faint dot grid behind nodes */}
        <div className="absolute left-[600px] top-[100px] w-[300px] h-[300px] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 z-0"></div>

        {/* Top Left Logo */}
        <div className="absolute left-[80px] top-[60px] flex items-center gap-2.5 z-50">
          <LogoIcon className="w-8 h-8 text-[#0f2a24]" strokeWidth={2} />
          <span className="font-serif font-bold text-[#0f2a24] text-[26px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
        </div>

        {/* Left Text Content */}
        <div className="absolute left-[80px] top-[180px] w-[460px] z-20">
          <div className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-5">
            AI-POWERED SCIENTIFIC ANALYSIS
          </div>
          <h1 className="text-[64px] font-serif text-[#0f2a24] leading-[1.05] mb-6 tracking-tight">
            Turn scientific <br/> literature into <br/> 
            <span className="relative z-10 text-[#0f2a24] inline-block mt-2">
              <span className="absolute -inset-x-2 inset-y-1 bg-[#e0f7ef] rounded-[10px] -z-10"></span>
              clear insights.
            </span>
          </h1>
          <p className="text-[16px] text-slate-500 leading-relaxed mb-12 max-w-[420px]">
            Upload research papers, identify key scientific claims, find supporting or contradicting evidence, and explore connections across the scientific literature.
          </p>

          <div className="space-y-8">
            <div className="flex gap-5 items-start">
              <div className="bg-[#f1f5f9] w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 border border-slate-100">
                <FileText className="w-6 h-6 text-slate-800" strokeWidth={1.5} />
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-slate-900 text-[16px]">Evidence-first</h3>
                <p className="text-slate-500 text-[14px] mt-1.5 max-w-[300px] leading-snug">All findings are linked to original sources with page references.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start mt-8">
              <div className="bg-[#f1f5f9] w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 border border-slate-100">
                <LogoIcon className="w-6 h-6 text-slate-800" strokeWidth={2} />
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-slate-900 text-[16px]">AI-assisted analysis</h3>
                <p className="text-slate-500 text-[14px] mt-1.5 max-w-[300px] leading-snug">Discover relationships between research claims using advanced AI.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SVG Connecting Lines (Perfectly matching the nodes) */}
        <svg className="absolute inset-0 w-full h-full z-10" pointerEvents="none">
           {/* Top card to AI node */}
           <path d="M 760 190 C 820 190, 800 350, 850 350" fill="none" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="5 5" />
           {/* Middle card to AI node */}
           <path d="M 720 330 C 800 330, 800 350, 850 350" fill="none" stroke="#fca5a5" strokeWidth="2" />
           {/* Bottom card to AI node */}
           <path d="M 760 470 C 820 470, 800 350, 850 350" fill="none" stroke="#a7f3d0" strokeWidth="1.5" strokeDasharray="5 5" />
           
           <circle cx="760" cy="190" r="4" fill="#10b981" />
           <circle cx="720" cy="330" r="4" fill="#ef4444" />
           <circle cx="760" cy="470" r="4" fill="#10b981" />
           
           {/* AI Node attachment dot */}
           <circle cx="850" cy="350" r="5" fill="#059669" />
        </svg>

        {/* Middle Floating Graphics */}
        
        {/* Paper 1: Climate Change */}
        <div className="absolute left-[500px] top-[140px] w-[260px] h-[100px] bg-white p-3 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-slate-100 z-20 flex flex-col justify-center">
          <div className="flex items-start gap-4">
            <PdfDocIcon />
            <div className="pt-0.5">
              <h4 className="font-semibold text-[13px] leading-snug mb-1 text-slate-800">Climate Change Impacts on Marine Ecosystems</h4>
              <p className="text-[10px] text-slate-500">Smith et al. (2023)</p>
              <p className="text-[10px] text-slate-400">Page 12, 18, 24</p>
            </div>
          </div>
        </div>

        {/* Paper 2: Ocean Temperature */}
        <div className="absolute left-[460px] top-[280px] w-[260px] h-[100px] bg-white p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 z-20 flex flex-col justify-center">
          <div className="flex items-start gap-4">
            <PdfDocIcon />
            <div className="pt-0.5">
              <h4 className="font-semibold text-[13px] leading-snug mb-1 text-slate-800">Ocean Temperature and Coral Bleaching</h4>
              <p className="text-[10px] text-slate-500">Johnson et al. (2022)</p>
              <p className="text-[10px] text-slate-400">Page 8, 15</p>
            </div>
          </div>
        </div>

        {/* Paper 3: Marine Ecosystem */}
        <div className="absolute left-[500px] top-[420px] w-[260px] h-[100px] bg-white p-3 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-slate-100 z-20 flex flex-col justify-center">
          <div className="flex items-start gap-4">
            <PdfDocIcon />
            <div className="pt-0.5">
              <h4 className="font-semibold text-[13px] leading-snug mb-1 text-slate-800">Marine Ecosystem Adaptation Mechanisms</h4>
              <p className="text-[10px] text-slate-500">Lee et al. (2021)</p>
              <p className="text-[10px] text-slate-400">Page 5, 27</p>
            </div>
          </div>
        </div>

        {/* AI Node */}
        <div className="absolute left-[850px] top-[300px] w-[100px] h-[100px] bg-[#e0fdf4]/95 backdrop-blur-xl border border-emerald-200 p-4 rounded-[1.25rem] shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center z-30">
          <LogoIcon className="w-8 h-8 text-[#059669] mb-1.5" strokeWidth={2.5} />
          <span className="text-[11px] font-bold text-[#065f46] text-center leading-tight">AI<br/>Analysis</span>
        </div>

        {/* Right Form Card */}
        <div className="absolute right-[50px] top-[50px] bottom-[50px] w-[440px] bg-white rounded-[2rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] border border-slate-100 p-[40px] z-40 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}
