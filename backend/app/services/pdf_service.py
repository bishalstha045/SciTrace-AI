"""
Facade module forwarding to app.ai.pdf_service.
"""

from app.ai.pdf_service import (
    PDFService,
    PDFProcessingError,
    PDFValidationError,
    pdf_service,
)

__all__ = [
    "PDFService",
    "PDFProcessingError",
    "PDFValidationError",
    "pdf_service",
]
