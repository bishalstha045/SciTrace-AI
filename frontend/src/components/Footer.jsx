import { Link } from 'react-router-dom';

const CURRENT_YEAR = new Date().getFullYear();

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

export default function Footer() {
  return (
    <footer className="w-full bg-[#0b1221] text-slate-300 py-10 md:py-12 px-6 lg:px-[60px] font-sans mt-auto border-t border-slate-800">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity inline-flex">
            <LogoIcon className="w-7 h-7 text-emerald-400" strokeWidth={2.5} />
            <span className="font-serif font-bold text-white text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </Link>
          <p className="text-[14px] text-slate-400 leading-relaxed mb-6 max-w-sm">
            Empowering researchers with AI-driven insights, claim extraction, and evidence tracing from scientific literature. Stop reading, start discovering.
          </p>
          <div className="flex gap-4">
            <a href="https://twitter.com/bishalstha045" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-slate-400" title="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.022 4.022 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="https://github.com/bishalstha045" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-slate-400" title="GitHub">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold text-[14px] mb-4 uppercase tracking-wider">Product</h4>
          <ul className="space-y-2 text-[14px] text-slate-400">
            <li><Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link></li>
            <li><Link to="/analysis/demo-analysis/results" className="hover:text-emerald-400 transition-colors flex items-center gap-2">Interactive Demo <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span></Link></li>
            <li><Link to="/analyses" className="hover:text-emerald-400 transition-colors">Workspace</Link></li>
            <li><Link to="/papers" className="hover:text-emerald-400 transition-colors">Library</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-[14px] mb-4 uppercase tracking-wider">Resources</h4>
          <ul className="space-y-2 text-[14px] text-slate-400">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Research Blog</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Community</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-[14px] mb-4 uppercase tracking-wider">Legal</h4>
          <ul className="space-y-2 text-[14px] text-slate-400">
            <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            <li><Link to="/cookie-policy" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1400px] mx-auto mt-10 pt-6 border-t border-slate-800 text-[13px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {CURRENT_YEAR} SciTrace AI by Bishal Shrestha. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
