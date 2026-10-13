import logging
import traceback
from typing import Any, Dict, List

from app.core.config import settings
from app.services.claim_extractor import claim_extractor
from app.services.nli_service import nli_service
from app.services.pdf_service import pdf_service
from app.services.similarity_service import similarity_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger("scitrace.contradiction_engine")


class ContradictionDetectionEngine:
    """
    Step 5 AI Contradiction Detection Engine.
    Executes the multi-stage scientific evidence pipeline:
    1. Text extraction from uploaded research PDFs via PyMuPDF.
    2. Rhetorical and empirical claim extraction.
    3. Cross-paper semantic similarity embedding & pair filtering (all-MiniLM-L6-v2).
    4. NLI premise-hypothesis relationship classification (BART-large-MNLI).
    5. Traceable evidence provenance persistence and status tracking.
    """

    def __init__(self):
        self.similarity_service = similarity_service
        self.nli_service = nli_service

    def run_pipeline(self, analysis_id: str, user_id: str) -> Dict[str, Any]:
        """
        Synchronous / background worker pipeline executor.
        Enforces user ownership and updates analysis progress idempotently.
        """
        try:
            # 1. Fetch analysis and verify ownership
            analysis = supabase_service.get_analysis(analysis_id, user_id)
            papers = analysis.get("papers", [])

            if not papers:
                supabase_service.update_analysis_status(
                    analysis_id=analysis_id,
                    user_id=user_id,
                    status_val="failed",
                    progress_val=0,
                )
                return {
                    "status": "failed",
                    "error": "No papers attached to analysis.",
                    "relationships": [],
                }

            # Update progress: starting text extraction
            supabase_service.update_analysis_status(
                analysis_id=analysis_id,
                user_id=user_id,
                status_val="processing",
                progress_val=15,
            )

            # 2. Extract text and claims for each paper if not already present
            all_claims: List[Dict[str, Any]] = []

            for p in papers:
                p_id = str(p["id"])
                is_scanned = bool(p.get("is_scanned", False))
                filename = p.get("filename", "document.pdf")

                # Check if pages are cached
                pages = supabase_service.get_paper_pages(p_id) or []
                if not pages:
                    pdf_bytes = supabase_service.get_paper_bytes(p_id)
                    if pdf_bytes:
                        try:
                            extraction = pdf_service.extract_text(pdf_bytes, filename)
                            pages = [pg.model_dump() for pg in extraction.pages]
                            supabase_service.store_paper_pages(p_id, pages)
                            if extraction.is_scanned:
                                is_scanned = True
                        except Exception as e:
                            logger.warning(f"PDF extraction error for paper {p_id}: {e}")

                if is_scanned:
                    continue

                # Check or extract claims
                existing_claims = supabase_service.get_claims_by_paper(analysis_id, p_id, user_id)
                if not existing_claims and pages:
                    extracted = claim_extractor.extract_claims_from_pages(analysis_id, p_id, pages)
                    saved = supabase_service.save_claims(analysis_id, p_id, extracted)
                    all_claims.extend(saved)
                else:
                    all_claims.extend(existing_claims)

            # Update progress: claims extracted
            supabase_service.update_analysis_status(
                analysis_id=analysis_id,
                user_id=user_id,
                status_val="processing",
                progress_val=40,
            )

            # 3. Cross-paper check: need claims from at least 2 papers for contradictions
            distinct_papers_with_claims = {str(c.get("paper_id")) for c in all_claims if c.get("paper_id")}
            if len(distinct_papers_with_claims) < 2:
                # Save empty relationships, mark completed with honest status
                supabase_service.save_relationships(analysis_id, [])
                supabase_service.update_analysis_status(
                    analysis_id=analysis_id,
                    user_id=user_id,
                    status_val="completed",
                    progress_val=100,
                )
                msg = (
                    f"Analysis completed: {len(all_claims)} scientific claims extracted. "
                    "Cross-paper contradiction analysis requires claims from at least 2 distinct papers."
                )
                return {
                    "status": "completed",
                    "progress": 100,
                    "message": msg,
                    "relationships": [],
                }

            # 4. Stage 3: Semantic similarity matching
            supabase_service.update_analysis_status(
                analysis_id=analysis_id,
                user_id=user_id,
                status_val="processing",
                progress_val=60,
            )

            candidate_pairs = self.similarity_service.find_candidate_pairs(
                claims=all_claims,
                threshold=settings.SIMILARITY_THRESHOLD,
                max_pairs=settings.MAX_CANDIDATE_PAIRS_PER_ANALYSIS,
            )

            if not candidate_pairs:
                supabase_service.save_relationships(analysis_id, [])
                supabase_service.update_analysis_status(
                    analysis_id=analysis_id,
                    user_id=user_id,
                    status_val="completed",
                    progress_val=100,
                )
                msg = (
                    f"Analyzed {len(all_claims)} claims across {len(distinct_papers_with_claims)} papers. "
                    f"No cross-paper claims met the semantic similarity threshold ({settings.SIMILARITY_THRESHOLD:.0%})."
                )
                return {
                    "status": "completed",
                    "progress": 100,
                    "message": msg,
                    "relationships": [],
                }

            # 5. Stage 4: NLI Relationship Classification
            supabase_service.update_analysis_status(
                analysis_id=analysis_id,
                user_id=user_id,
                status_val="processing",
                progress_val=75,
            )

            relationships: List[Dict[str, Any]] = []
            total_pairs = len(candidate_pairs)

            for idx, pair in enumerate(candidate_pairs):
                rel = self.nli_service.classify_claim_pair(
                    analysis_id=analysis_id,
                    source_claim=pair.source_claim,
                    target_claim=pair.target_claim,
                    similarity_score=pair.similarity_score,
                )
                relationships.append(rel)

                # Progressively update progress from 75 to 95
                if total_pairs > 0 and (idx + 1) % max(1, total_pairs // 5) == 0:
                    current_prog = 75 + int(((idx + 1) / total_pairs) * 20)
                    supabase_service.update_analysis_status(
                        analysis_id=analysis_id,
                        user_id=user_id,
                        status_val="processing",
                        progress_val=min(current_prog, 95),
                    )

            # 6. Save relationships and complete analysis
            saved_rels = supabase_service.save_relationships(analysis_id, relationships)

            supabase_service.update_analysis_status(
                analysis_id=analysis_id,
                user_id=user_id,
                status_val="completed",
                progress_val=100,
            )

            return {
                "status": "completed",
                "progress": 100,
                "message": f"Successfully identified {len(saved_rels)} relationships across {len(papers)} papers.",
                "relationships": saved_rels,
            }

        except Exception as e:
            logger.error(f"Error in contradiction engine for analysis {analysis_id}: {e}\n{traceback.format_exc()}")
            supabase_service.update_analysis_status(
                analysis_id=analysis_id,
                user_id=user_id,
                status_val="failed",
                progress_val=100,
            )
            return {
                "status": "failed",
                "error": str(e),
                "relationships": [],
            }


# Singleton instance
contradiction_engine = ContradictionDetectionEngine()
