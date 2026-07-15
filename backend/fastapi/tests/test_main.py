def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "fastapi running"}

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "API is running" in response.json()["message"]
