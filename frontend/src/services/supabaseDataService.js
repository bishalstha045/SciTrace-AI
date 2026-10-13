import { supabase } from '../lib/supabase.js';
import { demoAnalysis } from '../data/demoData.js';

/**
 * Supabase Data & Storage Service
 * Reuses the single Supabase client instance from src/lib/supabase.js.
 * Strictly respects Row Level Security (RLS) for authenticated user isolation.
 * Automatically keeps predefined demo data separate from user database records.
 */
export const supabaseDataService = {
  /**
   * Get currently authenticated user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  },

  /**
   * Fetch all analyses belonging to the current user
   */
  async getUserAnalyses() {
    const { data, error } = await supabase
      .from('analyses')
      .select('*, papers(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetch an analysis by ID with its papers, claims, and relationships.
   * If the ID is 'demo-analysis' or 'demo', returns static demo dataset immediately.
   */
  async getAnalysisById(analysisId) {
    // 1. Isolate demo dataset: never query user database for demo records
    if (analysisId === 'demo-analysis' || analysisId === 'demo') {
      return demoAnalysis;
    }

    // 2. Query user analysis (RLS ensures user can only read their own record)
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (analysisError) throw analysisError;

    // 3. Query papers
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('*')
      .eq('analysis_id', analysisId);

    if (papersError) throw papersError;

    // 4. Query claims for these papers
    const paperIds = (papers || []).map(p => p.id);
    let claims = [];
    if (paperIds.length > 0) {
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .in('paper_id', paperIds);

      if (claimsError) throw claimsError;
      claims = claimsData || [];
    }

    // 5. Query relationships for this analysis
    const { data: relationships, error: relsError } = await supabase
      .from('relationships')
      .select('*')
      .eq('analysis_id', analysisId);

    if (relsError) throw relsError;

    return {
      ...analysis,
      papers: papers || [],
      claims: claims || [],
      relationships: relationships || []
    };
  },

  /**
   * Insert a new user analysis
   */
  async createAnalysis({ title }) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User must be authenticated to create a persistent analysis.');

    const { data, error } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        title: title || 'Untitled Analysis',
        status: 'processing',
        progress: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Record a paper belonging to an analysis
   */
  async createPaper({ analysisId, filename, storagePath, fileSize, pageCount, authors, year }) {
    const { data, error } = await supabase
      .from('papers')
      .insert({
        analysis_id: analysisId,
        filename,
        storage_path: storagePath,
        file_size: fileSize || 0,
        page_count: pageCount || 0,
        processing_status: 'pending',
        authors: authors || [],
        year: year || new Date().getFullYear()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Upload PDF document to private Supabase Storage bucket 'papers'
   * Storage path format: {user_id}/{analysis_id}/{filename}
   */
  async uploadPaperPDF(analysisId, file) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User must be authenticated to upload PDF documents.');

    // Path enforced by Storage RLS: {user_id}/{analysis_id}/{filename}
    const storagePath = `${user.id}/${analysisId}/${file.name}`;

    const { data, error } = await supabase.storage
      .from('papers')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;
    return {
      storagePath: data.path,
      filename: file.name,
      fileSize: file.size
    };
  },

  /**
   * Download or create signed URL for private PDF paper
   */
  async getPaperDownloadUrl(storagePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from('papers')
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }
};
