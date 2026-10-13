import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, X, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react';
import { analysisApi } from '../services/api';
import Navbar from '../components/Navbar';

export default function UploadPapers() {
  const [analysisTitle, setAnalysisTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  const validateAndFilterFiles = (incomingFiles) => {
    const valid = [];
    const errors = [];

    for (const file of incomingFiles) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        errors.push(`'${file.name}' is not a valid PDF.`);
        continue;
      }
      if (file.size === 0) {
        errors.push(`'${file.name}' is empty (0 bytes).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`'${file.name}' exceeds the 50MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        continue;
      }
      // Check if already in file list
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`'${file.name}' has already been added.`);
        continue;
      }
      valid.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    } else {
      setError('');
    }

    return valid;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validPdfs = validateAndFilterFiles(droppedFiles);
    
    if (validPdfs.length > 0) {
      setFiles(prev => [...prev, ...validPdfs]);
    }
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = validateAndFilterFiles(selectedFiles);
    
    if (validPdfs.length > 0) {
      setFiles(prev => [...prev, ...validPdfs]);
    }
    // Reset file input so user can re-select same file if deleted
    e.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAnalyze = async () => {
    if (isUploading) return; // Prevent duplicate clicks
    if (files.length < 2) {
      setError('Please upload at least 2 papers to perform a comparative analysis.');
      return;
    }
    setError('');
    setIsUploading(true);
    
    try {
      const defaultTitle = files.length > 0
        ? `Comparative Analysis: ${files[0].name.replace(/\.pdf$/i, '')} vs ${files[1] ? files[1].name.replace(/\.pdf$/i, '') : 'Research'}`
        : 'Comparative Research Analysis';
      const titleToUse = analysisTitle.trim() || defaultTitle;

      const res = await analysisApi.createAnalysis(files, titleToUse);
      if (res.success && res.data) {
        navigate(`/analysis/${res.data.id}/progress`);
      } else {
        setError(res.error || 'Failed to initialize analysis pipeline.');
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Failed to create analysis:", err);
      setError(err.message || 'An unexpected error occurred while uploading.');
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
      {/* Responsive Navbar */}
      <Navbar activeTab="workspace" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* Left Column - Upload Area */}
          <div className="flex-[2] flex flex-col min-w-0">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:gap-2">
               <Link to="/analyses" className="hover:text-emerald-500 transition-colors">Workspace</Link> 
               <ChevronRight className="w-3 h-3 text-slate-400"/> 
               <span>New Analysis</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-[40px] font-serif text-[#0f2a24] leading-tight mb-2 sm:mb-3 tracking-tight">
              Upload Papers
            </h1>
            <p className="text-[14px] sm:text-[16px] text-slate-500 mb-6">
              Upload at least 2 scientific research papers in PDF format to discover relationships between their claims.
            </p>

            {/* AI Contradiction Engine Active Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 mb-6 flex items-start gap-3 text-[12px] text-emerald-800">
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase shrink-0 mt-0.5">
                Live AI Engine
              </span>
              <p className="leading-relaxed">
                Multi-file PDF ingestion, text extraction (PyMuPDF), candidate claim discovery, semantic similarity (all-MiniLM-L6-v2), and NLI contradiction classification (BART-large-MNLI) are active.
              </p>
            </div>

            {/* Analysis Title / Research Topic Input */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-2">
                <label htmlFor="analysis-title-input" className="text-[13px] font-bold text-slate-800">
                  Analysis Name / Research Topic
                </label>
                <span className="text-[11px] text-slate-400">Recorded in your Workspace history</span>
              </div>
              <input
                id="analysis-title-input"
                type="text"
                value={analysisTitle}
                onChange={(e) => setAnalysisTitle(e.target.value)}
                placeholder="e.g., Comparative Study on Microplastics in Marine Life"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-[13px] sm:text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Specify what you are analyzing so you can easily identify this investigation in your reports.
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 md:p-12 flex flex-col items-center justify-center transition-colors text-center ${
                isDragging ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-bold text-slate-800 mb-1 sm:mb-2">
                Drag and drop PDF files here
              </h3>
              <p className="text-[13px] sm:text-[14px] text-slate-500 mb-4">
                or click to browse your computer (Max 50MB per file)
              </p>
              
              {error && (
                <p className="text-[12px] font-bold text-red-600 mb-4 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 max-w-md">
                  {error}
                </p>
              )}
              
              <input 
                type="file" 
                id="file-upload" 
                multiple 
                accept=".pdf"
                className="hidden" 
                onChange={handleFileInput}
              />
              <label 
                htmlFor="file-upload" 
                className="bg-white border border-slate-200 text-slate-700 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-[13px] sm:text-[14px] hover:bg-slate-50 cursor-pointer shadow-xs transition-colors"
              >
                Browse Files
              </label>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h3 className="font-bold text-[15px] sm:text-[16px] text-slate-800 mb-3 sm:mb-4 flex justify-between items-center flex-wrap gap-2">
                  <span>Uploaded Files ({files.length})</span>
                  {files.length < 2 && (
                    <span className="text-[12px] font-medium text-amber-600">Please upload at least 2 papers</span>
                  )}
                </h3>
                <div className="space-y-2.5 sm:space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4 shadow-xs">
                      <div className="bg-red-50 text-red-600 rounded-lg w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13px] sm:text-[14px] text-slate-800 truncate mb-0.5">{file.name}</p>
                        <p className="text-[11px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB &bull; PDF</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 sm:py-1 rounded">Ready</span>
                        <button 
                          onClick={() => removeFile(idx)} 
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Instructions & Action */}
          <div className="flex-[1] flex flex-col pt-0 lg:pt-0">
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 sm:p-6 mb-6">
              <h3 className="font-bold text-[15px] sm:text-[16px] text-slate-800 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500"/> What happens next?
              </h3>
              
              <div className="space-y-5">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-blue-200 text-blue-600 font-bold text-[12px] flex items-center justify-center shrink-0 shadow-xs">1</div>
                  <div>
                    <h4 className="font-bold text-[13px] sm:text-[14px] text-slate-800 mb-0.5">Extract text & claims</h4>
                    <p className="text-[11px] sm:text-[12px] text-slate-600 leading-relaxed">Our AI reads through your documents and extracts core scientific claims.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-blue-200 text-blue-600 font-bold text-[12px] flex items-center justify-center shrink-0 shadow-xs">2</div>
                  <div>
                    <h4 className="font-bold text-[13px] sm:text-[14px] text-slate-800 mb-0.5">Compare findings</h4>
                    <p className="text-[11px] sm:text-[12px] text-slate-600 leading-relaxed">We cross-reference every claim across your uploaded papers.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-blue-200 text-blue-600 font-bold text-[12px] flex items-center justify-center shrink-0 shadow-xs">3</div>
                  <div>
                    <h4 className="font-bold text-[13px] sm:text-[14px] text-slate-800 mb-0.5">Investigate evidence</h4>
                    <p className="text-[11px] sm:text-[12px] text-slate-600 leading-relaxed">You receive a dashboard highlighting supporting evidence and contradictions with page references.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col items-center text-center">
              <h3 className="font-bold text-[15px] sm:text-[16px] text-slate-800 mb-1">Ready to start?</h3>
              <p className="text-[12px] text-slate-500 mb-5">You need at least 2 papers to perform a comparison analysis.</p>
              
              <button 
                onClick={handleAnalyze}
                disabled={files.length < 2 || isUploading}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-[14px] sm:text-[15px] flex items-center justify-center gap-2 transition-all shadow-sm ${
                  files.length >= 2 
                    ? 'bg-[#0b1f1b] text-white hover:bg-slate-900 cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isUploading ? 'Preparing Analysis...' : (
                  <>Analyze Papers <ArrowRight className="w-4 h-4"/></>
                )}
              </button>
            </div>

          </div>

        </main>
    </div>
  );
}
