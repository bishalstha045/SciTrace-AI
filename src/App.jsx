import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Analyzing from './pages/Analyzing';
import Results from './pages/Results';
import PaperDetails from './pages/PaperDetails';
import Export from './pages/Export';
import Analyses from './pages/Analyses';
import Papers from './pages/Papers';
import UploadPapers from './pages/UploadPapers';
import EvidenceComparison from './pages/EvidenceComparison';

import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">404 - Page Not Found</h2>
      <Link to="/analyses" className="text-blue-600 font-medium hover:underline">Back to Workspace</Link>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/analysis/new" element={<UploadPapers />} />
        <Route path="/analysis/:analysisId/progress" element={<Analyzing />} />
        <Route path="/analysis/:analysisId/results" element={<Results />} />
        <Route path="/analysis/:analysisId/paper/:paperId" element={<PaperDetails />} />
        <Route path="/analysis/:analysisId/export" element={<Export />} />
        <Route path="/analysis/:analysisId/evidence/:relationshipId" element={<EvidenceComparison />} />
        
        {/* Legacy fallback routes mapping to demo */}
        <Route path="/analyzing" element={<Analyzing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/paper" element={<PaperDetails />} />
        <Route path="/export" element={<Export />} />
        <Route path="/analyses" element={<Analyses />} />
        <Route path="/papers" element={<Papers />} />
        
        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
