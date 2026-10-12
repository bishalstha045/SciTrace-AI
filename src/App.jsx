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
import Placeholder from './pages/Placeholder';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';

import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected Workspace Routes */}
        <Route path="/analysis/new" element={<ProtectedRoute><UploadPapers /></ProtectedRoute>} />
        <Route path="/analyses" element={<ProtectedRoute><Analyses /></ProtectedRoute>} />
        <Route path="/papers" element={<ProtectedRoute><Papers /></ProtectedRoute>} />
        
        {/* Public Analysis View Routes (so demos work without login) */}
        <Route path="/analysis/:analysisId/progress" element={<Analyzing />} />
        <Route path="/analysis/:analysisId/results" element={<Results />} />
        <Route path="/analysis/:analysisId/paper/:paperId" element={<PaperDetails />} />
        <Route path="/analysis/:analysisId/paper" element={<PaperDetails />} />
        <Route path="/analysis/:analysisId/export" element={<Export />} />
        <Route path="/analysis/:analysisId/evidence/:relationshipId" element={<EvidenceComparison />} />
        <Route path="/analysis/:analysisId/evidence" element={<EvidenceComparison />} />
        
        {/* Direct / Legacy demo routes mapping to demo (public) */}
        <Route path="/analyzing" element={<Analyzing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/evidence/:relationshipId" element={<EvidenceComparison />} />
        <Route path="/evidence" element={<EvidenceComparison />} />
        <Route path="/paper/:paperId" element={<PaperDetails />} />
        <Route path="/paper" element={<PaperDetails />} />
        <Route path="/export" element={<Export />} />
        
        {/* Placeholder Routes */}
        <Route path="/terms" element={<Placeholder />} />
        <Route path="/privacy" element={<Placeholder />} />
        <Route path="/forgot-password" element={<Placeholder />} />
        <Route path="/careers" element={<Placeholder />} />
        <Route path="/contact" element={<Placeholder />} />
        <Route path="/cookie-policy" element={<Placeholder />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
