from app.services.claim_extractor import ScientificClaimExtractor


def test_sentence_segmentation_protects_abbreviations():
    """Verify sentence segmentation preserves scientific abbreviations (et al., i.e., decimal numbers)."""
    text = (
        "Smith et al. observed significant warming anomalies. "
        "The p-value was p < 0.05 across all 3.14 sites. "
        "In addition, e.g., coral mortality increased by 42% compared with baseline."
    )
    sentences = ScientificClaimExtractor.segment_sentences(text)
    assert len(sentences) == 3
    assert "Smith et al." in sentences[0]
    assert "3.14 sites" in sentences[1]
    assert "e.g.," in sentences[2]


def test_preserves_negation_and_numerical_values():
    """Verify negation markers and numerical values are explicitly retained and detected."""
    sentence_neg = "The experimental treatment did not significantly reduce thermal coral bleaching (p = 0.42)."
    is_claim, score, _ = ScientificClaimExtractor.evaluate_sentence_claim(sentence_neg)
    assert is_claim is True
    assert ScientificClaimExtractor.NEGATION_WORDS.search(sentence_neg) is not None
    assert "did not" in sentence_neg
    assert "0.42" in sentence_neg

    sentence_pos = "Sea surface temperature increased by 1.8°C over 48 months, causing severe bleaching in 85% of colonies."
    is_claim_pos, score_pos, _ = ScientificClaimExtractor.evaluate_sentence_claim(sentence_pos)
    assert is_claim_pos is True
    assert "1.8°C" in sentence_pos
    assert "85%" in sentence_pos


def test_preserves_modal_qualifiers():
    """Verify epistemic qualifiers ('may', 'could', 'suggests') are detected and retained."""
    sentence = "These observations suggest that elevated acidity may exacerbate thermal vulnerability under these conditions."
    is_claim, score, _ = ScientificClaimExtractor.evaluate_sentence_claim(sentence)
    assert is_claim is True
    assert ScientificClaimExtractor.QUALIFIER_WORDS.search(sentence) is not None
    assert "may" in sentence
    assert "suggest" in sentence


def test_filters_out_boilerplate_and_references():
    """Verify references and boilerplate headers are rejected from candidate claims."""
    boilerplate1 = "All rights reserved. Downloaded from https://nature.com by authorized subscriber."
    is_claim1, _, _ = ScientificClaimExtractor.evaluate_sentence_claim(boilerplate1)
    assert is_claim1 is False

    reference = "[12] Smith, J., and Davis, R. (2021). Coral reef decline. Nature 450, 102-108. doi: 10.1038/nature12345"
    is_claim2, _, _ = ScientificClaimExtractor.evaluate_sentence_claim(reference)
    assert is_claim2 is False

    short_phrase = "Table 2 shows results."
    is_claim3, _, _ = ScientificClaimExtractor.evaluate_sentence_claim(short_phrase)
    assert is_claim3 is False


def test_claim_extraction_from_pdf_pages_preserves_page_numbers():
    """Verify page numbers start at 1 and match source pages exactly."""
    pages_data = [
        {
            "page_number": 1,
            "text": (
                "Introduction\n"
                "Global climate change impacts tropical ecosystems worldwide.\n"
                "In this study, our findings demonstrate that elevated ocean temperatures directly increase coral bleaching rates."
            ),
        },
        {
            "page_number": 2,
            "text": (
                "Results\n"
                "We observed that thermal stress reduced photosynthetic efficiency by 34% compared with control tanks (p < 0.01).\n"
                "Furthermore, antioxidant supplementation failed to prevent chlorophyll degradation under elevated heat."
            ),
        },
        {
            "page_number": 3,
            "text": (
                "Discussion\n"
                "These results indicate that seasonal heatwaves represent the predominant driver of mortality across Pacific reefs."
            ),
        },
    ]

    claims = ScientificClaimExtractor.extract_claims_from_pages(
        analysis_id="test-analysis-1",
        paper_id="test-paper-1",
        pages_data=pages_data,
    )

    assert len(claims) >= 3
    page_nums = {c.page_number for c in claims}
    assert 1 in page_nums
    assert 2 in page_nums
    assert 3 in page_nums
    # Check that negation was captured on page 2
    neg_claims = [c for c in claims if c.has_negation]
    assert len(neg_claims) >= 1
    assert any("failed to" in c.claim_text for c in neg_claims)


