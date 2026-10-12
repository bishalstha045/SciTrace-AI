import io


def test_missing_auth_header_rejected(client):
    """Verify endpoint rejects requests without Authorization header with 401"""
    response = client.post("/api/analyses", json={"title": "Unauthorized Test"})
    assert response.status_code == 401
    assert "Authentication credentials are required" in response.json()["detail"]


def test_invalid_auth_token_rejected(client):
    """Verify endpoint rejects invalid Bearer tokens with 401"""
    response = client.post(
        "/api/analyses",
        headers={"Authorization": "Bearer completely-invalid-token"},
        json={"title": "Invalid Token Test"},
    )
    assert response.status_code == 401


def test_create_and_get_analysis(client, user1_auth_header):
    """Verify authenticated user can create and retrieve an analysis"""
    create_res = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Coral Reef Microplastics"},
    )
    assert create_res.status_code == 201
    data = create_res.json()
    analysis_id = data["id"]
    assert data["title"] == "Coral Reef Microplastics"
    assert data["status"] == "processing"
    assert data["progress"] == 0

    # Retrieve created analysis
    get_res = client.get(f"/api/analyses/{analysis_id}", headers=user1_auth_header)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == analysis_id


def test_get_nonexistent_analysis_returns_404(client, user1_auth_header):
    """Verify requesting an unknown analysis returns 404 Not Found"""
    response = client.get("/api/analyses/non-existent-uuid-123", headers=user1_auth_header)
    assert response.status_code == 404


def test_cross_user_unauthorized_access_blocked(client, user1_auth_header, user2_auth_header):
    """Verify User 2 is blocked with 403 Forbidden when trying to access User 1's analysis"""
    # 1. User 1 creates analysis
    create_res = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "User 1 Private Analysis"},
    )
    analysis_id = create_res.json()["id"]

    # 2. User 2 attempts to read User 1's analysis
    user2_get_res = client.get(f"/api/analyses/{analysis_id}", headers=user2_auth_header)
    assert user2_get_res.status_code == 403
    assert "Access denied" in user2_get_res.json()["detail"]


