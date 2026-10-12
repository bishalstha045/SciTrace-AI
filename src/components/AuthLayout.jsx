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
    <div className="w-screen min-h-screen bg-[#f8fafc] overflow-hidden flex items-center justify-center font-sans relative">
      
      {/* Desktop Layout - Hidden on mobile/tablet */}
      <div 
        className="hidden lg:block relative bg-[#f8fafc] shrink-0 origin-center" 
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
          <LogoIcon className="w-8 h-8 text-emerald-500" strokeWidth={2} />
          <span className="font-serif font-bold text-[#0f2a24] text-[26px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
        </div>

        {/* Left Text Content */}
        <div className="absolute left-[80px] top-[180px] w-[400px] z-20">
          <div className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-5">
            AI-POWERED SCIENTIFIC ANALYSIS
          </div>
          <h1 className="text-[54px] font-serif text-[#0f2a24] leading-[1.05] mb-6 tracking-tight">
            Turn scientific <br/> literature into <br/> 
            <span className="relative z-10 text-[#0f2a24] inline-block mt-2">
              <span className="absolute -inset-x-2 inset-y-1 bg-[#e0f7ef] rounded-[10px] -z-10"></span>
              clear insights.
            </span>
          </h1>
          <p className="text-[16px] text-slate-500 leading-relaxed mb-12">
            Upload research papers, identify key scientific claims, find supporting or contradicting evidence, and explore connections across the scientific literature.
          </p>

          <div className="space-y-7">
            <div className="flex gap-5 items-start">
              <div className="bg-[#f1f5f9] w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 border border-slate-100">
                <FileText className="w-6 h-6 text-slate-800" strokeWidth={1.5} />
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-slate-900 text-[16px]">Evidence-first</h3>
                <p className="text-slate-500 text-[14px] mt-1.5 max-w-[300px] leading-snug">All findings are linked to original sources with page references.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="bg-[#f1f5f9] w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 border border-slate-100">
                <LogoIcon className="w-6 h-6 text-slate-800" strokeWidth={2} />
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-slate-900 text-[16px]">AI-assisted analysis</h3>
                <p className="text-slate-500 text-[14px] mt-1.5 max-w-[300px] leading-snug">Discover relationships between research claims using advanced AI.</p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <div className="bg-[#f1f5f9] w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 border border-slate-100">
                <svg className="w-6 h-6 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-slate-900 text-[16px]">Built for researchers</h3>
                <p className="text-slate-500 text-[14px] mt-1.5 max-w-[300px] leading-snug">A reliable tool for students, researchers, and academic projects.</p>
              </div>
            </div>
          </div>


        </div>

        {/* SVG Connecting Lines with Moving Flow and Animated Arrows */}
        <svg className="absolute inset-0 w-full h-full z-10" pointerEvents="none">
          <defs>
            <marker id="auth-arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 1 2 L 7 5 L 1 8 z" fill="#059669" />
            </marker>
            <marker id="auth-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 1 2 L 7 5 L 1 8 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Background subtle contour ripples */}
          <path d="M 640 120 C 740 100, 860 200, 910 320 C 960 440, 910 560, 800 620" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 6" opacity="0.6" />
          <path d="M 680 150 C 770 130, 870 220, 900 330 C 930 430, 890 520, 790 580" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />

          {/* 1. Top card to AI node */}
          <path 
            id="path-auth-1"
            d="M 800 190 C 830 190, 820 350, 850 350" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="1.75" 
            strokeDasharray="5 5" 
            className="animate-flow-dash" 
            markerEnd="url(#auth-arrow-emerald)"
          />

          {/* 2. Middle card to AI node */}
          <path 
            id="path-auth-2"
            d="M 760 330 C 800 330, 820 350, 850 350" 
            fill="none" 
            stroke="#ef4444" 
            strokeWidth="1.75" 
            markerEnd="url(#auth-arrow-red)"
          />

          {/* 3. Bottom card to AI node */}
          <path 
            id="path-auth-3"
            d="M 800 470 C 830 470, 820 350, 850 350" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="1.75" 
            strokeDasharray="5 5" 
            className="animate-flow-dash" 
            markerEnd="url(#auth-arrow-emerald)"
          />

          {/* 4. AI Node to Right Form Card */}
          <path 
            id="path-auth-out"
            d="M 950 350 C 960 350, 970 350, 980 350" 
            fill="none" 
            stroke="#059669" 
            strokeWidth="1.75" 
            strokeDasharray="4 4" 
            className="animate-flow-dash" 
            markerEnd="url(#auth-arrow-emerald)"
          />

          {/* Active Moving Arrows along incoming paths */}
          {/* Top Path Moving Arrows */}
          <g>
            <path d="M -5 -3.5 L 3 0 L -5 3.5 L -2 0 Z" fill="#059669" />
            <animateMotion
              path="M 800 190 C 830 190, 820 350, 850 350"
              dur="2.4s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>
          <g>
            <path d="M -5 -3.5 L 3 0 L -5 3.5 L -2 0 Z" fill="#059669" />
            <animateMotion
              path="M 800 190 C 830 190, 820 350, 850 350"
              dur="2.4s"
              begin="1.2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>

          {/* Middle Red Path Moving Arrows */}
          <g>
            <path d="M -5 -3.5 L 3 0 L -5 3.5 L -2 0 Z" fill="#ef4444" />
            <animateMotion
              path="M 760 330 C 800 330, 820 350, 850 350"
              dur="2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>
          <g>
            <path d="M -5 -3.5 L 3 0 L -5 3.5 L -2 0 Z" fill="#ef4444" />
            <animateMotion
              path="M 760 330 C 800 330, 820 350, 850 350"
              dur="2s"
              begin="1s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>

          {/* Bottom Path Moving Arrows */}
          <g>
            <path d="M -5 -3.5 L 3 0 L -5 3.5 L -2 0 Z" fill="#059669" />
            <animateMotion
              path="M 800 470 C 830 470, 820 350, 850 350"
              dur="2.4s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>
          <g>
            <path d="M -5 -3.5 L 3 0 L -5 3.5 L -2 0 Z" fill="#059669" />
            <animateMotion
              path="M 800 470 C 830 470, 820 350, 850 350"
              dur="2.4s"
              begin="1.2s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>

          {/* AI Node to Form Moving Arrow */}
          <g>
            <path d="M -4 -3 L 2.5 0 L -4 3 L -1.5 0 Z" fill="#059669" opacity="0.9" />
            <animateMotion
              path="M 950 350 C 960 350, 970 350, 980 350"
              dur="1.5s"
              repeatCount="indefinite"
              rotate="auto"
            />
          </g>

          {/* Animated Origin Dots with pulsing radar rings */}
          <g>
            <circle cx="800" cy="190" r="3.5" fill="#10b981" />
            <circle cx="800" cy="190" r="7" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" values="3.5;8;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
          <g>
            <circle cx="760" cy="330" r="3.5" fill="#ef4444" />
            <circle cx="760" cy="330" r="7" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" values="3.5;8;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
          <g>
            <circle cx="800" cy="470" r="3.5" fill="#10b981" />
            <circle cx="800" cy="470" r="7" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4">
              <animate attributeName="r" values="3.5;8;3.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* AI Node attachment dots */}
          <circle cx="850" cy="350" r="4.5" fill="#059669" />
          <circle cx="950" cy="350" r="4.5" fill="#059669" />
        </svg>

        {/* Middle Floating Graphics */}
        
        {/* Paper 1: Climate Change */}
        <div className="absolute left-[540px] top-[140px] w-[260px] h-[100px] bg-white p-3 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-slate-100 z-20 flex flex-col justify-center animate-float-subtle-1 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
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
        <div className="absolute left-[500px] top-[280px] w-[260px] h-[100px] bg-white p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 z-20 flex flex-col justify-center animate-float-subtle-2 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
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
        <div className="absolute left-[540px] top-[420px] w-[260px] h-[100px] bg-white p-3 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-slate-100 z-20 flex flex-col justify-center animate-float-subtle-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-4">
            <PdfDocIcon />
            <div className="pt-0.5">
              <h4 className="font-semibold text-[13px] leading-snug mb-1 text-slate-800">Marine Ecosystem Adaptation Mechanisms</h4>
              <p className="text-[10px] text-slate-500">Lee et al. (2021)</p>
              <p className="text-[10px] text-slate-400">Page 5, 27</p>
            </div>
          </div>
        </div>

        {/* AI Node with Glowing Ambient Halo */}
        <div className="absolute left-[850px] top-[300px] w-[100px] h-[100px] z-30 group">
          <div className="absolute -inset-3 bg-emerald-400/20 rounded-[2rem] blur-xl animate-pulse pointer-events-none"></div>
          <div className="absolute -inset-1 bg-emerald-300/35 rounded-[1.5rem] blur-sm animate-pulse pointer-events-none"></div>
          <div className="relative w-full h-full bg-[#e0fdf4]/95 backdrop-blur-xl border-2 border-emerald-200/80 p-4 rounded-[1.25rem] shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <LogoIcon className="w-8 h-8 text-[#059669] mb-1.5 animate-pulse" strokeWidth={2.5} />
            <span className="text-[11px] font-bold text-[#065f46] text-center leading-tight">AI<br/>Analysis</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="absolute right-[20px] top-[50px] bottom-[50px] w-[440px] bg-white rounded-[2rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] border border-slate-100 p-[40px] z-40 overflow-y-auto">
          {children}
        </div>

      </div>

      {/* Mobile/Tablet Layout - Hidden on Desktop */}
      <div className="lg:hidden w-full h-full min-h-screen overflow-y-auto flex flex-col px-4 sm:px-8 py-10 relative z-10 bg-[#f8fafc]">
        {/* Mobile Header */}
        <div className="flex flex-col items-center justify-center mb-8 shrink-0">
          <div className="flex items-center gap-2.5 mb-4">
            <LogoIcon className="w-8 h-8 text-emerald-500" strokeWidth={2} />
            <span className="font-serif font-bold text-[#0f2a24] text-[26px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </div>
          <p className="text-slate-500 text-center text-[14px] max-w-sm">
            Upload research papers, identify key scientific claims, and find supporting evidence.
          </p>
        </div>

        {/* Mobile Form Card */}
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 shrink-0">
          {children}
        </div>
      </div>

    </div>
  );
}
