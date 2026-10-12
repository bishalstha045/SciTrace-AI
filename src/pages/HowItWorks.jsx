import { Link } from 'react-router-dom';
import { UploadCloud, Cpu, Share2, Search, FileText } from 'lucide-react';
import Footer from '../components/Footer';
import ProfileMenu from '../components/ProfileMenu';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      {/* Navbar Minimal -> Premium */}
      <nav className="w-full h-[100px] flex items-center justify-between px-6 lg:px-[60px] bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-emerald-500">
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
          <span className="font-serif font-bold text-[#0f2a24] text-[26px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-12 ml-12">
            <Link to="/" className="text-slate-500 font-semibold text-[15px] hover:text-slate-900 cursor-pointer transition-colors">Home</Link>
            <div className="relative">
              <Link to="/how-it-works" className="text-slate-900 font-bold text-[15px] cursor-pointer">How It Works</Link>
              <div className="absolute -bottom-[8px] left-0 w-full h-[2px] bg-slate-900 rounded-full"></div>
            </div>
            <Link to="/about" className="text-slate-500 font-semibold text-[15px] hover:text-slate-900 cursor-pointer transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
            <Link to="/analysis/demo-analysis/results" className="hidden lg:block bg-slate-100/80 border border-slate-200/80 text-slate-800 px-6 py-2.5 rounded-lg font-bold text-[14px] hover:bg-slate-200 transition-colors shadow-sm">
                View Demo
            </Link>
            <Link to={localStorage.getItem('isAuthenticated') === 'true' ? "/analysis/new" : "/signin"} className="bg-[#0f172a] text-white px-6 py-2.5 rounded-lg font-bold text-[14px] hover:bg-slate-900 transition-all shadow-md flex items-center gap-2">
                Start Analysis &rarr;
            </Link>
            {localStorage.getItem('isAuthenticated') === 'true' && <ProfileMenu />}
        </div>
      </nav>

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-white py-20 px-6 border-b border-slate-200">
          <div className="max-w-[900px] mx-auto text-center">
            <h1 className="text-[48px] font-serif font-bold text-[#0f2a24] mb-6 leading-tight">How SciTrace AI Works</h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-[700px] mx-auto">
              A detailed look into our four-step process for turning raw PDF documents into a structured, interconnected map of scientific evidence.
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-20 px-6 max-w-[1000px] mx-auto space-y-24">
          
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">1. Securely Upload Literature</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Start by uploading your research papers in PDF format. Our system securely processes the documents, handling complex multi-column layouts, tables, and references. We parse the text while retaining critical metadata like authors, publication year, and internal page numbers.
              </p>
            </div>
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-full md:w-auto h-[250px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 opacity-50"></div>
                <div className="relative z-10 flex flex-col items-center">
                   <UploadCloud className="w-16 h-16 text-slate-300 mb-4" />
                   <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">Drop PDFs here</div>
                </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">2. AI-Powered Extraction</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Our advanced Natural Language Processing (NLP) models read through the parsed text to identify the core scientific claims, methodologies, and outcomes. Instead of just summarizing, the AI isolates individual assertions and tags them with their exact location in the source document.
              </p>
            </div>
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-full md:w-auto h-[250px] flex items-center justify-center relative">
               <div className="w-full space-y-3">
                 <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                 <div className="h-4 bg-emerald-100 rounded w-full border border-emerald-200"></div>
                 <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                 <div className="h-4 bg-emerald-100 rounded w-2/3 border border-emerald-200"></div>
               </div>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">Claim Extracted</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">3. Relationship Mapping</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Once claims are extracted across multiple papers, the AI cross-references them. It identifies semantic similarities and logical relationships to categorize connections as Supporting (corroborating evidence), Contradicting (conflicting results), or Related (contextually similar but distinct).
              </p>
            </div>
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-full md:w-auto h-[250px] flex items-center justify-center">
                <svg width="200" height="150" viewBox="0 0 200 150">
                   <circle cx="50" cy="50" r="15" fill="#3b82f6" />
                   <circle cx="150" cy="30" r="15" fill="#10b981" />
                   <circle cx="130" cy="120" r="15" fill="#ef4444" />
                   <path d="M 65 45 L 135 35" stroke="#10b981" strokeWidth="3" strokeDasharray="4 4" />
                   <path d="M 60 60 L 120 110" stroke="#ef4444" strokeWidth="3" />
                </svg>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">4. Traceable Verification</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Every relationship and claim presented in your dashboard includes a direct link back to the source text. You can click on any insight to view the original paragraph, complete with paper title and page number, ensuring you always have the ground truth at your fingertips.
              </p>
            </div>
            <div className="flex-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-full md:w-auto h-[250px] flex flex-col justify-center">
               <div className="bg-slate-50 p-4 rounded border border-slate-200 mb-3 relative">
                 <p className="text-xs text-slate-600">"The findings suggest a direct correlation between variable X and Y..."</p>
                 <div className="absolute -right-2 -bottom-2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded shadow">Page 14</div>
               </div>
               <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <FileText className="w-4 h-4" /> Smith et al. (2023)
               </div>
            </div>
          </div>

        </section>


      </main>

      <Footer />
    </div>
  );
}
