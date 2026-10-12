import io
import pytest
from app.services.contradiction_engine import contradiction_engine
from app.services.supabase_service import supabase_service


def test_full_pipeline_with_two_papers(client, user1_auth_header, create_sample_pdf):
    """
    Test complete end-to-end pipeline:
    1. Create analysis
    2. Upload 2 papers with opposing scientific findings
    3. Run analysis synchronously
    4. Verify relationships are generated, saved, and returned via API
    """
    # 1. Create analysis
    analysis_res = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Coral Bleaching Conflict Study"},
    )
    assert analysis_res.status_code == 201
    analysis_id = analysis_res.json()["id"]

    # 2. Upload Paper A (pro-bleaching)
    paper_a_text = [
        "Abstract: We investigated thermal stress in tropical corals.",
        "Results: Rising ocean temperatures directly accelerate coral bleaching severity across tropical reefs.",
    ]
    pdf_a_bytes = create_sample_pdf(paper_a_text)
    upload_a = client.post(
        f"/api/analyses/{analysis_id}/papers",
        headers=user1_auth_header,
        files={"file": ("study_warming.pdf", io.BytesIO(pdf_a_bytes), "application/pdf")},
    )
    assert upload_a.status_code in (200, 201)

    # Upload Paper B (anti-bleaching / opposing)
    paper_b_text = [
        "Abstract: Comprehensive multi-reef survey under variable climate conditions.",
        "Results: Elevated sea surface temperatures do not increase coral bleaching severity in tropical reefs.",
    ]
    pdf_b_bytes = create_sample_pdf(paper_b_text)
    upload_b = client.post(
        f"/api/analyses/{analysis_id}/papers",
        headers=user1_auth_header,
        files={"file": ("study_resilience.pdf", io.BytesIO(pdf_b_bytes), "application/pdf")},
    )
    assert upload_b.status_code in (200, 201)

    # 3. Run analysis synchronously
    run_res = client.post(
        f"/api/analyses/{analysis_id}/run?sync=true",
        headers=user1_auth_header,
    )
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "completed"
    assert run_data["progress"] == 100

    # 4. Fetch results
    results_res = client.get(
        f"/api/analyses/{analysis_id}/results",
        headers=user1_auth_header,
    )
    assert results_res.status_code == 200
    results_data = results_res.json()
    assert results_data["ai_status"] == "completed"
    assert len(results_data["papers"]) == 2
    assert len(results_data["claims"]) >= 2
    assert len(results_data["relationships"]) >= 1

    # Check relationship evidence & provenance
    rel = results_data["relationships"][0]
    assert rel["classification"] in ("contradiction", "supporting", "neutral")
    assert rel["source_claim_id"] != rel["target_claim_id"]
    assert "source_claim_text" in rel
    assert "target_claim_text" in rel
    assert "similarity_score" in rel


def test_pipeline_repeated_execution_idempotent(client, user1_auth_header, create_sample_pdf):
    """Verify that re-running an analysis does NOT create duplicate relationships"""
    analysis_res = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Idempotency Test"},
    )
    analysis_id = analysis_res.json()["id"]

    pdf1 = create_sample_pdf(["Our data demonstrate that rising temperatures accelerate coral bleaching."])
    pdf2 = create_sample_pdf(["Elevated temperatures do not increase coral bleaching severity."])

    client.post(f"/api/analyses/{analysis_id}/papers", headers=user1_auth_header, files={"file": ("p1.pdf", io.BytesIO(pdf1), "application/pdf")})
    client.post(f"/api/analyses/{analysis_id}/papers", headers=user1_auth_header, files={"file": ("p2.pdf", io.BytesIO(pdf2), "application/pdf")})

    # Run 1
    client.post(f"/api/analyses/{analysis_id}/run?sync=true", headers=user1_auth_header)
    res1 = client.get(f"/api/analyses/{analysis_id}/results", headers=user1_auth_header).json()
    count_1 = len(res1["relationships"])

    # Run 2 (retry / rerun)
    client.post(f"/api/analyses/{analysis_id}/run?sync=true", headers=user1_auth_header)
    res2 = client.get(f"/api/analyses/{analysis_id}/results", headers=user1_auth_header).json()
    count_2 = len(res2["relationships"])

    # Must be idempotent - no duplicate records accumulated
    assert count_1 == count_2


def test_pipeline_cross_user_isolation(client, user1_auth_header, user2_auth_header, create_sample_pdf):
    """Verify that User 2 cannot run or access User 1's analysis results"""
    analysis_res = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Private User 1 Analysis"},
    )
    analysis_id = analysis_res.json()["id"]

    # User 2 attempting to run User 1's analysis must fail with 403 or 404
    run_attempt = client.post(f"/api/analyses/{analysis_id}/run", headers=user2_auth_header)
    assert run_attempt.status_code in (403, 404)

    # User 2 attempting to view User 1's relationships must fail with 403 or 404
    view_attempt = client.get(f"/api/analyses/{analysis_id}/results", headers=user2_auth_header)
    assert view_attempt.status_code in (403, 404)
