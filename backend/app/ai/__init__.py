"""
SciTrace AI — AI Engine Package
Encapsulates:
- Stage 1: PDF Text Extraction (PyMuPDF)
- Stage 2: Scientific Claim Extraction (Linguistic heuristics & qualifiers)
- Stage 3: Semantic Similarity Matching (Sentence-Transformers all-MiniLM-L6-v2)
- Stage 4: NLI Relationship Classification (BART-large-MNLI)
- Stage 5: 6-Stage Contradiction Engine Orchestration
"""

from app.ai.pdf_service import (
    PDFService,
    PDFProcessingError,
    PDFValidationError,
    pdf_service,
)
from app.ai.claim_extractor import (
    ScientificClaimExtractor,
    ExtractedClaimData,
    ClaimExtractionResult,
    claim_extractor,
)
from app.ai.similarity_service import (
    SemanticSimilarityService,
    CandidateClaimPair,
    similarity_service,
)
from app.ai.nli_service import (
    NLIClassificationService,
    nli_service,
)
from app.ai.contradiction_engine import (
    ContradictionDetectionEngine,
    contradiction_engine,
)

__all__ = [
    "PDFService",
    "PDFProcessingError",
    "PDFValidationError",
    "pdf_service",
    "ScientificClaimExtractor",
    "ExtractedClaimData",
    "ClaimExtractionResult",
    "claim_extractor",
    "SemanticSimilarityService",
    "CandidateClaimPair",
    "similarity_service",
    "NLIClassificationService",
    "nli_service",
    "ContradictionDetectionEngine",
    "contradiction_engine",
]
