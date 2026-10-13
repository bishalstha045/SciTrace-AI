import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Plus, LayoutGrid, FileText, HelpCircle, Layers } from 'lucide-react';
import ProfileMenu from './ProfileMenu';

export const LogoIcon = ({ className = "w-7 h-7 text-emerald-500", strokeWidth = 1.5 }) => (
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

export default function Navbar({ activeTab, mode = "workspace", actions = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentTab = activeTab || (
    location.pathname.startsWith('/papers') ? 'papers' :
      location.pathname.startsWith('/analyses') ? 'analyses' :
        location.pathname.startsWith('/analysis/new') ? 'new' :
          location.pathname.startsWith('/how-it-works') ? 'how-it-works' :
            location.pathname.startsWith('/about') ? 'about' :
              location.pathname === '/' ? 'home' : 'workspace'
  );

  return (
    <header className="w-full bg-white border-b border-slate-200/60 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-[72px] flex items-center justify-between">

        {/* Left: Brand Logo */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
        >
          <LogoIcon className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500" strokeWidth={2} />
          <span className="font-serif font-bold text-[#0f2a24] text-[20px] sm:text-[22px] tracking-tight">
            SciTrace <span className="text-emerald-500 font-sans">AI</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 h-full">
          {mode === "workspace" ? (
            <>
              <Link
                to="/analyses"
                className={`relative h-full flex items-center text-[14px] font-medium transition-colors ${currentTab === 'workspace' || currentTab === 'analyses'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Workspace
                {(currentTab === 'workspace' || currentTab === 'analyses') && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full" />
                )}
              </Link>
              <Link
                to="/analyses"
                className={`relative h-full flex items-center text-[14px] font-medium transition-colors ${currentTab === 'analyses'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Analyses
              </Link>
              <Link
                to="/papers"
                className={`relative h-full flex items-center text-[14px] font-medium transition-colors ${currentTab === 'papers'
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Papers
                {currentTab === 'papers' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full" />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`relative h-full flex items-center text-[15px] font-medium transition-colors ${currentTab === 'home'
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Home
                {currentTab === 'home' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-full" />
                )}
              </Link>
              <Link
                to="/how-it-works"
                className={`relative h-full flex items-center text-[15px] font-medium transition-colors ${currentTab === 'how-it-works'
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                How It Works
              </Link>
              <Link
                to="/about"
                className={`relative h-full flex items-center text-[15px] font-medium transition-colors ${currentTab === 'about'
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                About
              </Link>
            </>
          )}
        </nav>

        {/* Right: Actions & Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="hidden sm:flex items-center gap-3 lg:gap-4">
            {actions ? (
              actions
            ) : (
              <>
                <Link
                  to="/analysis/demo-analysis/results"
                  className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 lg:px-4 lg:py-2 rounded-lg font-medium text-[13px] lg:text-[14px] hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <LayoutGrid className="w-4 h-4 text-slate-500" /> Demo
                </Link>
                <Link
                  to="/analysis/new"
                  className="bg-[#0b1f1b] text-white px-4 py-1.5 lg:px-5 lg:py-2 rounded-lg font-medium text-[13px] lg:text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-emerald-400" /> New Analysis
                </Link>
              </>
            )}
          </div>

          <ProfileMenu />

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="sm:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-5 shadow-lg animate-fadeIn">
          <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
            <Link
              to="/analyses"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium ${currentTab === 'workspace' || currentTab === 'analyses'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              Workspace & Analyses
            </Link>
            <Link
              to="/papers"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium ${currentTab === 'papers'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              All Papers
            </Link>
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium ${currentTab === 'how-it-works'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              How It Works
            </Link>
          </div>

          <div className="pt-4 flex flex-col gap-2.5">
            <Link
              to="/analysis/new"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-[#0b1f1b] text-white py-2.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              New Analysis
            </Link>
            <Link
              to="/analysis/demo-analysis/results"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-medium text-[14px] flex items-center justify-center gap-2"
            >
              <LayoutGrid className="w-4 h-4 text-slate-500" />
              Explore Demo Analysis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
