from typing import List
import pymupdf as fitz
from app.core.config import settings
from app.models.schemas import PDFExtractionResult, PDFPageText


class PDFProcessingError(Exception):
    """Base exception for PDF processing issues"""
    pass


class PDFValidationError(PDFProcessingError):
    """Exception raised when PDF validation fails"""
    pass


class PDFService:
    """
    Production-ready PDF text extractor and validator using PyMuPDF (fitz).
    Enforces magic byte verification, page-by-page text extraction,
    and graceful handling of scanned or encrypted documents.
    """

    @staticmethod
    def validate_pdf_bytes(content: bytes, filename: str = "document.pdf") -> fitz.Document:
        """
        Validate file content using magic bytes, size limits, and structural integrity.
        Returns opened fitz.Document on success.
        """
        # 1. Size Validation
        if not content or len(content) == 0:
            raise PDFValidationError(f"File '{filename}' is empty (0 bytes).")

        if len(content) > settings.MAX_FILE_SIZE_BYTES:
            max_mb = settings.MAX_FILE_SIZE_BYTES / (1024 * 1024)
            raise PDFValidationError(
                f"File '{filename}' exceeds maximum allowed size of {max_mb:.0f} MB."
            )

        # 2. Magic Bytes Validation (Never trust filename or Content-Type header alone)
        # Standard PDF starts with %PDF- (hex: 25 50 44 46 2d)
        if not (content.startswith(b"%PDF") or b"%PDF-" in content[:1024]):
            raise PDFValidationError(
                f"File '{filename}' is not a valid PDF document. Invalid magic bytes header."
            )

        # 3. Document Structure Validation
        try:
            doc = fitz.open(stream=content, filetype="pdf")
        except Exception as e:
            raise PDFValidationError(
                f"File '{filename}' is corrupted or not a readable PDF: {str(e)}"
            )

        # 4. Encryption Check
        if doc.is_encrypted:
            doc.close()
            raise PDFValidationError(
                f"File '{filename}' is encrypted or password-protected. Please supply an unprotected PDF."
            )

        # 5. Page Count Check
        if doc.page_count == 0:
            doc.close()
            raise PDFValidationError(f"File '{filename}' contains 0 pages.")

        return doc

    @classmethod
    def extract_text(cls, content: bytes, filename: str = "document.pdf") -> PDFExtractionResult:
        """
        Extract readable text from PDF page by page using PyMuPDF.
        Preserves 1-indexed page numbers, computes character/word counts,
        and detects scanned/image-only PDFs honestly.
        """
        doc = cls.validate_pdf_bytes(content, filename)

        pages: List[PDFPageText] = []
        total_characters = 0

        try:
            for page in doc:
                page_num = (page.number if page.number is not None else 0) + 1  # 1-indexed page number
                raw_extracted = page.get_text("text")
                text = str(raw_extracted).strip() if raw_extracted else ""
                char_count = len(text)
                word_count = len(text.split()) if text else 0

                total_characters += char_count

                pages.append(
                    PDFPageText(
                        page_number=page_num,
                        text=text,
                        char_count=char_count,
                        word_count=word_count,
                    )
                )

            # Detect Scanned / Image-only PDF
            # If document has pages but total extracted text is negligible (< 20 chars),
            # it is almost certainly a scanned image PDF without selectable text.
            is_scanned = doc.page_count > 0 and total_characters < 20
            warning = None
            if is_scanned:
                warning = (
                    "Scanned or image-only PDF detected (insufficient embedded text). "
                    "Optical Character Recognition (OCR) is not yet implemented."
                )

            return PDFExtractionResult(
                filename=filename,
                page_count=doc.page_count,
                total_characters=total_characters,
                is_scanned=is_scanned,
                warning=warning,
                pages=pages,
            )
        finally:
            doc.close()


pdf_service = PDFService()
