import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function About() {
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col">
      {/* Responsive Navbar */}
      <Navbar mode="marketing" activeTab="about" />

      <main className="flex-1 max-w-[800px] mx-auto py-16 px-6">
        <h1 className="text-[42px] font-serif font-bold text-[#0f2a24] mb-6 leading-tight">About SciTrace AI</h1>
        
        <div className="prose prose-slate prose-lg max-w-none text-slate-600">
          <p className="text-xl text-slate-700 leading-relaxed mb-8">
            SciTrace AI was built to solve a fundamental problem in scientific research: the sheer volume of literature makes it nearly impossible to manually track claims, verify evidence, and identify contradictions across thousands of papers.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-10 mb-4">Our Mission</h2>
          <p>
            We aim to accelerate scientific discovery by providing researchers, students, and institutions with AI-powered tools that not only read and summarize papers, but critically analyze them. We believe in <strong>evidence-first</strong> analysis, where every claim made by our AI can be traced directly back to the original source text.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-10 mb-4">What We Provide</h2>
          <ul className="space-y-4 list-disc pl-6 marker:text-emerald-500">
            <li>
              <strong>Automated Claim Extraction:</strong> Upload your PDFs, and our AI will automatically identify and extract the key scientific claims, methodologies, and results.
            </li>
            <li>
              <strong>Relationship Mapping:</strong> We map out how different papers relate to each other. Do they support the same hypothesis? Do their findings contradict? We highlight these relationships instantly.
            </li>
            <li>
              <strong>Source Traceability:</strong> We never generate "hallucinated" facts. Every piece of information presented in your analysis dashboard includes a direct citation and page number pointing back to the uploaded document.
            </li>
            <li>
              <strong>Comprehensive Exporting:</strong> Export your literature reviews and relationship graphs to standard formats (CSV, PDF, JSON) for easy inclusion in your own research papers.
            </li>
          </ul>

          <div className="mt-12 p-8 bg-emerald-50 rounded-2xl border border-emerald-100">
            <h3 className="text-xl font-bold text-emerald-800 mb-2">Ready to transform your research?</h3>
            <p className="text-emerald-700 mb-6">Join thousands of researchers using SciTrace AI today.</p>
            <Link to={localStorage.getItem('isAuthenticated') === 'true' ? "/analysis/new" : "/signin"} className="inline-block bg-[#0f2a24] text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-900 transition-colors shadow-md">
              Start Your First Analysis
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
