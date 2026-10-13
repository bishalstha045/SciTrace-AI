import { mockAnalysisService } from './mockAnalysisService.js';
import { demoAnalysis } from '../data/demoData.js';
import { supabase } from '../lib/supabase.js';

// API configuration for FastAPI backend (routed via Vite proxy or custom URL)
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api';
const USE_MOCK = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK === 'true');

/**
 * Helper to retrieve Supabase session access token for Bearer authentication
 */
const getAuthHeaders = async (isJson = true) => {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('Could not read Supabase session token:', err);
  }
  return headers;
};

/**
 * Standard API response wrapper
 */
const formatResponse = (data) => ({
  success: true,
  data,
  error: null,
});

const formatError = (error) => ({
  success: false,
  data: null,
  error: error?.message || 'An unexpected error occurred',
  code: error?.code || 'UNKNOWN_ERROR',
});

/**
 * Centralized Analysis API Service Layer
 */
export const analysisApi = {
  /**
   * Check backend health status
   */
  async checkHealth() {
    try {
      const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return formatResponse(data);
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Fetch all analyses for the current authenticated user
   */
  async getAnalyses(options = {}) {
    try {
      if (USE_MOCK) {
        const data = await mockAnalysisService.getAllAnalyses(options);
        return formatResponse(data);
      }
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/analyses`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const raw = await res.json();
      const formatted = (raw || []).map(a => ({
        ...a,
        createdAt: a.created_at || a.createdAt,
        updatedAt: a.updated_at || a.updatedAt,
        papers: (a.papers || []).map(p => ({
          ...p,
          title: p.title || p.filename || p.name || 'Untitled Document',
          name: p.filename || p.name || 'Untitled Document',
          pages: p.page_count || p.pages || 1,
        })),
      }));
      return formatResponse(formatted);
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Fetch analysis by ID
   */
  async getAnalysis(analysisId) {
    return this.getAnalysisById(analysisId);
  },

  async getAnalysisById(analysisId) {
    try {
      if (USE_MOCK || analysisId === 'demo-analysis' || analysisId === 'demo') {
        const data = await mockAnalysisService.getAnalysisById(analysisId);
        return formatResponse(data);
      }
      const headers = await getAuthHeaders();
      // First try /analyses/:id for status (lightweight, used in polling)
      const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}`, { headers });
      if (!res.ok) {
        if (res.status === 404) {
          const err = new Error('Analysis not found');
          err.code = 'NOT_FOUND';
          throw err;
        }
        throw new Error(`HTTP error ${res.status}`);
      }
      const raw = await res.json();
      const formatted = {
        ...raw,
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
        papers: (raw.papers || []).map(p => ({
          ...p,
          title: p.title || p.filename || p.name || 'Untitled Document',
          name: p.filename || p.name || 'Untitled Document',
          pageCount: p.page_count || p.pageCount || 1,
          pages: p.page_count || p.pages || 1,
          year: p.year || 2024,
          authors: p.authors || [],
        })),
        claims: [],
        relationships: [],
      };
      return formatResponse(formatted);

    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Trigger scientific claim extraction for a paper
   */
  async extractClaims(analysisId, paperId) {
    try {
      if (USE_MOCK || analysisId === 'demo-analysis') {
        const analysis = await mockAnalysisService.getAnalysisById(analysisId);
        const claims = (analysis.claims || []).filter(c => c.paperId === paperId);
        return formatResponse({
          paper_id: paperId,
          analysis_id: analysisId,
          claims_count: claims.length,
          claims,
        });
      }
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}/papers/${paperId}/extract-claims`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to extract claims: HTTP ${res.status}`);
      }
      const data = await res.json();
      return formatResponse(data);
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Retrieve extracted claims for an analysis or specific paper
   */
  async getClaims(analysisId, paperId = null) {
    try {
      if (USE_MOCK || analysisId === 'demo-analysis') {
        const analysis = await mockAnalysisService.getAnalysisById(analysisId);
        let claims = analysis.claims || [];
        if (paperId) claims = claims.filter(c => c.paperId === paperId);
        return formatResponse(claims);
      }
      const headers = await getAuthHeaders();
      const endpoint = paperId
        ? `${API_BASE_URL}/analyses/${analysisId}/papers/${paperId}/claims`
        : `${API_BASE_URL}/analyses/${analysisId}/claims`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return formatResponse(data);
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Fetch demo analysis dataset
   */
  getDemoAnalysis() {
    return formatResponse(demoAnalysis);
  },

  /**
   * Create new analysis from uploaded files and initiate workflow
   */
  async createAnalysis(files, title = 'Comparative Research Analysis') {
    try {
      if (!files || files.length < 2) {
        throw new Error('At least 2 PDF files are required for comparative analysis.');
      }
      if (USE_MOCK) {
        const data = await mockAnalysisService.createAnalysis(files, title);
        return formatResponse(data);
      }

      const authHeaders = await getAuthHeaders();

      // 1. Create analysis record in backend
      const createRes = await fetch(`${API_BASE_URL}/analyses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ title }),
      });
      if (!createRes.ok) throw new Error(`Failed to create analysis: HTTP ${createRes.status}`);
      const analysis = await createRes.json();

      // 2. Upload and validate each paper
      const uploadedPapers = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadHeaders = await getAuthHeaders(false); // Multipart form, no JSON content-type
        const uploadRes = await fetch(`${API_BASE_URL}/analyses/${analysis.id}/papers`, {
          method: 'POST',
          headers: uploadHeaders,
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to process paper '${file.name}'`);
        }
        const paperData = await uploadRes.json();
        uploadedPapers.push(paperData);
      }

      // 3. Initiate analysis run
      await fetch(`${API_BASE_URL}/analyses/${analysis.id}/run`, {
        method: 'POST',
        headers: authHeaders,
      });

      return formatResponse({
        ...analysis,
        papers: uploadedPapers,
      });
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Fetch stored claims and relationships results
   */
  async getAnalysisResults(analysisId) {
    try {
      if (USE_MOCK || analysisId === 'demo-analysis' || analysisId === 'demo') {
        const data = await mockAnalysisService.getAnalysisById(analysisId);
        return formatResponse(data);
      }
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}/results`, { headers });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return formatResponse(data);
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Export results as downloadable CSV
   */
  async exportAnalysisCsv(analysisId) {
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}/export`, { headers });
      if (!res.ok) throw new Error(`Failed to export analysis CSV: HTTP ${res.status}`);
      const blob = await res.blob();

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scitrace_analysis_${analysisId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return formatResponse({ downloaded: true });
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Delete analysis
   */
  async deleteAnalysis(analysisId) {
    try {
      if (USE_MOCK) {
        const data = await mockAnalysisService.deleteAnalysis(analysisId);
        return formatResponse(data);
      }
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Failed to delete analysis: HTTP ${res.status}`);
      return formatResponse({ id: analysisId, deleted: true });
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Retry failed analysis
   */
  async retryAnalysis(analysisId) {
    try {
      if (USE_MOCK) {
        const data = await mockAnalysisService.retryAnalysis(analysisId);
        return formatResponse(data);
      }
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/analyses/${analysisId}/run`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(`Failed to retry analysis: HTTP ${res.status}`);
      const data = await res.json();
      return formatResponse(data);
    } catch (err) {
      return formatError(err);
    }
  },

  /**
   * Update progress simulation
   */
  updateProgress(analysisId, progress, status) {
    return mockAnalysisService.updateProgress(analysisId, progress, status);
  }
};

export const api = analysisApi;
export const apiService = analysisApi;
export { supabaseDataService } from './supabaseDataService.js';
export default analysisApi;

