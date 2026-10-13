"""
Facade module forwarding to app.ai.claim_extractor.
"""

from app.ai.claim_extractor import (
    ScientificClaimExtractor,
    ExtractedClaimData,
    ClaimExtractionResult,
    claim_extractor,
)

__all__ = [
    "ScientificClaimExtractor",
    "ExtractedClaimData",
    "ClaimExtractionResult",
    "claim_extractor",
]
