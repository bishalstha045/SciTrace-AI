-- ==============================================================================
-- SciTrace AI — Database Schema Migration
-- Migration: 20261011_000001_create_scitrace_schema.sql
-- Description: Creates persistent analysis tables, relationships, claims,
--              storage bucket configuration, and Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Helper trigger function for automatic updated_at timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. Table: analyses
-- Represents a research analysis session owned by an authenticated user.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Analysis',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user queries and recency sorting
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

-- Trigger for analyses updated_at
DROP TRIGGER IF EXISTS trigger_analyses_updated_at ON public.analyses;
CREATE TRIGGER trigger_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. Table: papers
-- Represents research papers uploaded and linked to an analysis.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0 CHECK (file_size >= 0),
  page_count INTEGER DEFAULT 0 CHECK (page_count >= 0),
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  authors TEXT[] DEFAULT '{}',
  year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for finding papers by parent analysis
CREATE INDEX IF NOT EXISTS idx_papers_analysis_id ON public.papers(analysis_id);

-- Trigger for papers updated_at
DROP TRIGGER IF EXISTS trigger_papers_updated_at ON public.papers;
CREATE TRIGGER trigger_papers_updated_at
  BEFORE UPDATE ON public.papers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. Table: claims
-- Scientific statements extracted from research papers.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  page_number INTEGER NOT NULL CHECK (page_number > 0),
  source_evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for searching and filtering claims by paper and page
CREATE INDEX IF NOT EXISTS idx_claims_paper_id ON public.claims(paper_id);
CREATE INDEX IF NOT EXISTS idx_claims_page_number ON public.claims(page_number);

-- ==============================================================================
-- 5. Table: relationships
-- Semantic relationships and comparative findings between two claims.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  source_claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  target_claim_id UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  classification TEXT NOT NULL CHECK (classification IN ('supporting', 'contradiction', 'neutral', 'related')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  explanation TEXT,
  context_differences TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_different_claims CHECK (source_claim_id <> target_claim_id)
);

-- Indexes for querying relationships by analysis, claim, and classification
CREATE INDEX IF NOT EXISTS idx_relationships_analysis_id ON public.relationships(analysis_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source_claim ON public.relationships(source_claim_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_claim ON public.relationships(target_claim_id);
CREATE INDEX IF NOT EXISTS idx_relationships_classification ON public.relationships(classification);

-- ==============================================================================
-- 6. Storage Bucket Configuration for PDF Papers
-- Bucket: 'papers' (Private)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'papers',
  'papers',
  false,
  52428800, -- 50MB limit per file
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- ==============================================================================
-- 7. Row Level Security (RLS) Setup
-- Ensures users can only access their own analyses, papers, claims, relationships,
-- and uploaded storage files.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS Policies: analyses
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own analyses" ON public.analyses;
CREATE POLICY "Users can create own analyses"
  ON public.analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analyses" ON public.analyses;
CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;
CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- RLS Policies: papers
-- Access allowed if user owns the parent analysis.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view papers of own analyses" ON public.papers;
CREATE POLICY "Users can view papers of own analyses"
  ON public.papers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = papers.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert papers into own analyses" ON public.papers;
CREATE POLICY "Users can insert papers into own analyses"
  ON public.papers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = papers.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update papers in own analyses" ON public.papers;
CREATE POLICY "Users can update papers in own analyses"
  ON public.papers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = papers.analysis_id
        AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = papers.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete papers from own analyses" ON public.papers;
CREATE POLICY "Users can delete papers from own analyses"
  ON public.papers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = papers.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS Policies: claims
-- Access allowed if user owns the analysis containing the paper.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view claims of own papers" ON public.claims;
CREATE POLICY "Users can view claims of own papers"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.papers
      JOIN public.analyses ON analyses.id = papers.analysis_id
      WHERE papers.id = claims.paper_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert claims for own papers" ON public.claims;
CREATE POLICY "Users can insert claims for own papers"
  ON public.claims FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.papers
      JOIN public.analyses ON analyses.id = papers.analysis_id
      WHERE papers.id = claims.paper_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update claims of own papers" ON public.claims;
CREATE POLICY "Users can update claims of own papers"
  ON public.claims FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.papers
      JOIN public.analyses ON analyses.id = papers.analysis_id
      WHERE papers.id = claims.paper_id
        AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.papers
      JOIN public.analyses ON analyses.id = papers.analysis_id
      WHERE papers.id = claims.paper_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete claims of own papers" ON public.claims;
CREATE POLICY "Users can delete claims of own papers"
  ON public.claims FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.papers
      JOIN public.analyses ON analyses.id = papers.analysis_id
      WHERE papers.id = claims.paper_id
        AND analyses.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS Policies: relationships
-- Access allowed if user owns the parent analysis.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view relationships of own analyses" ON public.relationships;
CREATE POLICY "Users can view relationships of own analyses"
  ON public.relationships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = relationships.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert relationships into own analyses" ON public.relationships;
CREATE POLICY "Users can insert relationships into own analyses"
  ON public.relationships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = relationships.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update relationships in own analyses" ON public.relationships;
CREATE POLICY "Users can update relationships in own analyses"
  ON public.relationships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = relationships.analysis_id
        AND analyses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = relationships.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete relationships from own analyses" ON public.relationships;
CREATE POLICY "Users can delete relationships from own analyses"
  ON public.relationships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = relationships.analysis_id
        AND analyses.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- RLS Policies: Storage (storage.objects) for bucket 'papers'
-- Folder hierarchy: {user_id}/{analysis_id}/{filename}
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own uploaded papers" ON storage.objects;
CREATE POLICY "Users can read own uploaded papers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'papers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload papers to own folder" ON storage.objects;
CREATE POLICY "Users can upload papers to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'papers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own uploaded papers" ON storage.objects;
CREATE POLICY "Users can update own uploaded papers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'papers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'papers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own uploaded papers" ON storage.objects;
CREATE POLICY "Users can delete own uploaded papers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'papers' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
