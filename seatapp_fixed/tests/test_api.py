from fastapi.testclient import TestClient
from app.main import app
import pytest

def test_health():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

def test_locations():
    with TestClient(app) as client:
        response = client.get("/api/v1/locations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

        # Check if Agora and Library are present
        buildings = [b["name"] for b in data]
        assert "Agora" in buildings
        assert "Library" in buildings

def test_floorplan():
    with TestClient(app) as client:
        response = client.get("/api/v1/floorplan?building=Agora&floor=1")
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"

def test_floorplan_not_found():
    with TestClient(app) as client:
        response = client.get("/api/v1/floorplan?building=Unknown&floor=1")
        assert response.status_code == 404

def test_availability():
    with TestClient(app) as client:
        response = client.get("/api/v1/availability?building=Agora&floor=1&date=2024-05-15")
        assert response.status_code == 200
        data = response.json()
        assert data["building"] == "Agora"
        assert data["floor"] == 1
        assert data["date"] == "2024-05-15"
        assert isinstance(data["seats"], list)
        assert len(data["seats"]) > 0

        # check first seat
        seat = data["seats"][0]
        assert "seat_number" in seat
        assert "is_reserved" in seat
