def test_health_check(client):
    """Verify GET /health returns 200 and expected status schema"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert data["environment"] == "test"
    assert "database_configured" in data
    assert "storage_configured" in data


def test_root_endpoint(client):
    """Verify GET / returns API metadata and online status"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["docs_url"] == "/docs"
    assert data["health_check"] == "/health"
