import { demoAnalysis } from '../data/demoData';

const STORAGE_KEY = 'scitrace_analyses';

// Helper to load analyses from localStorage
const loadAnalyses = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Initialize with demo data if empty
    const initialData = { [demoAnalysis.id]: demoAnalysis };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

// Helper to save analyses to localStorage
const saveAnalyses = (analyses) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
};

export const mockAnalysisService = {
  
  // Get all analyses for the history page
  getAllAnalyses: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const analyses = loadAnalyses();
    return Object.values(analyses).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  // Get a single analysis by ID
  getAnalysisById: async (id) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const analyses = loadAnalyses();
    const analysis = analyses[id];
    if (!analysis) throw new Error("Analysis not found");
    return analysis;
  },

  // Create a new analysis from uploaded files (Starts processing state)
  createAnalysis: async (files) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newId = `analysis-${Date.now()}`;
    const newAnalysis = {
      id: newId,
      title: `Analysis of ${files[0]?.name || 'Uploaded Papers'}`,
      status: "processing",
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      papers: files.map((file, index) => ({
        id: `paper-new-${index}`,
        title: file.name.replace('.pdf', ''),
        fileName: file.name,
        size: file.size,
        status: "processing"
      })),
      claims: [],
      relationships: []
    };

    const analyses = loadAnalyses();
    analyses[newId] = newAnalysis;
    saveAnalyses(analyses);
    
    return newAnalysis;
  },

  // Simulate progress updates for a processing analysis
  updateProgress: (id, progress, status = "processing") => {
    const analyses = loadAnalyses();
    if (analyses[id]) {
      analyses[id].progress = progress;
      analyses[id].status = status;
      analyses[id].updatedAt = new Date().toISOString();
      
      // If completed, populate with some mock claims/relationships to make it functional
      if (status === "completed" && analyses[id].claims.length === 0) {
        // Just copy demo data claims for demonstration purposes
        analyses[id].claims = demoAnalysis.claims.map(c => ({...c, id: `new-${c.id}`}));
        analyses[id].relationships = demoAnalysis.relationships.map(r => ({...r, id: `new-${r.id}`}));
      }
      
      saveAnalyses(analyses);
    }
    return analyses[id];
  },

  // Delete an analysis
  deleteAnalysis: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const analyses = loadAnalyses();
    delete analyses[id];
    saveAnalyses(analyses);
    return true;
  },

  // Retry a failed analysis
  retryAnalysis: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const analyses = loadAnalyses();
    if (analyses[id]) {
      analyses[id].status = "processing";
      analyses[id].progress = 0;
      analyses[id].updatedAt = new Date().toISOString();
      saveAnalyses(analyses);
    }
    return analyses[id];
  }
};
