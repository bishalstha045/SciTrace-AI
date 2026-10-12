import pytest
from app.services.nli_service import NLIClassificationService, nli_service


def test_nli_dynamic_label_indices():
    """Verify that model label indices are retrieved dynamically from model.config instead of assumed"""
    indices = nli_service.label_indices
    assert "contradiction" in indices
    assert "neutral" in indices
    assert "entailment" in indices
    # Unique indices
    assert len(set(indices.values())) == 3


def test_nli_contradiction_detection():
    """Verify that directly opposing scientific assertions are classified as contradiction with high confidence"""
    claim_a = {
        "id": "c1",
        "paper_id": "p1",
        "claim_text": "Rising ocean temperatures directly accelerate coral bleaching severity across tropical reefs.",
        "page_number": 4,
    }
    claim_b = {
        "id": "c2",
        "paper_id": "p2",
        "claim_text": "Elevated sea surface temperatures do not increase coral bleaching severity in tropical reefs.",
        "page_number": 9,
    }

    result = nli_service.classify_claim_pair(
        analysis_id="test-analysis",
        source_claim=claim_a,
        target_claim=claim_b,
        similarity_score=0.88,
    )

    assert result["classification"] == "contradiction"
    assert result["confidence_score"] >= 80
    assert result["nli_scores"]["contradiction"] > result["nli_scores"]["entailment"]
    assert "source_claim_text" in result
    assert "target_claim_text" in result
    assert "source_page_number" in result
    assert "target_page_number" in result
    assert "similarity_score" in result
    assert "model_metadata" in result


def test_nli_supporting_detection():
    """Verify that corroborating scientific claims are classified as supporting"""
    claim_a = {
        "id": "c1",
        "paper_id": "p1",
        "claim_text": "Rising ocean temperatures directly accelerate coral bleaching severity across tropical reefs.",
        "page_number": 4,
    }
    claim_c = {
        "id": "c3",
        "paper_id": "p3",
        "claim_text": "Higher sea surface temperatures strongly correlate with accelerated coral reef bleaching events.",
        "page_number": 2,
    }

    result = nli_service.classify_claim_pair(
        analysis_id="test-analysis",
        source_claim=claim_a,
        target_claim=claim_c,
        similarity_score=0.91,
    )

    assert result["classification"] == "supporting"
    assert result["confidence_score"] >= 70
    assert result["nli_scores"]["entailment"] > result["nli_scores"]["contradiction"]


def test_nli_neutral_handling():
    """Verify that distinct or unrelated claims result in neutral classification without hallucinating conflict"""
    claim_a = {
        "id": "c1",
        "paper_id": "p1",
        "claim_text": "Rising ocean temperatures directly accelerate coral bleaching severity across tropical reefs.",
        "page_number": 4,
    }
    claim_d = {
        "id": "c4",
        "paper_id": "p4",
        "claim_text": "Deep sea hydrothermal vent plumes contain chemotrophic sulfur-oxidizing microbial communities.",
        "page_number": 12,
    }

    result = nli_service.classify_claim_pair(
        analysis_id="test-analysis",
        source_claim=claim_a,
        target_claim=claim_d,
        similarity_score=0.25,
    )

    assert result["classification"] == "neutral"


def test_nli_empty_or_malformed_input():
    """Verify that empty claims are handled gracefully without raising exceptions"""
    result = nli_service.classify_claim_pair(
        analysis_id="test-analysis",
        source_claim={"id": "c1", "paper_id": "p1", "claim_text": ""},
        target_claim={"id": "c2", "paper_id": "p2", "claim_text": ""},
        similarity_score=0.0,
    )
    assert result["classification"] == "neutral"
    assert result["confidence_score"] == 50
