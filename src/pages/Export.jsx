import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Download, FileText, CheckCircle2, AlertTriangle, Settings, Info, BarChart2, AlignLeft, Box, ChevronDown } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import ProfileMenu from '../components/ProfileMenu';

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

export default function Export() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await mockAnalysisService.getAnalysisById(analysisId || 'demo-analysis');
        setAnalysis(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading export settings...</div>;
  if (!analysis) return <div className="p-10 text-center font-bold text-red-500">Analysis not found.</div>;

  const pCount = analysis.papers?.length || 0;
  const cCount = analysis.claims?.length || 0;
  const rCount = analysis.relationships?.length || 0;
  const contradictions = analysis.relationships?.filter(r => r.type === 'contradiction').length || 0;
  const supporting = analysis.relationships?.filter(r => r.type === 'supporting').length || 0;

  const handleExportCSV = () => {
    if (!analysis) return;

    let csvContent = "Analysis ID,Analysis Title,Paper A,Paper A Page,Claim A,Paper B,Paper B Page,Claim B,Relationship,Confidence,Context Differences\n";

    (analysis.relationships || []).forEach(rel => {
      const sourceClaim = (analysis.claims || []).find(c => c.id === rel.sourceClaimId);
      const targetClaim = (analysis.claims || []).find(c => c.id === rel.targetClaimId);
      const sourcePaper = (analysis.papers || []).find(p => p.id === sourceClaim?.paperId);
      const targetPaper = (analysis.papers || []).find(p => p.id === targetClaim?.paperId);

      const row = [
        analysis.id,
        `"${analysis.title || 'Analysis'}"`,
        `"${sourcePaper?.title || ''}"`,
        sourceClaim?.page || '',
        `"${(sourceClaim?.text || '').replace(/"/g, '""')}"`,
        `"${targetPaper?.title || ''}"`,
        targetClaim?.page || '',
        `"${(targetClaim?.text || '').replace(/"/g, '""')}"`,
        rel.type,
        `${Math.round((rel.confidence || 0) * 100)}%`,
        `"${(rel.contextDifferences?.[0] || '').replace(/"/g, '""')}"`
      ];

      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scitrace-analysis-${analysis.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 w-full h-[80px] flex items-center justify-between px-6 lg:px-[60px] z-50 border-b border-slate-200/50 bg-white">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <LogoIcon className="w-7 h-7 text-[#0f2a24]" strokeWidth={2} />
            <span className="font-serif font-bold text-[#0f2a24] text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </Link>

          <div className="flex items-center gap-10">
            <div className="relative h-full flex items-center">
              <Link to="/analyses" className="text-slate-900 font-semibold text-[14px] cursor-pointer">Workspace</Link>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>
            </div>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Analyses</Link>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Papers</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/analyses" title="Search Analyses" className="text-slate-400 hover:text-slate-600">
              <Search className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link to={`/analysis/${analysis.id}/results`} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-[14px] hover:bg-slate-50 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4"/> Back to Results
            </Link>
            <ProfileMenu />
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-[60px] py-10 flex flex-col flex-1">
          
          {/* Header Row */}
          <div className="mb-8">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2 flex-wrap">
                Workspace <ChevronRight className="w-3 h-3"/> Analysis Results <ChevronRight className="w-3 h-3"/> Export
            </div>
            <h1 className="text-[40px] font-serif text-[#0f2a24] leading-none mb-3 tracking-tight">
              Export Analysis
            </h1>
            <p className="text-[15px] text-slate-500 mb-2">
              Create a structured report from your SciTrace AI analysis.
            </p>
            <div className="flex items-center gap-3 text-[13px] text-slate-500 font-medium mt-3">
              <div className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> {pCount} papers</div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5 font-serif font-bold italic text-[14px]">" <span className="font-sans not-italic font-medium">{cCount} claims</span></div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5"><LogoIcon className="w-4 h-4"/> {rCount} comparisons</div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Options */}
            <div className="flex-1 flex flex-col gap-8">
              
              {/* Checkboxes */}
              <div>
                <h3 className="text-[18px] font-bold text-slate-800 mb-1">What would you like to include?</h3>
                <p className="text-[13px] text-slate-500 mb-4">Select the content to include in your export report.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1"><FileText className="w-4 h-4"/> Analysis Summary</div>
                      <p className="text-[11px] text-slate-500">Include overall analysis statistics.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1 font-serif italic text-[14px]">"<span className="font-sans not-italic">Claim Comparisons</span></div>
                      <p className="text-[11px] text-slate-500">Include compared scientific claims.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-red-600 font-bold text-[13px] mb-1"><AlertTriangle className="w-4 h-4"/> Potential Contradictions</div>
                      <p className="text-[11px] text-slate-500">Include potentially conflicting claims.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1"><AlignLeft className="w-4 h-4"/> Source Evidence</div>
                      <p className="text-[11px] text-slate-500">Include original claim text and page references.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1"><Box className="w-4 h-4"/> Context Differences</div>
                      <p className="text-[11px] text-slate-500">Include possible dataset, methodology, sample-size, or evaluation differences.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1"><FileText className="w-4 h-4"/> Paper Information</div>
                      <p className="text-[11px] text-slate-500">Include analyzed paper details.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <h3 className="text-[18px] font-bold text-slate-800 mb-1">Choose Export Format</h3>
                <p className="text-[13px] text-slate-500 mb-4">Select the format for your exported analysis.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-5 shadow-sm relative">
                    <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-[4px] border-blue-500 bg-white"></div>
                    <BarChart2 className="w-6 h-6 text-blue-600 mb-3"/>
                    <h4 className="font-bold text-[16px] text-slate-800 mb-0.5">CSV</h4>
                    <p className="text-[12px] text-slate-600 font-medium mb-2">Structured Data</p>
                    <p className="text-[11px] text-slate-500 mb-4">Export claim comparisons, relationships, paper names, and page references.</p>
                    <button onClick={handleExportCSV} className="block text-center w-full bg-[#0b1f1b] text-white py-2 rounded-lg text-[13px] font-bold shadow-md hover:bg-slate-900 transition-colors">Export CSV &rarr;</button>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative opacity-60">
                    <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Coming Soon</span>
                    <FileText className="w-6 h-6 text-red-500 mb-3"/>
                    <h4 className="font-bold text-[16px] text-slate-800 mb-0.5">PDF</h4>
                    <p className="text-[12px] text-slate-600 font-medium mb-2">Research Report</p>
                    <p className="text-[11px] text-slate-500 mb-4">Generate a formatted report containing the analysis summary, evidence, and findings.</p>
                    <Link to={`/analysis/${analysis.id}/results`} className="block text-center w-full bg-slate-100 text-slate-400 py-2 rounded-lg text-[13px] font-bold cursor-not-allowed">Generate PDF</Link>
                  </div>
                </div>
              </div>

              {/* Advanced Options & Tip */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50">
                  <div className="flex gap-3 items-center">
                    <Settings className="w-5 h-5 text-slate-600"/>
                    <div>
                      <h4 className="font-bold text-[13px] text-slate-800">Advanced Options</h4>
                      <p className="text-[11px] text-slate-500">Customize the contents of your export report.</p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400"/>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <div className="mt-0.5"><Info className="w-4 h-4 text-blue-600"/></div>
                  <div>
                    <h4 className="font-bold text-[12px] text-slate-800 mb-1">Evidence remains traceable</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">Exported relationships include the original claim text and available source references so results can be reviewed against the research papers.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Preview */}
            <div className="flex-[1.2] flex flex-col gap-4">
              
              <div className="flex justify-between items-center mb-4 lg:mb-0">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800">Report Preview</h3>
                  <p className="text-[12px] text-slate-500">This is a preview of what will be included in your export.</p>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <button className="px-2 py-1.5 hover:bg-slate-50 text-slate-400 border-r border-slate-200"><ChevronLeft className="w-4 h-4"/></button>
                  <span className="text-[11px] font-medium text-slate-600 px-3">1 / 8</span>
                  <button className="px-2 py-1.5 hover:bg-slate-50 text-slate-600 border-l border-slate-200"><ChevronRight className="w-4 h-4"/></button>
                </div>
              </div>

              {/* Preview Document */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 md:p-8 h-[550px] overflow-hidden relative">
                
                {/* PDF Header */}
                <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2.5">
                    <LogoIcon className="w-6 h-6 text-[#0f2a24]" strokeWidth={2} />
                    <div>
                      <span className="font-serif font-bold text-[#0f2a24] text-[18px] tracking-tight block leading-none mb-1">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Scientific Literature Comparison</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-[14px] text-slate-800">Research Analysis Report</h2>
                    <p className="text-[10px] text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* PDF Content */}
                <h3 className="font-bold text-[14px] text-slate-800 mb-3 border-b border-slate-100 pb-2">Analysis Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
                  <div className="text-center bg-slate-50 rounded py-2"><FileText className="w-4 h-4 text-blue-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-slate-800 leading-none">{pCount}</p><p className="text-[8px] text-slate-500 mt-1">Papers analyzed</p></div>
                  <div className="text-center bg-slate-50 rounded py-2"><span className="font-serif font-bold text-[16px] text-blue-500 leading-none mb-1 block">"</span><p className="text-[16px] font-bold text-slate-800 leading-none">{cCount}</p><p className="text-[8px] text-slate-500 mt-1">Claims extracted</p></div>
                  <div className="text-center bg-slate-50 rounded py-2"><LogoIcon className="w-4 h-4 text-blue-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-slate-800 leading-none">{rCount}</p><p className="text-[8px] text-slate-500 mt-1">Claim relationships</p></div>
                  <div className="text-center bg-red-50 rounded py-2"><AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-red-600 leading-none">{contradictions}</p><p className="text-[8px] text-red-600/70 mt-1">Potential contradictions</p></div>
                  <div className="text-center bg-emerald-50 rounded py-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-emerald-600 leading-none">{supporting}</p><p className="text-[8px] text-emerald-600/70 mt-1">Supporting relationships</p></div>
                </div>

                <h3 className="font-bold text-[14px] text-slate-800 mb-3 border-b border-slate-100 pb-2">Potential Contradictions</h3>
                
                <div className="border border-slate-200 rounded-lg p-4 mb-4 relative">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-1.5 mb-1">
                        <FileText className="w-3 h-3 text-slate-400 mt-0.5 shrink-0"/>
                        <div>
                          <p className="text-[9px] font-bold text-slate-800">Paper A</p>
                          <p className="text-[9px] font-semibold text-blue-600 truncate w-[140px]">Deep Learning for Medical Image Classification</p>
                          <p className="text-[8px] text-slate-400">Page 7</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-700 font-medium italic mt-2">"Method A significantly improves classification accuracy."</p>
                    </div>
                    
                    <div className="w-16 shrink-0 flex flex-col items-center justify-center relative">
                      <div className="w-full h-[1px] border-t border-dashed border-red-300 absolute top-1/2 -z-10"></div>
                      <div className="text-red-500 bg-white px-1"><LogoIcon className="w-4 h-4 text-red-500"/></div>
                      <span className="text-[7px] font-bold text-red-600 text-center mt-0.5">Potential<br/>Contradiction</span>
                      <span className="text-[7px] font-bold text-slate-400 text-center mt-0.5">87% confidence</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start gap-1.5 mb-1">
                        <FileText className="w-3 h-3 text-slate-400 mt-0.5 shrink-0"/>
                        <div>
                          <p className="text-[9px] font-bold text-slate-800">Paper B</p>
                          <p className="text-[9px] font-semibold text-blue-600 truncate w-[140px]">Comparative Study of Neural Classification Methods</p>
                          <p className="text-[8px] text-slate-400">Page 12</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-700 font-medium italic mt-2">"No significant improvement was observed using Method A."</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-800 mb-1">Source Evidence <span className="font-normal text-slate-500">(Page 7)</span></p>
                    <p className="text-[8px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded">...Our experiments demonstrate that <span className="bg-emerald-100 text-emerald-800 px-0.5">Method A significantly improves classification accuracy</span> compared with the baseline approach. Specifically, we observe an average increase of 12.3% in accuracy across all test sets...</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-800 mb-1">Source Evidence <span className="font-normal text-slate-500">(Page 12)</span></p>
                    <p className="text-[8px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded">...In contrast, our results show that <span className="bg-red-100 text-red-800 px-0.5">no significant improvement was observed</span> using Method A. The classification accuracy remained comparable to the baseline model...</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-1"><Box className="w-3 h-3 text-amber-500"/><p className="text-[10px] font-bold text-amber-800">Possible Context Differences</p></div>
                    <ul className="list-disc pl-4 text-[8px] text-slate-600 space-y-0.5 mt-2">
                      <li>Different datasets referenced</li>
                      <li>Different sample sizes</li>
                      <li>Different evaluation metrics</li>
                    </ul>
                  </div>
                  <div className="flex-1 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-1"><LogoIcon className="w-3 h-3 text-blue-500"/><p className="text-[10px] font-bold text-blue-800">AI-assisted analysis</p></div>
                    <p className="text-[8px] text-slate-600 mt-1">SciTrace AI identifies potential relationships between scientific claims. These results are intended to support research review and should not be treated as definitive scientific conclusions.</p>
                  </div>
                </div>

                {/* Fade out effect at bottom of preview */}
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-500"/> <h3 className="font-bold text-[13px] text-slate-800">Report Information</h3>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[11px]">
                    <span className="text-slate-500">Analysis</span><span className="font-medium text-slate-800">{analysis.title}</span>
                    <span className="text-slate-500">Papers</span><span className="font-medium text-slate-800">{pCount}</span>
                    <span className="text-slate-500">Claims</span><span className="font-medium text-slate-800">{cCount}</span>
                    <span className="text-slate-500">Relationships</span><span className="font-medium text-slate-800">{rCount}</span>
                    <span className="text-slate-500">Generated</span><span className="font-medium text-slate-800">Just now</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4 text-blue-500"/> <h3 className="font-bold text-[13px] text-slate-800">Export Actions</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Ready to export your analysis.</p>
                  <button onClick={handleExportCSV} className="block text-center w-full bg-[#0b1f1b] text-white py-2 rounded-lg text-[12px] font-bold shadow-md hover:bg-slate-900 transition-colors mb-2">Export CSV &rarr;</button>
                  <button className="w-full bg-slate-50 border border-slate-200 text-slate-400 py-2 rounded-lg text-[12px] font-bold flex justify-center items-center gap-2 cursor-not-allowed"><FileText className="w-3.5 h-3.5"/> Generate PDF (Coming Soon)</button>
                </div>
              </div>

            </div>
          </div>
        </main>
    </div>
  );
}
