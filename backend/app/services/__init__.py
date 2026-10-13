"""
Services facade package.
Maintains backward compatibility by re-exporting modules from app.ai and app.db.
"""

from app.ai.pdf_service import pdf_service, PDFService, PDFProcessingError, PDFValidationError
from app.ai.claim_extractor import claim_extractor, ScientificClaimExtractor, ExtractedClaimData, ClaimExtractionResult
from app.ai.similarity_service import similarity_service, SemanticSimilarityService, CandidateClaimPair
from app.ai.nli_service import nli_service, NLIClassificationService
from app.ai.contradiction_engine import contradiction_engine, ContradictionDetectionEngine
from app.db.supabase_service import (
    supabase_service,
    SupabaseService,
    get_supabase_client,
    DEMO_ANALYSIS,
)

# Compatibility alias
SupabaseDataService = SupabaseService

__all__ = [
    "pdf_service",
    "PDFService",
    "PDFProcessingError",
    "PDFValidationError",
    "claim_extractor",
    "ScientificClaimExtractor",
    "ExtractedClaimData",
    "ClaimExtractionResult",
    "similarity_service",
    "SemanticSimilarityService",
    "CandidateClaimPair",
    "nli_service",
    "NLIClassificationService",
    "contradiction_engine",
    "ContradictionDetectionEngine",
    "supabase_service",
    "SupabaseService",
    "SupabaseDataService",
    "get_supabase_client",
    "DEMO_ANALYSIS",
]
