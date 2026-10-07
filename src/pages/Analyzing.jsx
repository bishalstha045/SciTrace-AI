import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Network, Search, Plus, FileText, CheckCircle2, RotateCw, BrainCircuit, Link2, BookOpen } from 'lucide-react';

export default function Analyzing() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(68);

  useEffect(() => {
    // Simulate progression to Results page
    const timer = setTimeout(() => {
      navigate('/results');
    }, 5000);
    
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 100));
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Network className="w-6 h-6 text-emerald-600" />
          <span className="font-serif">SciTrace <span className="text-emerald-600 font-sans font-bold">AI</span></span>
        </div>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link to="#" className="text-slate-900 border-b-2 border-slate-900 pb-1">Workspace</Link>
          <Link to="#" className="text-slate-500 hover:text-slate-900">Analyses</Link>
          <Link to="#" className="text-slate-500 hover:text-slate-900">Papers</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-slate-500" />
          <button className="btn btn-primary text-sm py-2 px-4 rounded-full flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Analysis
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Analyzing your research</div>
          <h1 className="text-4xl font-serif text-slate-900 mb-4">Analyzing your <span className="bg-emerald-100/50 px-2 rounded">research</span></h1>
          <p className="text-slate-600">SciTrace AI is reading your papers, identifying scientific claims, and comparing related findings.</p>
        </div>

        {/* Global Progress */}
        <div className="mb-10 max-w-3xl">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-600">3 papers • 127 candidate claims</span>
            <span className="text-2xl font-bold text-slate-800">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 mb-3 overflow-hidden">
            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <RotateCw className="w-4 h-4 animate-spin text-emerald-600" /> Comparing related claims...
          </div>
        </div>

        {/* Stepper Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-5 gap-4 relative">
            {/* Connecting lines */}
            <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 -z-10"></div>
            <div className="absolute top-5 left-10 w-3/5 h-0.5 bg-emerald-500 -z-10 transition-all duration-1000"></div>

            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-xs text-slate-400 font-bold mb-1">01</div>
              <div className="text-sm font-semibold text-slate-800 mb-1">Extracting Document Text</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-auto pt-2"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</div>
            </div>

            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-xs text-slate-400 font-bold mb-1">02</div>
              <div className="text-sm font-semibold text-slate-800 mb-1">Identifying Scientific Claims</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-auto pt-2"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</div>
            </div>

            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3">
                <Link2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-xs text-slate-400 font-bold mb-1">03</div>
              <div className="text-sm font-semibold text-slate-800 mb-1">Finding Related Claims</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-auto pt-2"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</div>
            </div>

            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)] flex items-center justify-center mb-3 relative">
                <BrainCircuit className="w-5 h-5 text-blue-600 animate-pulse" />
              </div>
              <div className="text-xs text-slate-400 font-bold mb-1">04</div>
              <div className="text-sm font-semibold text-slate-800 mb-1">Analyzing Relationships</div>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-auto pt-2"><RotateCw className="w-3.5 h-3.5 animate-spin" /> In Progress</div>
            </div>

            <div className="flex flex-col opacity-50">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-xs text-slate-400 font-bold mb-1">05</div>
              <div className="text-sm font-semibold text-slate-800 mb-1">Building Evidence Map</div>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-auto pt-2"><div className="w-3.5 h-3.5 border-2 border-slate-300 rounded-full"></div> Waiting</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 h-fit">
                <BrainCircuit className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm text-slate-500 font-medium">Currently analyzing</h3>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Comparing related claims</h2>
                <p className="text-sm text-slate-600">AI is evaluating relationships between potentially related scientific statements.</p>
              </div>
            </div>

            <div className="mt-6 border border-slate-100 bg-slate-50 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800 italic">"Deep learning models significantly improve classification accuracy..."</p>
                  <p className="text-xs text-slate-500 mt-1">Page 12 • Paper A</p>
                </div>
              </div>
              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white border border-slate-200 p-1.5 rounded shadow-sm text-[10px] font-bold text-slate-500 uppercase">Vs</div>
              </div>
              <div className="flex items-start gap-3 mt-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800 italic">"Traditional machine learning performs similarly on small datasets..."</p>
                  <p className="text-xs text-slate-500 mt-1">Page 8 • Paper B</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Processing Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <div className="text-2xl font-serif font-bold text-slate-900">3</div>
                <div className="text-xs text-slate-500 font-medium">Papers</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <div className="text-2xl font-serif font-bold text-slate-900">127</div>
                <div className="text-xs text-slate-500 font-medium">Claims Found</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <div className="text-2xl font-serif font-bold text-slate-900">84</div>
                <div className="text-xs text-slate-500 font-medium">Claim Pairs</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <div className="text-2xl font-serif font-bold text-slate-900">42</div>
                <div className="text-xs text-slate-500 font-medium">Pairs Analyzed</div>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
              <h4 className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Why does this take a moment?</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">SciTrace AI compares related claims rather than simply matching keywords. This allows the system to identify relationships even when different papers use different terminology.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
