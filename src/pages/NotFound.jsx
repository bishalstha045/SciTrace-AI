import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, LayoutGrid } from 'lucide-react';

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

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans">
      {/* Mini Header */}
      <header className="w-full h-[70px] bg-white border-b border-slate-200/60 px-6 lg:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
          <LogoIcon className="w-6 h-6 text-emerald-500" strokeWidth={2} />
          <span className="font-serif font-bold text-[#0f2a24] text-[20px] tracking-tight">
            SciTrace <span className="text-emerald-500 font-sans">AI</span>
          </span>
        </Link>
        <Link to="/analysis/demo-analysis/results" className="text-slate-600 hover:text-slate-900 text-[13px] font-medium flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4 text-emerald-500" /> Explore Demo
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200 shadow-sm">
            <Compass className="w-8 h-8 text-emerald-600" />
          </div>

          <span className="text-emerald-600 font-bold text-[12px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block mb-3">
            Error 404
          </span>
          <h1 className="text-[32px] font-serif text-[#0f2a24] font-bold mb-3 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-[14px] text-slate-500 leading-relaxed mb-8">
            The page you are looking for doesn't exist, has been moved, or references an invalid analysis route.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-[14px] font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <Link
              to="/analysis/demo-analysis/results"
              className="w-full sm:w-auto bg-[#0b1f1b] text-white px-5 py-2.5 rounded-xl text-[14px] font-bold hover:bg-slate-900 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" /> View Demo Analysis
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[12px] text-slate-400 border-t border-slate-200/40 bg-white">
        &copy; {new Date().getFullYear()} SciTrace AI. All rights reserved.
      </footer>
    </div>
  );
}
