"""
Facade module forwarding to app.ai.nli_service.
"""

from app.ai.nli_service import (
    NLIClassificationService,
    nli_service,
)

__all__ = [
    "NLIClassificationService",
    "nli_service",
]