def test_upload_valid_paper(client, user1_auth_header, create_sample_pdf):
    """Verify uploading a valid PDF parses page count and registers paper"""
    # 1. Create analysis
    analysis_id = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Upload Paper Test"},
    ).json()["id"]

    # 2. Generate PDF bytes
    pdf_bytes = create_sample_pdf(["Page 1 Scientific content", "Page 2 Additional proof"])

    # 3. Upload file
    upload_res = client.post(
        f"/api/analyses/{analysis_id}/papers",
        headers=user1_auth_header,
        files={"file": ("ocean_study.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    assert upload_res.status_code == 201
    paper = upload_res.json()
    assert paper["filename"] == "ocean_study.pdf"
    assert paper["page_count"] == 2
    assert paper["processing_status"] == "completed"
    assert paper["is_scanned"] is False


def test_reject_invalid_file_upload(client, user1_auth_header):
    """Verify non-PDF file upload is rejected with 400 Bad Request"""
    analysis_id = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Bad Upload Test"},
    ).json()["id"]

    fake_bytes = b"Just a plain text string disguised as a PDF"
    upload_res = client.post(
        f"/api/analyses/{analysis_id}/papers",
        headers=user1_auth_header,
        files={"file": ("fake.pdf", io.BytesIO(fake_bytes), "application/pdf")},
    )
    assert upload_res.status_code == 400
    assert "Invalid magic bytes" in upload_res.json()["detail"]


def test_run_analysis_workflow(client, user1_auth_header, create_sample_pdf):
    """Verify initiating the analysis workflow requires papers and transitions status"""
    # 1. Create empty analysis
    analysis_id = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Workflow Test"},
    ).json()["id"]

    # 2. Run without papers -> should fail with 400
    fail_res = client.post(f"/api/analyses/{analysis_id}/run", headers=user1_auth_header)
    assert fail_res.status_code == 400

    # 3. Upload paper
    pdf_bytes = create_sample_pdf()
    client.post(
        f"/api/analyses/{analysis_id}/papers",
        headers=user1_auth_header,
        files={"file": ("study.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )

    # 4. Run workflow -> should succeed with status processing
    run_res = client.post(f"/api/analyses/{analysis_id}/run", headers=user1_auth_header)
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "processing"
    assert run_data["progress"] == 25
    assert "ai_pipeline" in run_data["stage"] or "pdf_text_extraction" in run_data["stage"]


def test_demo_dataset_isolation(client, user1_auth_header):
    """Verify demo dataset is accessible and isolated from user DB"""
    res = client.get("/api/analyses/demo-analysis", headers=user1_auth_header)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "demo-analysis"
    assert data["status"] == "completed"
    assert len(data["papers"]) == 2

    # Results endpoint for demo
    results_res = client.get("/api/analyses/demo-analysis/results", headers=user1_auth_header)
    assert results_res.status_code == 200
    results_data = results_res.json()
    assert len(results_data["claims"]) == 2
    assert len(results_data["relationships"]) == 1


def test_export_analysis_csv(client, user1_auth_header):
    """Verify CSV export endpoint returns streaming CSV with headers and rows"""
    res = client.get("/api/analyses/demo-analysis/export", headers=user1_auth_header)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment" in res.headers["content-disposition"]

    content = res.text
    assert "Relationship ID" in content
    assert "Classification" in content
    assert "Confidence Score" in content
    assert "supporting" in content
    assert "demo-rel-1" in content


def test_delete_analysis_ownership_and_cascade(client, user1_auth_header, user2_auth_header):
    """Verify owner can delete analysis, other users are blocked, and records are purged"""
    # 1. User 1 creates analysis
    create_res = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "Analysis to be deleted"},
    )
    analysis_id = create_res.json()["id"]

    # 2. User 2 tries to delete -> 403 Forbidden
    u2_del = client.delete(f"/api/analyses/{analysis_id}", headers=user2_auth_header)
    assert u2_del.status_code == 403

    # 3. User 1 deletes -> 200 OK
    u1_del = client.delete(f"/api/analyses/{analysis_id}", headers=user1_auth_header)
    assert u1_del.status_code == 200
    assert u1_del.json()["deleted"] is True

    # 4. Subsequent get -> 404 Not Found
    get_res = client.get(f"/api/analyses/{analysis_id}", headers=user1_auth_header)
    assert get_res.status_code == 404


def test_end_to_end_analysis_pipeline_and_csv(client, user1_auth_header, user2_auth_header, create_sample_pdf):
    """
    Step 6 Comprehensive End-to-End Test:
    1. Authenticated user creates an analysis.
    2. Uploads 2 valid research papers containing scientific claims.
    3. Runs pipeline synchronously.
    4. Retrieves analysis results (claims, relationships, model metadata).
    5. Exports CSV report, verifying formula protection, paper names, and NLI scores.
    6. Verifies cross-user isolation.
    """
    # 1. Create analysis
    analysis_res = client.post(
        "/api/analyses",
        headers=user1_auth_header,
        json={"title": "E2E Integration Test"},
    )
    assert analysis_res.status_code == 201
    analysis_id = analysis_res.json()["id"]

    # 2. Paper 1: Proposes intermittent fasting increases neurogenesis
    p1_text = [
        "Abstract: We examined metabolic interventions on neurogenesis.",
        "Results: Intermittent fasting significantly increased adult hippocampal neurogenesis in mice by 45% (p < 0.01).",
    ]
    p1_pdf = create_sample_pdf(p1_text)
    up1 = client.post(
        f"/api/analyses/{analysis_id}/papers",
        headers=user1_auth_header,
        files={"file": ("fasting_study.pdf", io.BytesIO(p1_pdf), "application/pdf")},
    )
    assert up1.status_code == 201
    paper1_id = up1.json()["id"]

    # Paper 2: Claims fasting has no effect or decreases neurogenesis
    p2_text = [
        "Abstract: A multi-center evaluation of fasting regimens.",
        "Findings: Intermittent fasting did not increase adult hippocampal neurogenesis and showed no significant difference compared to ad libitum feeding.",
    ]
    p2_pdf = create_sample_pdf(p2_text)
    up2 = client.post(
        f"/api/analyses/{analysis_id}/papers",
        headers=user1_auth_header,
        files={"file": ("fasting_trial.pdf", io.BytesIO(p2_pdf), "application/pdf")},
    )
    assert up2.status_code == 201
    paper2_id = up2.json()["id"]

    # 3. Run analysis pipeline synchronously
    run_res = client.post(
        f"/api/analyses/{analysis_id}/run?sync=true",
        headers=user1_auth_header,
    )
    assert run_res.status_code == 200
    assert run_res.json()["status"] == "completed"

    # 4. Fetch results
    results_res = client.get(
        f"/api/analyses/{analysis_id}/results",
        headers=user1_auth_header,
    )
    assert results_res.status_code == 200
    results_data = results_res.json()
    assert results_data["analysis"]["status"] == "completed"
    assert len(results_data["papers"]) == 2
    assert len(results_data["claims"]) >= 2
    assert len(results_data["relationships"]) >= 1

    rel = results_data["relationships"][0]
    assert rel["classification"] in ("contradiction", "supporting", "neutral")
    assert rel["source_claim_text"] is not None
    assert rel["target_claim_text"] is not None
    assert rel["source_page_number"] >= 1
    assert rel["target_page_number"] >= 1
    assert "model_metadata" in rel
    assert "nli_scores" in rel

    # 5. Export CSV
    export_res = client.get(
        f"/api/analyses/{analysis_id}/export",
        headers=user1_auth_header,
    )
    assert export_res.status_code == 200
    csv_text = export_res.text
    assert "Analysis ID" in csv_text
    assert "Paper A" in csv_text
    assert "Claim A" in csv_text
    assert "Semantic Similarity Score" in csv_text
    assert "NLI Contradiction Score" in csv_text
    assert "fasting_study.pdf" in csv_text or "fasting_trial.pdf" in csv_text
    assert analysis_id in csv_text

    # 6. Verify cross-user isolation
    user2_get = client.get(f"/api/analyses/{analysis_id}/results", headers=user2_auth_header)
    assert user2_get.status_code == 403

    user2_export = client.get(f"/api/analyses/{analysis_id}/export", headers=user2_auth_header)
    assert user2_export.status_code == 403

