import { Link } from 'react-router-dom';
import { PlayCircle, FileText, Share2, Search, ArrowRight, Network, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Network className="w-6 h-6 text-emerald-600" />
          <span className="font-serif">SciTrace <span className="text-emerald-600 font-sans font-bold">AI</span></span>
        </div>
        
        <nav className="hidden md:flex gap-8 text-slate-600 font-medium">
          <a href="#" className="text-slate-900 font-semibold border-b-2 border-slate-900 pb-1">Home</a>
          <a href="#" className="hover:text-slate-900 transition-colors">How It Works</a>
          <a href="#" className="hover:text-slate-900 transition-colors">About</a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-slate-500 cursor-pointer hover:text-slate-900" />
          <button className="btn btn-outline text-sm py-2 px-4 rounded-full font-medium hidden md:flex">View Demo</button>
          <Link to="/signup" className="btn btn-primary text-sm py-2 px-6 rounded-full font-medium">Start Analysis &rarr;</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              AI-Powered Scientific Literature Analysis
            </div>
            <h1 className="text-5xl md:text-7xl font-serif leading-[1.1] text-slate-900">
              Explore connections <br /> between <span className="bg-emerald-50 text-emerald-900 px-2 rounded-lg">research</span> <br /> findings.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              Upload research papers and let SciTrace AI discover related claims, identify potential contradictions, and trace every finding back to its original evidence.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/signup" className="btn btn-primary px-8 py-4 text-base shadow-xl shadow-slate-900/10">
                <FileText className="w-5 h-5" /> Analyze Research Papers &rarr;
              </Link>
              <button className="btn btn-outline px-8 py-4 text-base rounded-full shadow-sm hover:shadow-md transition-all bg-white border-slate-200 text-slate-700 font-medium flex items-center gap-2">
                <PlayCircle className="w-5 h-5" /> See How It Works
              </button>
            </div>

            <div className="flex gap-8 pt-8 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-500" /> Evidence-first</div>
              <div className="flex items-center gap-2"><Network className="w-4 h-4 text-emerald-500" /> AI-assisted</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Source traceable</div>
            </div>
          </div>

          <div className="relative h-[600px] hidden lg:block perspective-1000">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
            
            {/* Floating Paper Cards */}
            <div className="absolute top-10 left-0 bg-white p-4 rounded-xl shadow-xl border border-slate-100 w-64 animate-float-slow transform -rotate-2">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1">PDF</div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight mb-1 text-slate-800">Climate Change Impacts on Marine Ecosystems</h4>
                  <p className="text-xs text-slate-500">Smith et al. (2023)</p>
                  <p className="text-xs text-slate-400">Page 12, 18, 24</p>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 left-12 bg-white p-4 rounded-xl shadow-xl border border-slate-100 w-64 animate-float z-10">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1">PDF</div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight mb-1 text-slate-800">Ocean Temperature and Coral Bleaching</h4>
                  <p className="text-xs text-slate-500">Johnson et al. (2022)</p>
                  <p className="text-xs text-slate-400">Page 8, 15</p>
                </div>
              </div>
            </div>

            {/* Central Node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center z-20 w-24 h-24">
              <Network className="w-8 h-8 text-emerald-600 mb-1" />
              <span className="text-[10px] font-bold text-emerald-800 text-center">AI<br/>Analysis</span>
            </div>

            {/* Main Claim Comparison Card */}
            <div className="absolute top-20 -right-10 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/50 w-80 z-30 transform rotate-1">
              <h3 className="font-semibold text-slate-800 mb-1">Claim Comparison</h3>
              <p className="text-xs text-slate-500 mb-4">AI-identified relationships between research claims</p>
              
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex gap-2">
                    <span className="text-slate-400 mt-0.5">"</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">Rising ocean temperatures increase coral bleaching.</p>
                      <p className="text-xs text-slate-500 mt-1">Smith et al. (2023) • Page 12</p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-emerald-700">Supporting Claim</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">92%</span>
                      </div>
                      <p className="text-xs text-emerald-900 leading-snug">Higher sea surface temperatures are significantly associated with coral bleaching events.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-3 border border-red-100 opacity-90">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-red-700">Contradicting Claim</span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">78%</span>
                      </div>
                      <p className="text-xs text-red-900 leading-snug">Coral bleaching is not significantly affected by temperature alone.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Connecting lines SVG placeholder */}
            <svg className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none" viewBox="0 0 600 600">
              <path d="M 256 300 C 200 300, 150 200, 128 150" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
              <path d="M 256 300 C 200 300, 150 300, 100 300" fill="none" stroke="#10b981" strokeWidth="2" />
              <path d="M 256 300 C 300 300, 350 200, 384 150" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
