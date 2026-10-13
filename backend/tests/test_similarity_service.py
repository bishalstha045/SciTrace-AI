from app.services.similarity_service import similarity_service


def test_similarity_single_pair():
    """Verify semantic similarity returns high score for related scientific findings and low for unrelated"""
    t1 = "Rising ocean temperatures directly accelerate coral bleaching severity."
    t2 = "Elevated sea surface temperatures significantly increase coral bleaching in tropical reefs."
    t3 = "Machine learning models optimize silicon semiconductor fabrication yields."

    sim_high = similarity_service.compute_similarity(t1, t2)
    sim_low = similarity_service.compute_similarity(t1, t3)

    assert sim_high > 0.70, f"Expected high similarity, got {sim_high}"
    assert sim_low < 0.40, f"Expected low similarity, got {sim_low}"
    assert 0.0 <= sim_high <= 1.0
    assert 0.0 <= sim_low <= 1.0


def test_find_candidate_pairs_cross_paper_filtering():
    """Verify that candidate pairs are strictly formed between DIFFERENT papers, never within the same paper"""
    claims = [
        {"id": "c1", "paper_id": "paper_A", "claim_text": "Ocean warming triggers coral reef bleaching.", "page_number": 2},
        {"id": "c2", "paper_id": "paper_A", "claim_text": "Coral bleaching is driven by thermal stress anomalies.", "page_number": 5},
        {"id": "c3", "paper_id": "paper_B", "claim_text": "Higher sea surface temperatures cause widespread coral bleaching.", "page_number": 8},
    ]

    pairs = similarity_service.find_candidate_pairs(claims, threshold=0.50)

    assert len(pairs) > 0
    for p in pairs:
        # Cross-paper invariant: source and target must belong to different papers
        assert p.source_claim["paper_id"] != p.target_claim["paper_id"]
        assert p.similarity_score >= 0.50


def test_find_candidate_pairs_edge_cases():
    """Verify edge cases: empty claims, single claim, single paper only"""
    # Empty claims
    assert similarity_service.find_candidate_pairs([]) == []

    # Single claim
    assert similarity_service.find_candidate_pairs([{"id": "c1", "paper_id": "p1", "claim_text": "Text"}]) == []

    # All claims from the same paper
    same_paper_claims = [
        {"id": "c1", "paper_id": "p1", "claim_text": "High temperature causes reef death."},
        {"id": "c2", "paper_id": "p1", "claim_text": "Thermal stress kills corals."},
    ]
    assert similarity_service.find_candidate_pairs(same_paper_claims) == []


def test_similarity_threshold_and_capping():
    """Verify configurable threshold and max pairs cap"""
    claims = [
        {"id": "c1", "paper_id": "p1", "claim_text": "Ocean acidification reduces shell formation in mollusks."},
        {"id": "c2", "paper_id": "p2", "claim_text": "Lower pH levels inhibit calcification in marine bivalves."},
        {"id": "c3", "paper_id": "p3", "claim_text": "Acidic marine environments impair mollusk shell growth."},
    ]

    # High threshold should filter strictly
    pairs_strict = similarity_service.find_candidate_pairs(claims, threshold=0.95)
    pairs_loose = similarity_service.find_candidate_pairs(claims, threshold=0.50)
    assert len(pairs_strict) <= len(pairs_loose)

    # Max pairs cap
    pairs_capped = similarity_service.find_candidate_pairs(claims, threshold=0.50, max_pairs=1)
    assert len(pairs_capped) <= 1
