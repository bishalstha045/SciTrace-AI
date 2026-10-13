-- ==============================================================================
-- SciTrace AI — Row Level Security (RLS) Verification Script
-- File: supabase/verify_rls.sql
-- Description: Run this in the Supabase SQL Editor to test and confirm that
--              RLS policies correctly isolate user analyses, papers, claims,
--              and relationships.
-- ==============================================================================

DO $$
DECLARE
  v_user_a UUID := gen_random_uuid();
  v_user_b UUID := gen_random_uuid();
  v_analysis_id UUID;
  v_paper_id UUID;
  v_claim_1 UUID;
  v_claim_2 UUID;
  v_rel_id UUID;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE '1. Verifying RLS Enabled on Tables';
  RAISE NOTICE '==================================================';

  -- Check RLS status
  SELECT count(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('analyses', 'papers', 'claims', 'relationships')
    AND rowsecurity = true;

  IF v_count <> 4 THEN
    RAISE EXCEPTION 'RLS is not enabled on all 4 tables! (Found % of 4)', v_count;
  END IF;
  RAISE NOTICE '✔ Confirmed: RLS is active on analyses, papers, claims, and relationships.';

  RAISE NOTICE '==================================================';
  RAISE NOTICE '2. Simulating User A: Inserting and Reading Data';
  RAISE NOTICE '==================================================';

  -- Simulate session for User A
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Insert analysis as User A
  INSERT INTO public.analyses (id, user_id, title, status, progress)
  VALUES (gen_random_uuid(), v_user_a, 'User A Medical Study', 'completed', 100)
  RETURNING id INTO v_analysis_id;

  -- Insert paper as User A
  INSERT INTO public.papers (id, analysis_id, filename, storage_path, page_count)
  VALUES (gen_random_uuid(), v_analysis_id, 'paper_a1.pdf', v_user_a::text || '/' || v_analysis_id::text || '/paper_a1.pdf', 12)
  RETURNING id INTO v_paper_id;

  -- Insert claims as User A
  INSERT INTO public.claims (id, paper_id, claim_text, page_number)
  VALUES (gen_random_uuid(), v_paper_id, 'Method X increases accuracy by 15%', 4)
  RETURNING id INTO v_claim_1;

  INSERT INTO public.claims (id, paper_id, claim_text, page_number)
  VALUES (gen_random_uuid(), v_paper_id, 'Method X requires 20% more computation', 8)
  RETURNING id INTO v_claim_2;

  -- Insert relationship as User A
  INSERT INTO public.relationships (id, analysis_id, source_claim_id, target_claim_id, classification, confidence_score)
  VALUES (gen_random_uuid(), v_analysis_id, v_claim_1, v_claim_2, 'supporting', 88)
  RETURNING id INTO v_rel_id;

  -- Verify User A can read own analysis
  SELECT count(*) INTO v_count FROM public.analyses WHERE id = v_analysis_id;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAILED: User A could not read their own analysis!';
  END IF;

  SELECT count(*) INTO v_count FROM public.papers WHERE id = v_paper_id;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'FAILED: User A could not read their own paper!';
  END IF;
  RAISE NOTICE '✔ Confirmed: User A successfully created and read their analysis and paper.';

  RAISE NOTICE '==================================================';
  RAISE NOTICE '3. Simulating User B: Attempting Unauthorized Access';
  RAISE NOTICE '==================================================';

  -- Switch context to User B
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- User B queries User A's analysis
  SELECT count(*) INTO v_count FROM public.analyses WHERE id = v_analysis_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: User B was able to view User A analysis!';
  END IF;

  -- User B queries User A's papers
  SELECT count(*) INTO v_count FROM public.papers WHERE id = v_paper_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: User B was able to view User A paper!';
  END IF;

  -- User B queries User A's claims
  SELECT count(*) INTO v_count FROM public.claims WHERE id = v_claim_1;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: User B was able to view User A claim!';
  END IF;

  -- User B queries User A's relationships
  SELECT count(*) INTO v_count FROM public.relationships WHERE id = v_rel_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: User B was able to view User A relationship!';
  END IF;
  RAISE NOTICE '✔ Confirmed: User B is completely blocked from viewing User A data (0 rows returned).';

  -- User B attempts to delete User A's analysis
  DELETE FROM public.analyses WHERE id = v_analysis_id;
  -- Switch back to User A to ensure record was NOT deleted
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  SELECT count(*) INTO v_count FROM public.analyses WHERE id = v_analysis_id;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'SECURITY BREACH: User B delete succeeded on User A data!';
  END IF;
  RAISE NOTICE '✔ Confirmed: Unauthorized deletes by other users are prevented.';

  RAISE NOTICE '==================================================';
  RAISE NOTICE '4. Simulating Anonymous (Unauthenticated) Request';
  RAISE NOTICE '==================================================';

  -- Switch context to anon
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);

  SELECT count(*) INTO v_count FROM public.analyses;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: Anonymous user saw analyses!';
  END IF;

  SELECT count(*) INTO v_count FROM public.papers;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: Anonymous user saw papers!';
  END IF;
  RAISE NOTICE '✔ Confirmed: Anonymous requests return 0 records.';

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'ALL RLS AND ISOLATION VERIFICATIONS PASSED!';
  RAISE NOTICE '==================================================';

  -- Clean up test records (using service role bypass in current session)
  DELETE FROM public.analyses WHERE id = v_analysis_id;
END $$;
