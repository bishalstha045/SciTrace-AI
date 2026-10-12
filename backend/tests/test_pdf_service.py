import pytest
from app.services.pdf_service import pdf_service, PDFValidationError


def test_extract_valid_pdf_text(create_sample_pdf):
    """Verify PyMuPDF extracts text per page preserving 1-indexed numbers and counts"""
    pages_text = [
        "First scientific finding regarding sea temperatures.",
        "Second page evidence regarding ocean acidification.",
    ]
    pdf_bytes = create_sample_pdf(pages_text)

    result = pdf_service.extract_text(pdf_bytes, filename="marine_study.pdf")
    assert result.filename == "marine_study.pdf"
    assert result.page_count == 2
    assert result.is_scanned is False
    assert result.warning is None
    assert len(result.pages) == 2

    # Check page 1
    assert result.pages[0].page_number == 1
    assert "sea temperatures" in result.pages[0].text
    assert result.pages[0].char_count > 0
    assert result.pages[0].word_count > 0

    # Check page 2
    assert result.pages[1].page_number == 2
    assert "ocean acidification" in result.pages[1].text


def test_reject_invalid_magic_bytes():
    """Verify file without %PDF magic bytes header is rejected"""
    fake_pdf = b"Plain text file pretending to be a PDF"
    with pytest.raises(PDFValidationError) as exc:
        pdf_service.extract_text(fake_pdf, filename="fake.pdf")
    assert "Invalid magic bytes" in str(exc.value)


def test_reject_empty_pdf():
    """Verify empty 0-byte file is rejected"""
    with pytest.raises(PDFValidationError) as exc:
        pdf_service.extract_text(b"", filename="empty.pdf")
    assert "empty" in str(exc.value).lower()


def test_detect_scanned_image_only_pdf(create_scanned_pdf):
    """Verify image-only PDF without embedded text is flagged as scanned with honest warning"""
    scanned_bytes = create_scanned_pdf()
    result = pdf_service.extract_text(scanned_bytes, filename="scanned_paper.pdf")
    assert result.page_count == 1
    assert result.is_scanned is True
    assert result.warning is not None
    assert "OCR" in result.warning


def test_corrupted_pdf_handling():
    """Verify corrupted PDF bytes trigger clear validation error"""
    corrupt_bytes = b"%PDF-1.4\nCorrupted stream data with no valid trailer %%EOF"
    with pytest.raises(PDFValidationError) as exc:
        pdf_service.extract_text(corrupt_bytes, filename="corrupt.pdf")
    assert "corrupted" in str(exc.value).lower() or "not a readable" in str(exc.value).lower()
