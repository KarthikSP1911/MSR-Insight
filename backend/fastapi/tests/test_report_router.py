from unittest.mock import patch

def test_generate_ai_remark_success(client):
    with patch('routers.report_router.ai_service.generate_remark') as mock_generate:
        mock_generate.return_value = {"remark": "Student is doing well"}
        
        response = client.post(
            "/generate-remark",
            json={"usn": "1MS21CS001", "name": "John", "subjects": []}
        )
        
        assert response.status_code == 200
        assert response.json() == {"remark": "Student is doing well"}

def test_generate_ai_remark_value_error(client):
    with patch('routers.report_router.ai_service.generate_remark') as mock_generate:
        mock_generate.side_effect = ValueError("Invalid data")
        
        response = client.post(
            "/generate-remark",
            json={"usn": "1MS21CS001"}
        )
        
        assert response.status_code == 400
        assert "Invalid data" in response.json()["detail"]
