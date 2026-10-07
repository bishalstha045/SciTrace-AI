import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, X, ChevronRight, Search, Play, HelpCircle, ArrowRight } from 'lucide-react';
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

export default function UploadPapers() {
  const [scale, setScale] = useState(1);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1440;
      setScale(scaleX > 1 ? 1 : scaleX);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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
    setError('');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validPdfs = droppedFiles.filter(file => file.type === 'application/pdf' || file.name.endsWith('.pdf'));
    
    if (validPdfs.length !== droppedFiles.length) {
      setError('Some files were rejected. Only PDF files are supported.');
    }
    
    if (validPdfs.length > 0) {
      setFiles(prev => [...prev, ...validPdfs]);
    }
  };

  const handleFileInput = (e) => {
    setError('');
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = selectedFiles.filter(file => file.type === 'application/pdf' || file.name.endsWith('.pdf'));
    
    if (validPdfs.length !== selectedFiles.length) {
      setError('Some files were rejected. Only PDF files are supported.');
    }
    
    if (validPdfs.length > 0) {
      setFiles(prev => [...prev, ...validPdfs]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAnalyze = async () => {
    if (files.length < 2) {
      setError('Please upload at least 2 papers to perform an analysis.');
      return;
    }
    setError('');
    setIsUploading(true);
    
    try {
      const analysis = await mockAnalysisService.createAnalysis(files);
      navigate(`/analysis/${analysis.id}/progress`);
    } catch (error) {
      console.error("Failed to create analysis:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full bg-[#f8fafc] overflow-x-hidden flex justify-center font-sans" style={{ minHeight: '100vh', height: `${1000 * scale}px` }}>
      <div 
        className="relative bg-[#f8fafc] shrink-0 origin-top" 
        style={{ width: '1440px', height: '1000px', transform: `scale(${scale})` }}
      >
        {/* Navbar */}
        <nav className="absolute top-0 left-0 w-full h-[80px] flex items-center justify-between px-[60px] z-50 border-b border-slate-200/50 bg-white">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <LogoIcon className="w-7 h-7 text-[#0f2a24]" strokeWidth={2} />
            <span className="font-serif font-bold text-[#0f2a24] text-[22px] tracking-tight">SciTrace <span className="text-emerald-500 font-sans">AI</span></span>
          </Link>

          <div className="flex items-center gap-10">
            <div className="relative h-full flex items-center">
              <Link to="/analyses" className="text-slate-900 font-semibold text-[14px] cursor-pointer pt-7 pb-7">Workspace</Link>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900 rounded-t-full"></div>
            </div>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Analyses</Link>
            <Link to="/analyses" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Papers</Link>
            <Link to="/" className="text-slate-500 font-medium text-[14px] hover:text-slate-900 cursor-pointer transition-colors">Help</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/analyses" title="Search Analyses" className="text-slate-400 hover:text-slate-600">
              <Search className="w-5 h-5" strokeWidth={2} />
            </Link>
            <ProfileMenu />
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="absolute left-[60px] top-[120px] w-[1320px] flex gap-10">
          
          {/* Left Column - Upload Area */}
          <div className="flex-[2] flex flex-col">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
               Workspace <ChevronRight className="w-3 h-3"/> New Analysis
            </div>
            <h1 className="text-[40px] font-serif text-[#0f2a24] leading-none mb-3 tracking-tight">
              Upload Papers
            </h1>
            <p className="text-[16px] text-slate-500 mb-8">
              Upload at least 2 scientific research papers in PDF format to discover relationships between their claims.
            </p>

            {/* Drag and Drop Zone */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800 mb-2">Drag and drop PDF files here</h3>
              <p className="text-[14px] text-slate-500 mb-2">or click to browse your computer (Max 50MB per file)</p>
              {error && <p className="text-[12px] font-bold text-red-600 mb-4 bg-red-50 px-3 py-1.5 rounded border border-red-100">{error}</p>}
              {(!error) && <div className="h-8"></div>}
              
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
                className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-bold text-[14px] hover:bg-slate-50 cursor-pointer shadow-sm transition-colors"
              >
                Browse Files
              </label>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-[16px] text-slate-800 mb-4 flex justify-between items-center">
                  <span>Uploaded Files ({files.length})</span>
                  {files.length < 2 && <span className="text-[12px] font-medium text-amber-600">Please upload at least 2 papers</span>}
                </h3>
                <div className="space-y-3 h-[250px] overflow-y-auto pr-2 pb-10">
                  {files.map((file, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 shadow-sm group">
                      <div className="bg-red-50 text-red-600 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] text-slate-800 truncate mb-0.5">{file.name}</p>
                        <p className="text-[11px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB &bull; PDF Document</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Ready</span>
                        <button onClick={() => removeFile(idx)} className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100">
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
          <div className="flex-[1] flex flex-col pt-10">
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-[16px] text-slate-800 mb-4 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-500"/> What happens next?</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-200 text-blue-600 font-bold text-[12px] flex items-center justify-center shrink-0 shadow-sm">1</div>
                  <div>
                    <h4 className="font-bold text-[14px] text-slate-800 mb-1">Extract text & claims</h4>
                    <p className="text-[12px] text-slate-600 leading-relaxed">Our AI reads through your documents and extracts the core scientific statements and methodologies.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-200 text-blue-600 font-bold text-[12px] flex items-center justify-center shrink-0 shadow-sm">2</div>
                  <div>
                    <h4 className="font-bold text-[14px] text-slate-800 mb-1">Compare findings</h4>
                    <p className="text-[12px] text-slate-600 leading-relaxed">We cross-reference every claim across your uploaded papers to identify relationships.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-200 text-blue-600 font-bold text-[12px] flex items-center justify-center shrink-0 shadow-sm">3</div>
                  <div>
                    <h4 className="font-bold text-[14px] text-slate-800 mb-1">Investigate evidence</h4>
                    <p className="text-[12px] text-slate-600 leading-relaxed">You receive a dashboard highlighting supporting evidence and potential contradictions with page references.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              <h3 className="font-bold text-[16px] text-slate-800 mb-2">Ready to start?</h3>
              <p className="text-[12px] text-slate-500 mb-6">You need at least 2 papers to perform a comparison analysis.</p>
              
              <button 
                onClick={handleAnalyze}
                disabled={files.length < 2 || isUploading}
                className={`w-full py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-md ${files.length >= 2 ? 'bg-[#0b1f1b] text-white hover:bg-slate-900' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                {isUploading ? 'Preparing Analysis...' : (
                  <>Analyze Papers <ArrowRight className="w-4 h-4"/></>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
