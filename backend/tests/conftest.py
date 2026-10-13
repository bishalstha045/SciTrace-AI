import os
from typing import List, Optional
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
import pymupdf as fitz
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient

# Ensure test environment before importing app
os.environ["ENVIRONMENT"] = "test"
os.environ["ALLOW_TEST_AUTH"] = "true"

from app.core.config import settings
settings.ENVIRONMENT = "test"
settings.ALLOW_TEST_AUTH = True

from app.main import app




@pytest.fixture
def client():
    """FastAPI TestClient fixture"""
    return TestClient(app)


@pytest.fixture
def user1_auth_header():
    """Auth header for simulated User 1"""
    return {"Authorization": "Bearer test-token-user-1"}


@pytest.fixture
def user2_auth_header():
    """Auth header for simulated User 2 (unauthorized cross-tenant)"""
    return {"Authorization": "Bearer test-token-user-2"}


@pytest.fixture
def create_sample_pdf():
    """Helper to generate a real, in-memory PDF with specified text and pages"""
    def _create(pages_text: Optional[List[str]] = None) -> bytes:
        if pages_text is None:
            pages_text = [
                "This is page one of our comparative scientific paper on marine ecosystems.",
                "This is page two detailing coral bleaching anomalies observed in Pacific waters.",
            ]
        doc = fitz.open()
        for text in pages_text:
            page = doc.new_page()
            page.insert_text((50, 72), text, fontsize=12)
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes

    return _create


@pytest.fixture
def create_scanned_pdf():
    """Helper to generate an image-only / scanned PDF with zero selectable text"""
    def _create() -> bytes:
        doc = fitz.open()
        page = doc.new_page()
        # Draw a rectangle without inserting any text
        page.draw_rect(fitz.Rect(100, 100, 300, 300), color=(0, 0, 1), fill=(0.9, 0.9, 0.9))
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes

    return _create
