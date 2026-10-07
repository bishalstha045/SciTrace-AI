import { Link } from 'react-router-dom';

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
    <footer className="w-full bg-[#0f172a] text-slate-300 py-8 px-6 font-sans mt-auto">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <LogoIcon className="w-6 h-6 text-emerald-400" strokeWidth={2} />
            <span className="font-serif font-bold text-white text-[20px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </Link>
          <p className="text-[13px] text-slate-400 leading-relaxed mb-6">
            Empowering researchers with AI-driven insights, claim extraction, and evidence tracing from scientific literature.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold text-[14px] mb-4">Product</h4>
          <ul className="space-y-2 text-[13px]">
            <li><Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</Link></li>
            <li><Link to="/analysis/demo-analysis/results" className="hover:text-emerald-400 transition-colors">View Demo</Link></li>
            <li><Link to="/analyses" className="hover:text-emerald-400 transition-colors">Workspace</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-[14px] mb-4">Company</h4>
          <ul className="space-y-2 text-[13px]">
            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-[14px] mb-4">Legal</h4>
          <ul className="space-y-2 text-[13px]">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1200px] mx-auto mt-8 pt-6 border-t border-slate-700/50 text-[12px] text-slate-500 flex flex-col md:flex-row justify-between items-center">
        <p>&copy; {new Date().getFullYear()} SciTrace AI. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
