"""
Facade module forwarding to app.ai.similarity_service.
"""

from app.ai.similarity_service import (
    SemanticSimilarityService,
    CandidateClaimPair,
    similarity_service,
)

__all__ = [
    "SemanticSimilarityService",
    "CandidateClaimPair",
    "similarity_service",
]
