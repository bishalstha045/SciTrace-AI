import { Link } from 'react-router-dom';
import { Network, Search, Plus, Download, ChevronDown, CheckCircle2, AlertTriangle, MinusCircle, FileText, ArrowUpRight, ChevronRight, Eye } from 'lucide-react';

export default function Results() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
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
          <button className="btn btn-outline text-sm py-2 px-4 rounded-full flex items-center gap-2 bg-white">
            <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
          </button>
          <button className="btn btn-primary text-sm py-2 px-4 rounded-full flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Analysis
          </button>
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-sm ml-2">B</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-2">Workspace <ChevronRight className="w-3 h-3"/> Analysis Results</div>
            <h1 className="text-4xl font-serif text-slate-900 mb-2">Research Analysis</h1>
            <p className="text-slate-600">Comparison of scientific claims across your uploaded papers.</p>
            <p className="text-sm font-medium text-slate-500 mt-2">3 Papers • 127 Claims • 248 Claim Comparisons</p>
          </div>
          
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" /> Analysis completed just now
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><FileText className="w-4 h-4 text-slate-400" /> Papers Analyzed</div>
            <div className="text-3xl font-serif font-bold text-slate-900">03</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><span className="text-slate-400 font-serif text-xl leading-none w-4 h-4 flex items-center justify-center">"</span> Claims Extracted</div>
            <div className="text-3xl font-serif font-bold text-slate-900">127</div>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase"><AlertTriangle className="w-4 h-4 text-red-500" /> Potential Contradictions</div>
            <div className="text-3xl font-serif font-bold text-red-700">14</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><Network className="w-4 h-4 text-slate-400" /> Claim Pairs Compared</div>
            <div className="text-3xl font-serif font-bold text-slate-900">248</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase"><MinusCircle className="w-4 h-4 text-slate-400" /> Neutral / Undetermined</div>
            <div className="text-3xl font-serif font-bold text-slate-900">65</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-1">Claim Relationships</h3>
              <p className="text-sm text-slate-500 mb-6">How the analyzed claims relate to one another.</p>
              
              <div className="flex gap-8 items-center">
                <div className="w-32 h-32 relative flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    {/* Background */}
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                    {/* Neutral */}
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="100, 100" />
                    {/* Contradicting */}
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="49, 100" />
                    {/* Supporting */}
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="38, 100" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-800">127</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">Total Claims</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Supporting</div>
                    <div className="font-semibold text-slate-800">48 <span className="text-slate-400 font-normal ml-2">37.8%</span></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500"/> Potential Contradiction</div>
                    <div className="font-semibold text-slate-800">14 <span className="text-slate-400 font-normal ml-2">11.0%</span></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><MinusCircle className="w-4 h-4 text-slate-400"/> Neutral / Undetermined</div>
                    <div className="font-semibold text-slate-800">65 <span className="text-slate-400 font-normal ml-2">51.2%</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 text-sm">
              <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium shadow-sm">All (127)</button>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">Supporting (48)</button>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">Potential Contradictions (14)</button>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">Neutral (65)</button>
              <div className="ml-auto flex gap-2">
                <button className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-1"><Search className="w-4 h-4"/> Search claims...</button>
              </div>
            </div>

            {/* Contradictions List */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-serif text-2xl text-slate-900">Potential Contradictions</h3>
                  <p className="text-sm text-slate-500">Claims that appear to make incompatible statements.</p>
                </div>
                <div className="text-sm text-slate-500 font-medium">14 potential contradictions</div>
              </div>

              <div className="space-y-4">
                {/* Item 1 */}
                <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="bg-red-50/80 px-4 py-2.5 border-b border-red-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                      <AlertTriangle className="w-4 h-4" /> Potential contradiction
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      87% relationship confidence
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-red-500 w-[87%] h-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paper A</div>
                      <div className="text-sm font-semibold text-slate-800">Deep Learning for Medical Image Classification</div>
                      <div className="text-xs text-slate-500 mb-2">Page 7</div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 border-l-2 border-l-slate-400">
                        <p className="text-sm text-slate-700 italic">"Method A significantly improves classification accuracy."</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center mt-10 px-2">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-500">
                        <Network className="w-4 h-4 transform rotate-90" />
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paper B</div>
                      <div className="text-sm font-semibold text-slate-800">Comparative Study of Neural Classification Methods</div>
                      <div className="text-xs text-slate-500 mb-2">Page 28</div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 border-l-2 border-l-slate-400">
                        <p className="text-sm text-slate-700 italic">"No significant improvement was observed using Method A."</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Possible contextual difference</span> | Dataset | Different datasets referenced
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-50 transition-colors">
                        Open Paper <ArrowUpRight className="w-3 h-3"/>
                      </button>
                      <button className="text-xs font-semibold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                        View Evidence &rarr;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                  <div className="bg-red-50/50 px-4 py-2.5 border-b border-red-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                      <AlertTriangle className="w-4 h-4" /> Potential contradiction
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      76% relationship confidence
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-red-500 w-[76%] h-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-center text-sm text-slate-500 font-medium bg-slate-50">
                    <Eye className="w-4 h-4 mr-2" /> View contradiction detail
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Research Papers</h3>
                <a href="#" className="text-xs font-medium text-emerald-600 hover:underline">View All</a>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="bg-slate-100 p-2 rounded text-slate-500"><FileText className="w-4 h-4"/></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-0.5">Deep Learning for Medical Image Classification</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">142 pages • <CheckCircle2 className="w-3 h-3 text-emerald-500"/> Analyzed</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="bg-slate-100 p-2 rounded text-slate-500"><FileText className="w-4 h-4"/></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-0.5">Comparative Study of Neural Classification Methods</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">96 pages • <CheckCircle2 className="w-3 h-3 text-emerald-500"/> Analyzed</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="bg-slate-100 p-2 rounded text-slate-500"><FileText className="w-4 h-4"/></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug mb-0.5">Evaluation of Modern Machine Learning Models</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">118 pages • <CheckCircle2 className="w-3 h-3 text-emerald-500"/> Analyzed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Network className="w-4 h-4 text-emerald-500" /> Key Findings</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">48 Supporting relationships</div>
                    <div className="text-xs text-slate-500">Claims that agree with each other.</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5"><AlertTriangle className="w-4 h-4 text-red-500"/></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">14 Potential contradictions</div>
                    <div className="text-xs text-slate-500">Claims that may make incompatible statements.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl border border-blue-100/50 p-5">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm flex items-center gap-2">Why these results matter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                SciTrace AI helps you quickly discover how research findings relate across multiple papers, highlighting supporting evidence, potential contradictions, and areas that need deeper investigation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