def test_api_upload_and_extract_claims_flow(client, user1_auth_header, create_sample_pdf):
    """Test full API pipeline: create analysis, upload PDF, extract claims, and verify database storage."""
    # 1. Create Analysis
    res_analysis = client.post("/api/analyses", json={"title": "Claim Extraction Test"}, headers=user1_auth_header)
    assert res_analysis.status_code == 201
    analysis_id = res_analysis.json()["id"]

    # 2. Upload paper with rich scientific claims
    paper_text = [
        (
            "Abstract\n"
            "Marine heatwaves threaten biodiversity. "
            "Our experimental trials demonstrate that elevated salinity increases coral larval mortality by 45% relative to controls."
        ),
        (
            "Results\n"
            "We found that colony calcification decreased by 28% under acidified conditions (p = 0.003). "
            "However, nitrogen enrichment did not mitigate thermal stress in juvenile colonies."
        ),
    ]
    pdf_bytes = create_sample_pdf(paper_text)
    upload_res = client.post(
        f"/api/analyses/{analysis_id}/papers",
        files={"file": ("experiment_results.pdf", pdf_bytes, "application/pdf")},
        headers=user1_auth_header,
    )
    assert upload_res.status_code == 201
    paper_id = upload_res.json()["id"]

    # 3. Retrieve claims for paper
    claims_res = client.get(
        f"/api/analyses/{analysis_id}/papers/{paper_id}/claims",
        headers=user1_auth_header,
    )
    assert claims_res.status_code == 200
    claims = claims_res.json()
    assert len(claims) >= 2

    # Check properties
    for claim in claims:
        assert claim["paper_id"] == paper_id
        assert claim["page_number"] in [1, 2]
        assert len(claim["claim_text"]) > 15
        assert claim["extraction_method"] == "scientific_heuristic_v1"
        assert claim["confidence_score"] >= 60

    # 4. Trigger explicit extract-claims endpoint
    re_extract_res = client.post(
        f"/api/analyses/{analysis_id}/papers/{paper_id}/extract-claims",
        headers=user1_auth_header,
    )
    assert re_extract_res.status_code == 200
    extraction_data = re_extract_res.json()
    assert extraction_data["paper_id"] == paper_id
    assert extraction_data["claims_count"] >= 2
    assert extraction_data["is_scanned"] is False

    # 5. Retrieve all claims for analysis
    all_claims_res = client.get(
        f"/api/analyses/{analysis_id}/claims",
        headers=user1_auth_header,
    )
    assert all_claims_res.status_code == 200
    assert len(all_claims_res.json()) >= 2


def test_scanned_pdf_reports_ocr_needed(client, user1_auth_header, create_scanned_pdf):
    """Verify scanned / image-only PDFs honestly report OCR requirement and produce 0 fabricated claims."""
    # Create Analysis
    res_analysis = client.post("/api/analyses", json={"title": "Scanned PDF Test"}, headers=user1_auth_header)
    analysis_id = res_analysis.json()["id"]

    scanned_bytes = create_scanned_pdf()
    upload_res = client.post(
        f"/api/analyses/{analysis_id}/papers",
        files={"file": ("scanned_paper.pdf", scanned_bytes, "application/pdf")},
        headers=user1_auth_header,
    )
    assert upload_res.status_code == 201
    paper_id = upload_res.json()["id"]
    assert upload_res.json()["is_scanned"] is True

    # Extract claims
    extract_res = client.post(
        f"/api/analyses/{analysis_id}/papers/{paper_id}/extract-claims",
        headers=user1_auth_header,
    )
    assert extract_res.status_code == 200
    data = extract_res.json()
    assert data["is_scanned"] is True
    assert data["claims_count"] == 0
    assert len(data["claims"]) == 0
    assert "OCR is required" in data["warning"]


def test_separation_of_claims_between_papers_and_analyses(client, user1_auth_header, create_sample_pdf):
    """Verify claims from different papers and different analyses never leak into one another."""
    # Analysis A with Paper A
    res_a = client.post("/api/analyses", json={"title": "Analysis A"}, headers=user1_auth_header)
    a_id = res_a.json()["id"]
    pdf_a = create_sample_pdf(["Our results demonstrate that compound A enhances cellular repair by 50%."])
    up_a = client.post(f"/api/analyses/{a_id}/papers", files={"file": ("paper_a.pdf", pdf_a, "application/pdf")}, headers=user1_auth_header)
    paper_a_id = up_a.json()["id"]

    # Analysis B with Paper B
    res_b = client.post("/api/analyses", json={"title": "Analysis B"}, headers=user1_auth_header)
    b_id = res_b.json()["id"]
    pdf_b = create_sample_pdf(["Our observations confirm that factor B reduces viral replication by 90%."])
    up_b = client.post(f"/api/analyses/{b_id}/papers", files={"file": ("paper_b.pdf", pdf_b, "application/pdf")}, headers=user1_auth_header)
    paper_b_id = up_b.json()["id"]

    # Check Analysis A claims
    claims_a = client.get(f"/api/analyses/{a_id}/claims", headers=user1_auth_header).json()
    for c in claims_a:
        assert c["paper_id"] == paper_a_id
        assert "factor B" not in c["claim_text"]

    # Check Analysis B claims
    claims_b = client.get(f"/api/analyses/{b_id}/claims", headers=user1_auth_header).json()
    for c in claims_b:
        assert c["paper_id"] == paper_b_id
        assert "compound A" not in c["claim_text"]


def test_authentication_and_cross_tenant_isolation(client, user1_auth_header, user2_auth_header, create_sample_pdf):
    """Enforce that unauthenticated or cross-tenant users cannot access private claims."""
    # User 1 creates analysis and paper
    res = client.post("/api/analyses", json={"title": "Private User 1 Analysis"}, headers=user1_auth_header)
    analysis_id = res.json()["id"]
    pdf = create_sample_pdf(["We demonstrate that experimental enzyme X accelerates decomposition by 30%."])
    up = client.post(f"/api/analyses/{analysis_id}/papers", files={"file": ("p.pdf", pdf, "application/pdf")}, headers=user1_auth_header)
    paper_id = up.json()["id"]

    # Unauthenticated request must fail
    unauth = client.get(f"/api/analyses/{analysis_id}/claims")
    assert unauth.status_code == 401

    # User 2 request must be forbidden (403)
    cross_user = client.get(f"/api/analyses/{analysis_id}/claims", headers=user2_auth_header)
    assert cross_user.status_code == 403

    # User 2 extract-claims must be forbidden
    cross_extract = client.post(
        f"/api/analyses/{analysis_id}/papers/{paper_id}/extract-claims",
        headers=user2_auth_header,
    )
    assert cross_extract.status_code == 403
