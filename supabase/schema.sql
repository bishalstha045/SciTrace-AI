-- ==============================================================================
-- SciTrace AI Complete Fixed Database Schema
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- Idempotent: safe to re-run
-- ==============================================================================

-- 1. Automatic Timestamp Update Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Analyses Table
CREATE TABLE IF NOT EXISTS public.analyses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL DEFAULT 'Untitled Analysis',
  status      TEXT        NOT NULL DEFAULT 'processing'
                          CHECK (status IN ('processing', 'completed', 'failed')),
  progress    INTEGER     NOT NULL DEFAULT 0
                          CHECK (progress >= 0 AND progress <= 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id    ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);

DROP TRIGGER IF EXISTS trigger_analyses_updated_at ON public.analyses;
CREATE TRIGGER trigger_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Papers Table (includes is_scanned)
CREATE TABLE IF NOT EXISTS public.papers (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id       UUID        NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  filename          TEXT        NOT NULL,
  storage_path      TEXT        NOT NULL DEFAULT '',
  file_size         BIGINT      DEFAULT 0 CHECK (file_size >= 0),
  page_count        INTEGER     DEFAULT 0 CHECK (page_count >= 0),
  processing_status TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  authors           TEXT[]      DEFAULT '{}',
  year              INTEGER,
  is_scanned        BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_papers_analysis_id ON public.papers(analysis_id);

DROP TRIGGER IF EXISTS trigger_papers_updated_at ON public.papers;
CREATE TRIGGER trigger_papers_updated_at
  BEFORE UPDATE ON public.papers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Claims Table
CREATE TABLE IF NOT EXISTS public.claims (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id       UUID        REFERENCES public.analyses(id) ON DELETE CASCADE,
  paper_id          UUID        NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  claim_text        TEXT        NOT NULL,
  normalized_text   TEXT,
  page_number       INTEGER     NOT NULL DEFAULT 1 CHECK (page_number > 0),
  section_name      TEXT,
  source_evidence   TEXT,
  confidence_score  INTEGER     DEFAULT 75 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  extraction_method TEXT        DEFAULT 'scientific_heuristic_v1',
  has_negation      BOOLEAN     DEFAULT false,
  has_qualifier     BOOLEAN     DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_paper_id    ON public.claims(paper_id);
CREATE INDEX IF NOT EXISTS idx_claims_analysis_id ON public.claims(analysis_id);
CREATE INDEX IF NOT EXISTS idx_claims_page_number ON public.claims(page_number);

-- 5. Relationships Table (includes source/target paper/claim text cols)
CREATE TABLE IF NOT EXISTS public.relationships (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id         UUID        NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  source_claim_id     UUID        NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  target_claim_id     UUID        NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  source_paper_id     UUID        REFERENCES public.papers(id) ON DELETE SET NULL,
  target_paper_id     UUID        REFERENCES public.papers(id) ON DELETE SET NULL,
  classification      TEXT        NOT NULL
                                  CHECK (classification IN ('supporting', 'contradiction', 'neutral', 'related')),
  confidence_score    INTEGER     NOT NULL DEFAULT 50
                                  CHECK (confidence_score >= 0 AND confidence_score <= 100),
  explanation         TEXT,
  context_differences TEXT[]      DEFAULT '{}',
  source_claim_text   TEXT,
  target_claim_text   TEXT,
  source_page_number  INTEGER,
  target_page_number  INTEGER,
  similarity_score    DOUBLE PRECISION,
  nli_scores          JSONB,
  model_metadata      JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_different_claims CHECK (source_claim_id <> target_claim_id)
);

CREATE INDEX IF NOT EXISTS idx_relationships_analysis_id    ON public.relationships(analysis_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source_claim   ON public.relationships(source_claim_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_claim   ON public.relationships(target_claim_id);
CREATE INDEX IF NOT EXISTS idx_relationships_classification ON public.relationships(classification);

-- 6. Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'papers', 'papers', false, 52428800, ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public             = false,
  file_size_limit    = 52428800,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- 7. Enable Row Level Security
ALTER TABLE public.analyses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Service-role bypass policies (allows Python backend with service_role key to bypass RLS)
DROP POLICY IF EXISTS "Service role bypass analyses"      ON public.analyses;
CREATE POLICY "Service role bypass analyses" ON public.analyses
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass papers"        ON public.papers;
CREATE POLICY "Service role bypass papers" ON public.papers
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass claims"        ON public.claims;
CREATE POLICY "Service role bypass claims" ON public.claims
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass relationships" ON public.relationships;
CREATE POLICY "Service role bypass relationships" ON public.relationships
  TO service_role USING (true) WITH CHECK (true);

-- User-level policies
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
CREATE POLICY "Users can view own analyses" ON public.analyses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own analyses" ON public.analyses;
CREATE POLICY "Users can create own analyses" ON public.analyses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analyses" ON public.analyses;
CREATE POLICY "Users can update own analyses" ON public.analyses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;
CREATE POLICY "Users can delete own analyses" ON public.analyses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view papers of own analyses" ON public.papers;
CREATE POLICY "Users can view papers of own analyses" ON public.papers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = papers.analysis_id AND analyses.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert papers into own analyses" ON public.papers;
CREATE POLICY "Users can insert papers into own analyses" ON public.papers
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = papers.analysis_id AND analyses.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update papers in own analyses" ON public.papers;
CREATE POLICY "Users can update papers in own analyses" ON public.papers
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = papers.analysis_id AND analyses.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete papers from own analyses" ON public.papers;
CREATE POLICY "Users can delete papers from own analyses" ON public.papers
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = papers.analysis_id AND analyses.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view claims of own papers" ON public.claims;
CREATE POLICY "Users can view claims of own papers" ON public.claims
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.papers JOIN public.analyses ON analyses.id = papers.analysis_id
    WHERE papers.id = claims.paper_id AND analyses.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert claims for own papers" ON public.claims;
CREATE POLICY "Users can insert claims for own papers" ON public.claims
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.papers JOIN public.analyses ON analyses.id = papers.analysis_id
    WHERE papers.id = claims.paper_id AND analyses.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete claims of own papers" ON public.claims;
CREATE POLICY "Users can delete claims of own papers" ON public.claims
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.papers JOIN public.analyses ON analyses.id = papers.analysis_id
    WHERE papers.id = claims.paper_id AND analyses.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view relationships of own analyses" ON public.relationships;
CREATE POLICY "Users can view relationships of own analyses" ON public.relationships
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = relationships.analysis_id AND analyses.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert relationships into own analyses" ON public.relationships;
CREATE POLICY "Users can insert relationships into own analyses" ON public.relationships
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = relationships.analysis_id AND analyses.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete relationships from own analyses" ON public.relationships;
CREATE POLICY "Users can delete relationships from own analyses" ON public.relationships
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.analyses WHERE analyses.id = relationships.analysis_id AND analyses.user_id = auth.uid()));

-- 8. Storage Policies
DROP POLICY IF EXISTS "Users can read own uploaded papers" ON storage.objects;
CREATE POLICY "Users can read own uploaded papers" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload papers to own folder" ON storage.objects;
CREATE POLICY "Users can upload papers to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Service role can manage storage" ON storage.objects;
CREATE POLICY "Service role can manage storage" ON storage.objects
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own uploaded papers" ON storage.objects;
CREATE POLICY "Users can delete own uploaded papers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'papers' AND auth.uid()::text = (storage.foldername(name))[1]);
