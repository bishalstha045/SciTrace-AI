import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Download, FileText, CheckCircle2, AlertTriangle, Settings, Info, BarChart2, AlignLeft, Box } from 'lucide-react';
import { mockAnalysisService } from '../services/mockAnalysisService';
import { analysisApi } from '../services/api';
import { getAnalysisStats } from '../utils/analysisStats';
import Navbar from '../components/Navbar';

const GENERATION_DATE = new Date().toLocaleDateString();

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
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const isDemo = !analysisId || analysisId === 'demo-analysis' || analysisId === 'demo' || analysisId === 'demo_analysis';
        if (isDemo) {
          const fallback = await mockAnalysisService.getAnalysisById('demo-analysis');
          setAnalysis(fallback);
          return;
        }

        const res = await analysisApi.getAnalysisResults(analysisId);
        if (res.success && res.data) {
          const raw = res.data;
          const analysisObj = raw.analysis || raw;
          const merged = {
            ...analysisObj,
            createdAt: analysisObj.created_at || analysisObj.createdAt,
            updatedAt: analysisObj.updated_at || analysisObj.updatedAt,
            papers: (raw.papers || analysisObj.papers || []).map(p => ({
              ...p,
              title: p.title || p.filename || p.name || 'Untitled Document',
              name: p.filename || p.name || 'Untitled Document',
              pageCount: p.page_count || p.pageCount || 1,
              pages: p.page_count || p.pages || 1,
              year: p.year || new Date().getFullYear(),
              authors: p.authors || [],
            })),
            claims: (raw.claims || analysisObj.claims || []).map(c => ({
              ...c,
              text: c.claim_text || c.text || '',
              claim_text: c.claim_text || c.text || '',
              page: c.page_number || c.page || 1,
              page_number: c.page_number || c.page || 1,
              paperId: c.paper_id || c.paperId || '',
              paper_id: c.paper_id || c.paperId || '',
              section: c.section_name || c.section || '',
            })),
            relationships: (raw.relationships || analysisObj.relationships || []).map(r => ({
              ...r,
              type: r.classification || r.type || 'related',
              sourceClaimId: r.source_claim_id || r.sourceClaimId,
              targetClaimId: r.target_claim_id || r.targetClaimId,
              sourcePaperId: r.source_paper_id || r.sourcePaperId,
              targetPaperId: r.target_paper_id || r.targetPaperId,
              evidence: r.evidence || {
                source: {
                  page: r.source_page_number || 1,
                  text: r.source_claim_text || '',
                  highlight: r.source_claim_text || '',
                },
                target: {
                  page: r.target_page_number || 1,
                  text: r.target_claim_text || '',
                  highlight: r.target_claim_text || '',
                },
              },
              confidence: r.confidence || r.confidence_score || 50,
            })),
          };
          setAnalysis(merged);
        } else {
          setAnalysis(null);
        }
      } catch (err) {
        console.error("Export fetch error:", err);
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [analysisId]);

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[15px] font-bold text-slate-700">Loading export settings...</p>
    </div>
  );
  if (!analysis) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans p-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
        <h2 className="text-[20px] font-serif font-bold text-slate-800 mb-2">Analysis Not Found</h2>
        <p className="text-[13px] text-slate-500 mb-6">The analysis data could not be found for export.</p>
        <Link to="/analysis/demo-analysis/results" className="inline-block bg-[#0b1f1b] text-white px-5 py-2.5 rounded-xl font-bold text-[13px]">
          Open Demo Analysis
        </Link>
      </div>
    </div>
  );

  const getConfidencePercent = (conf) => {
    const val = Number(conf) || 0;
    return val <= 1 ? Math.round(val * 100) : Math.round(val);
  };

  const sanitizeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    // Escape spreadsheet formula triggers
    if (s.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(s[0])) {
      return `"'${s}"`;
    }
    return `"${s}"`;
  };

  const stats = getAnalysisStats(analysis);
  const pCount = stats.paperCount;
  const cCount = stats.totalClaims;
  const rCount = stats.totalRelationships;
  const contradictions = stats.contradictions.length;
  const supporting = stats.supporting.length;
  const relationships = analysis.relationships || [];
  const currentRel = relationships[previewIndex] || relationships[0];
  const sourceClaim = currentRel ? (analysis.claims || []).find(c => c.id === currentRel.sourceClaimId) : null;
  const targetClaim = currentRel ? (analysis.claims || []).find(c => c.id === currentRel.targetClaimId) : null;
  const sourcePaper = sourceClaim ? (analysis.papers || []).find(p => p.id === sourceClaim.paperId) : analysis.papers?.[0];
  const targetPaper = targetClaim ? (analysis.papers || []).find(p => p.id === targetClaim.paperId) : analysis.papers?.[1];
  const relConf = currentRel ? getConfidencePercent(currentRel.confidence) : 85;

  const handleExportCSV = async () => {
    if (!analysis) return;

    // 1. If real backend analysis, try streaming directly from backend endpoint
    if (analysis.id !== 'demo-analysis') {
      try {
        const res = await analysisApi.exportAnalysisCsv(analysis.id);
        if (res.success && res.data?.downloaded) {
          return;
        }
      } catch (err) {
        console.warn("Backend streaming export fallback to client-side:", err);
      }
    }

    // 2. Client-side CSV generation with full attributes & formula injection protection
    const headers = [
      "Analysis ID",
      "Relationship ID",
      "Relationship Category",
      "Paper A",
      "Source Page A",
      "Claim A",
      "Paper B",
      "Target Page B",
      "Claim B",
      "Semantic Similarity Score",
      "Confidence Score (%)",
      "NLI Contradiction Score",
      "NLI Entailment Score",
      "NLI Neutral Score",
      "Classification Model",
      "Similarity Model",
      "Explanation",
      "Context Differences"
    ];

    let csvContent = headers.map(h => sanitizeCell(h)).join(",") + "\n";

    (analysis.relationships || []).forEach(rel => {
      const srcC = (analysis.claims || []).find(c => c.id === (rel.sourceClaimId || rel.source_claim_id));
      const tgtC = (analysis.claims || []).find(c => c.id === (rel.targetClaimId || rel.target_claim_id));
      const srcP = (analysis.papers || []).find(p => p.id === (srcC?.paperId || rel.source_paper_id));
      const tgtP = (analysis.papers || []).find(p => p.id === (tgtC?.paperId || rel.target_paper_id));
      const confVal = getConfidencePercent(rel.confidence || rel.confidence_score);

      const simVal = rel.similarity_score !== undefined ? Number(rel.similarity_score).toFixed(4) : "N/A";
      const nli = rel.nli_scores || {};
      const contraVal = nli.contradiction !== undefined ? Number(nli.contradiction).toFixed(4) : "N/A";
      const entailVal = nli.entailment !== undefined ? Number(nli.entailment).toFixed(4) : "N/A";
      const neutralVal = nli.neutral !== undefined ? Number(nli.neutral).toFixed(4) : "N/A";
      const modelMeta = rel.model_metadata || {};
      const classModel = modelMeta.model_name || "facebook/bart-large-mnli";
      const simModel = modelMeta.similarity_model || "sentence-transformers/all-MiniLM-L6-v2";

      const row = [
        sanitizeCell(analysis.id),
        sanitizeCell(rel.id),
        sanitizeCell(rel.type || rel.classification),
        sanitizeCell(srcP?.title || srcP?.name || 'Paper A'),
        sanitizeCell(srcC?.page || rel.source_page_number || 1),
        sanitizeCell(srcC?.text || rel.source_claim_text || ''),
        sanitizeCell(tgtP?.title || tgtP?.name || 'Paper B'),
        sanitizeCell(tgtC?.page || rel.target_page_number || 1),
        sanitizeCell(tgtC?.text || rel.target_claim_text || ''),
        sanitizeCell(simVal),
        sanitizeCell(confVal),
        sanitizeCell(contraVal),
        sanitizeCell(entailVal),
        sanitizeCell(neutralVal),
        sanitizeCell(classModel),
        sanitizeCell(simModel),
        sanitizeCell(rel.explanation || ''),
        sanitizeCell((rel.contextDifferences || rel.context_differences || []).join('; '))
      ];

      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `scitrace_analysis_${analysis.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans flex flex-col overflow-x-hidden">
      {/* Responsive Navbar */}
      <Navbar 
        activeTab="workspace" 
        actions={
          <Link to={`/analysis/${analysis.id}/results`} className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-medium text-[13px] hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs">
            <ChevronLeft className="w-4 h-4"/> Back to Results
          </Link>
        }
      />

      {/* Main Content Area */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[60px] py-6 sm:py-10 flex flex-col flex-1">
        
        {/* Header Row */}
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link> 
              <ChevronRight className="w-3 h-3 text-slate-400"/> 
              <Link to={`/analysis/${analysis.id}/results`} className="hover:text-emerald-500 transition-colors">Analysis Results</Link> 
              <ChevronRight className="w-3 h-3 text-slate-400"/> 
              <span className="text-slate-700 font-semibold">Export</span>
          </div>
          
          {/* Demonstration Notice */}
          {(analysis.id === 'demo-analysis' || analysis.isDemo || analysis.isSimulation) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-amber-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Demonstration Mode:</strong> Export data generated is based on simulated analysis findings.</span>
              </div>
              <Link to={`/analysis/${analysis.id}/results`} className="font-bold text-amber-900 hover:underline shrink-0">
                Back to Results &rarr;
              </Link>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-[40px] font-serif text-[#0f2a24] leading-tight mb-2 sm:mb-3 tracking-tight">
            Export Analysis
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-500 mb-2">
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
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1"><FileText className="w-4 h-4"/> Analysis Summary</div>
                      <p className="text-[11px] text-slate-500">Include overall analysis statistics.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1 font-serif italic text-[14px]">"<span className="font-sans not-italic">Claim Comparisons</span></div>
                      <p className="text-[11px] text-slate-500">Include compared scientific claims.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-red-600 font-bold text-[13px] mb-1"><AlertTriangle className="w-4 h-4"/> Potential Contradictions</div>
                      <p className="text-[11px] text-slate-500">Include potentially conflicting claims.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1"><AlignLeft className="w-4 h-4"/> Source Evidence</div>
                      <p className="text-[11px] text-slate-500">Include original claim text and page references.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
                    <div>
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px] mb-1"><Box className="w-4 h-4"/> Context Differences</div>
                      <p className="text-[11px] text-slate-500">Include possible dataset, methodology, sample-size, or evaluation differences.</p>
                    </div>
                  </label>
                  <label className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" defaultChecked />
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
                  <div className="bg-emerald-50/60 border-2 border-emerald-500 rounded-xl p-5 shadow-sm relative">
                    <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-[4px] border-emerald-500 bg-white"></div>
                    <BarChart2 className="w-6 h-6 text-emerald-600 mb-3"/>
                    <h4 className="font-bold text-[16px] text-slate-800 mb-0.5">CSV</h4>
                    <p className="text-[12px] text-emerald-800 font-medium mb-2">Structured Data</p>
                    <p className="text-[11px] text-slate-500 mb-4">Export claim comparisons, relationships, paper names, and page references.</p>
                    <button onClick={handleExportCSV} className="block text-center w-full bg-[#0b1f1b] text-white py-2 rounded-lg text-[13px] font-bold shadow-md hover:bg-slate-900 transition-colors cursor-pointer">Export CSV &rarr;</button>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative opacity-60">
                    <span className="absolute top-4 right-4 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Coming Soon</span>
                    <FileText className="w-6 h-6 text-red-500 mb-3"/>
                    <h4 className="font-bold text-[16px] text-slate-800 mb-0.5">PDF</h4>
                    <p className="text-[12px] text-slate-600 font-medium mb-2">Research Report</p>
                    <p className="text-[11px] text-slate-500 mb-4">Generate a formatted report containing the analysis summary, evidence, and findings.</p>
                    <button disabled className="block text-center w-full bg-slate-100 text-slate-400 py-2 rounded-lg text-[13px] font-bold cursor-not-allowed">Generate PDF</button>
                  </div>
                </div>
              </div>

              {/* Advanced Options & Tip */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Settings className="w-5 h-5 text-slate-600"/>
                    <div>
                      <h4 className="font-bold text-[13px] text-slate-800">Export Scope</h4>
                      <p className="text-[11px] text-slate-500">Includes all {relationships.length} relationships across {pCount} papers.</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600"/>
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
                  <p className="text-[12px] text-slate-500">Live preview of relationships included in export.</p>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <button 
                    disabled={previewIndex === 0}
                    onClick={() => setPreviewIndex(p => Math.max(0, p - 1))}
                    className="px-2 py-1.5 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                  <span className="text-[11px] font-medium text-slate-600 px-3">
                    {relationships.length > 0 ? previewIndex + 1 : 0} / {relationships.length}
                  </span>
                  <button 
                    disabled={previewIndex >= relationships.length - 1}
                    onClick={() => setPreviewIndex(p => Math.min(relationships.length - 1, p + 1))}
                    className="px-2 py-1.5 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-200 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Preview Document */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 md:p-8 h-[550px] overflow-hidden relative">
                
                {/* PDF Header */}
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <LogoIcon className="w-6 h-6 text-emerald-500" strokeWidth={2} />
                    <div>
                      <span className="font-serif font-bold text-[#0f2a24] text-[18px] tracking-tight block leading-none mb-1">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Scientific Literature Comparison</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-[14px] text-slate-800">Research Analysis Report</h2>
                    <p className="text-[10px] text-slate-500">Generated on {GENERATION_DATE}</p>
                  </div>
                </div>

                {/* PDF Content */}
                <h3 className="font-bold text-[13px] text-slate-800 mb-2.5 border-b border-slate-100 pb-1.5">Analysis Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                  <div className="text-center bg-slate-50 rounded py-2"><FileText className="w-4 h-4 text-blue-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-slate-800 leading-none">{pCount}</p><p className="text-[8px] text-slate-500 mt-1">Papers analyzed</p></div>
                  <div className="text-center bg-slate-50 rounded py-2"><span className="font-serif font-bold text-[16px] text-blue-500 leading-none mb-1 block">"</span><p className="text-[16px] font-bold text-slate-800 leading-none">{cCount}</p><p className="text-[8px] text-slate-500 mt-1">Claims extracted</p></div>
                  <div className="text-center bg-slate-50 rounded py-2"><LogoIcon className="w-4 h-4 text-blue-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-slate-800 leading-none">{rCount}</p><p className="text-[8px] text-slate-500 mt-1">Claim relationships</p></div>
                  <div className="text-center bg-red-50 rounded py-2"><AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-red-600 leading-none">{contradictions}</p><p className="text-[8px] text-red-600/70 mt-1">Potential contradictions</p></div>
                  <div className="text-center bg-emerald-50 rounded py-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1"/><p className="text-[16px] font-bold text-emerald-600 leading-none">{supporting}</p><p className="text-[8px] text-emerald-600/70 mt-1">Supporting relationships</p></div>
                </div>

                <h3 className="font-bold text-[13px] text-slate-800 mb-2.5 border-b border-slate-100 pb-1.5">
                  Comparison #{previewIndex + 1}
                </h3>
                
                {currentRel ? (
                  <>
                    <div className="border border-slate-200 rounded-lg p-3.5 mb-3 relative">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-1.5 mb-1">
                            <FileText className="w-3 h-3 text-slate-400 mt-0.5 shrink-0"/>
                            <div>
                              <p className="text-[9px] font-bold text-slate-800">Paper A</p>
                              <p className="text-[9px] font-semibold text-blue-600 truncate w-[140px]">{sourcePaper?.title || 'Paper A'}</p>
                              <p className="text-[8px] text-slate-400">Page {sourceClaim?.page || '?'}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-700 font-medium italic mt-1 line-clamp-2">"{sourceClaim?.text || ''}"</p>
                        </div>
                        
                        <div className="w-20 shrink-0 flex flex-col items-center justify-center relative">
                          <div className="w-full h-[1px] border-t border-dashed border-slate-300 absolute top-1/2 -z-10"></div>
                          <div className={`px-1 rounded ${currentRel.type === 'contradiction' ? 'text-red-500 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                            <LogoIcon className="w-4 h-4"/>
                          </div>
                          <span className={`text-[8px] font-bold text-center mt-0.5 capitalize ${currentRel.type === 'contradiction' ? 'text-red-600' : 'text-emerald-700'}`}>
                            {currentRel.type}
                          </span>
                          <span className="text-[7px] font-bold text-slate-400 text-center mt-0.5">{relConf}% conf</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start gap-1.5 mb-1">
                            <FileText className="w-3 h-3 text-slate-400 mt-0.5 shrink-0"/>
                            <div>
                              <p className="text-[9px] font-bold text-slate-800">Paper B</p>
                              <p className="text-[9px] font-semibold text-blue-600 truncate w-[140px]">{targetPaper?.title || 'Paper B'}</p>
                              <p className="text-[8px] text-slate-400">Page {targetClaim?.page || '?'}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-700 font-medium italic mt-1 line-clamp-2">"{targetClaim?.text || ''}"</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-3">
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-slate-800 mb-0.5">Source Evidence <span className="font-normal text-slate-500">(Page {sourceClaim?.page})</span></p>
                        <p className="text-[8px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded line-clamp-3">
                          {currentRel.evidence?.source?.text || currentRel.evidence?.paperA?.snippet || sourceClaim?.text || 'Evidence excerpt recorded.'}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-slate-800 mb-0.5">Source Evidence <span className="font-normal text-slate-500">(Page {targetClaim?.page})</span></p>
                        <p className="text-[8px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded line-clamp-3">
                          {currentRel.evidence?.target?.text || currentRel.evidence?.paperB?.snippet || targetClaim?.text || 'Evidence excerpt recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {currentRel.contextDifferences && currentRel.contextDifferences.length > 0 && (
                        <div className="flex-1 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                          <div className="flex items-center gap-1.5 mb-0.5"><Box className="w-3 h-3 text-amber-500"/><p className="text-[9px] font-bold text-amber-800">Context Differences</p></div>
                          <ul className="list-disc pl-4 text-[8px] text-slate-600 space-y-0.5">
                            {currentRel.contextDifferences.map((diff, dIdx) => (
                              <li key={dIdx}>{diff}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex-1 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-0.5"><LogoIcon className="w-3 h-3 text-blue-500"/><p className="text-[9px] font-bold text-blue-800">Traceable Scientific AI</p></div>
                        <p className="text-[8px] text-slate-600">SciTrace AI identifies potential relationships between scientific claims with traceable sentence excerpts.</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[12px] text-slate-500 p-4">No comparisons recorded in this analysis.</p>
                )}

                {/* Fade out effect at bottom of preview */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-blue-500"/> <h3 className="font-bold text-[13px] text-slate-800">Report Information</h3>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[11px]">
                    <span className="text-slate-500">Analysis</span><span className="font-medium text-slate-800 truncate" title={analysis.title}>{analysis.title}</span>
                    <span className="text-slate-500">Papers</span><span className="font-medium text-slate-800">{pCount}</span>
                    <span className="text-slate-500">Claims</span><span className="font-medium text-slate-800">{cCount}</span>
                    <span className="text-slate-500">Relationships</span><span className="font-medium text-slate-800">{rCount}</span>
                    <span className="text-slate-500">Status</span><span className="font-medium text-emerald-600 font-bold">Ready</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4 text-emerald-600"/> <h3 className="font-bold text-[13px] text-slate-800">Export Actions</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Download complete results as structured CSV.</p>
                  <button onClick={handleExportCSV} className="block text-center w-full bg-[#0b1f1b] text-white py-2 rounded-lg text-[12px] font-bold shadow-md hover:bg-slate-900 transition-colors mb-2 cursor-pointer">Export CSV &rarr;</button>
                  <button disabled className="w-full bg-slate-50 border border-slate-200 text-slate-400 py-2 rounded-lg text-[12px] font-bold flex justify-center items-center gap-2 cursor-not-allowed"><FileText className="w-3.5 h-3.5"/> Generate PDF (Coming Soon)</button>
                </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
}
