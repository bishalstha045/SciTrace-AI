import { demoAnalysis } from '../data/demoData.js';

const STORAGE_KEY = 'scitrace_analyses';
let memoryStore = {};

// Safe storage access that works in browsers, private browsing, and test runners
const getStorageItem = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // fallback to memoryStore
  }
  return memoryStore[key] || null;
};

const setStorageItem = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // fallback to memoryStore
  }
  memoryStore[key] = value;
};

// Helper to load analyses from localStorage
const loadAnalyses = () => {
  try {
    const data = getStorageItem(STORAGE_KEY);
    if (!data) {
      // Initialize with demo data if empty
      const initialData = { [demoAnalysis.id]: demoAnalysis };
      setStorageItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  } catch {
    return { [demoAnalysis.id]: demoAnalysis };
  }
};

// Helper to save analyses to localStorage
const saveAnalyses = (analyses) => {
  try {
    setStorageItem(STORAGE_KEY, JSON.stringify(analyses));
  } catch (e) {
    console.error("Failed to save analyses:", e);
  }
};

export const mockAnalysisService = {
  
  // Get all analyses for the history page
  getAllAnalyses: async ({ includeDemo = false } = {}) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    const analyses = loadAnalyses();
    
    let list = Object.values(analyses);
    if (!includeDemo) {
      list = list.filter(a => a.id !== 'demo-analysis');
    }
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  },

  // Get demo analysis directly
  getDemoAnalysis: () => {
    return demoAnalysis;
  },

  // Get a single analysis by ID
  getAnalysisById: async (id) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!id || id === 'demo-analysis' || id === 'demo' || id === 'demo_analysis') {
      return demoAnalysis;
    }
    
    const analyses = loadAnalyses();
    const analysis = analyses[id];
    if (!analysis) {
      // If requested ID does not exist, throw clean descriptive error
      const err = new Error(`Analysis "${id}" not found.`);
      err.code = 'NOT_FOUND';
      throw err;
    }
    return analysis;
  },

  // Create a new analysis from uploaded files (Starts processing state)
  createAnalysis: async (files, title = '') => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newId = `analysis-${Date.now()}`;
    const primaryTitle = files[0]?.name ? files[0].name.replace(/\.pdf$/i, '') : 'Uploaded Research Papers';
    
    const newAnalysis = {
      id: newId,
      title: title || `Analysis of ${primaryTitle}`,
      status: "processing",
      progress: 0,
      isDemo: false,
      isSimulation: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      papers: files.map((file, index) => {
        const cleanName = file.name.replace(/\.pdf$/i, '');
        const estimatedPages = Math.max(12, Math.min(250, Math.round(file.size / 35000)));
        return {
          id: `paper-${Date.now()}-${index}`,
          title: cleanName,
          fileName: file.name,
          authors: index === 0 ? ["Author et al."] : ["Collaborator et al."],
          year: new Date().getFullYear(),
          size: file.size,
          pages: estimatedPages,
          status: "processing"
        };
      }),
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
      
      // If completed, populate with complete mock claims/relationships tied to the uploaded papers
      if (status === "completed" && (!analyses[id].claims || analyses[id].claims.length === 0)) {
        const papers = analyses[id].papers;
        if (papers.length >= 2) {
          const p1 = papers[0];
          const p2 = papers[1];
          const p1Name = p1.title.length > 25 ? p1.title.substring(0, 25) + '...' : p1.title;
          const p2Name = p2.title.length > 25 ? p2.title.substring(0, 25) + '...' : p2.title;
          
          const claim1 = {
            id: `claim-${Date.now()}-1`,
            paperId: p1.id,
            text: `High learning rates yield higher model convergence across structured trials in ${p1Name}.`,
            page: 4
          };
          const claim2 = {
            id: `claim-${Date.now()}-2`,
            paperId: p2.id,
            text: `Lower learning rates prevent parameter instability observed in comparative benchmark tests in ${p2Name}.`,
            page: 11
          };
          const claim3 = {
            id: `claim-${Date.now()}-3`,
            paperId: p1.id,
            text: `Transformer architectures exhibit strong generalization across evaluation sets.`,
            page: 8
          };
          const claim4 = {
            id: `claim-${Date.now()}-4`,
            paperId: p2.id,
            text: `Consistent generalization is preserved across standard domain benchmarks when transfer learning is applied.`,
            page: 19
          };

          analyses[id].claims = [claim1, claim2, claim3, claim4];
          
          analyses[id].relationships = [
            {
              id: `rel-${Date.now()}-1`,
              sourceClaimId: claim1.id,
              targetClaimId: claim2.id,
              type: "contradiction",
              confidence: 86,
              evidence: {
                source: {
                  page: 4,
                  text: `"...Our primary experimental results demonstrate that high learning rates yield higher model convergence across structured trials, reducing overall iteration time..."`,
                  highlight: "high learning rates yield higher model convergence"
                },
                target: {
                  page: 11,
                  text: `"...In direct contradiction to prior assertions, lower learning rates prevent parameter instability observed in comparative benchmark tests and prevent divergence..."`,
                  highlight: "lower learning rates prevent parameter instability"
                }
              },
              contextDifferences: [
                "Optimizer choice (AdamW vs SGD with momentum)",
                "Batch size variation across experimental runs"
              ]
            },
            {
              id: `rel-${Date.now()}-2`,
              sourceClaimId: claim3.id,
              targetClaimId: claim4.id,
              type: "supporting",
              confidence: 93,
              evidence: {
                source: {
                  page: 8,
                  text: `"...Our ablation studies confirm that Transformer architectures exhibit strong generalization across evaluation sets without significant domain degradation..."`,
                  highlight: "Transformer architectures exhibit strong generalization"
                },
                target: {
                  page: 19,
                  text: `"...Consistent generalization is preserved across standard domain benchmarks when transfer learning is applied, verifying cross-domain robustness..."`,
                  highlight: "Consistent generalization is preserved across standard domain benchmarks"
                }
              },
              contextDifferences: []
            }
          ];

          // Mark paper status as completed
          analyses[id].papers.forEach(p => { p.status = "completed"; });
        }
      }
      
      saveAnalyses(analyses);
    }
    return analyses[id];
  },

  // Delete an analysis
  deleteAnalysis: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const analyses = loadAnalyses();
    delete analyses[id];
    saveAnalyses(analyses);
    return true;
  },

  // Retry a failed analysis
  retryAnalysis: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
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
