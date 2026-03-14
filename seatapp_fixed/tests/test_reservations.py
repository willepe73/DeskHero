from fastapi.testclient import TestClient
from app.main import app
import pytest
import uuid
import datetime

def test_list_reservations():
    with TestClient(app) as client:
        # Just ensure the endpoint runs without issues
        response = client.get("/api/v1/reservations?date=2024-05-15")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

def test_upcoming_reservations():
    with TestClient(app) as client:
        response = client.get("/api/v1/reservations/upcoming?from_date=2024-05-15")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

def test_create_reservation():
    with TestClient(app) as client:
        unique_user = f"tester_{uuid.uuid4().hex[:8]}"
        date_str = (datetime.date.today() + datetime.timedelta(days=100)).isoformat()
        payload = {
            "building": "Agora",
            "floor": 1,
            "seat_number": 372,
            "date": date_str,
            "reserved_by": unique_user
        }

        response = client.post("/api/v1/reservations", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["building"] == "Agora"
        assert data["floor"] == 1
        assert data["seat_number"] == 372
        assert data["date"] == date_str
        assert data["reserved_by"] == unique_user
        assert "id" in data
        assert "created_at" in data

def test_create_reservation_conflict():
    with TestClient(app) as client:
        unique_user = f"tester_{uuid.uuid4().hex[:8]}"
        date_str = (datetime.date.today() + datetime.timedelta(days=102)).isoformat()
        payload = {
            "building": "Agora",
            "floor": 1,
            "seat_number": 373,
            "date": date_str,
            "reserved_by": unique_user
        }

        # First creation should succeed
        response1 = client.post("/api/v1/reservations", json=payload)
        assert response1.status_code == 201

        # Second creation should fail due to conflict
        response2 = client.post("/api/v1/reservations", json=payload)
        assert response2.status_code == 409
        assert "Seat already reserved for that date" in response2.json()["detail"]

def test_create_reservation_invalid_building():
    with TestClient(app) as client:
        payload = {
            "building": "UnknownBuilding",
            "floor": 1,
            "seat_number": 367,
            "date": "2024-05-15",
            "reserved_by": "tester"
        }
        response = client.post("/api/v1/reservations", json=payload)
        assert response.status_code == 404
        assert response.json()["detail"] == "Unknown building"

def test_create_reservation_invalid_seat():
    with TestClient(app) as client:
        payload = {
            "building": "Agora",
            "floor": 1,
            "seat_number": 9999,
            "date": "2024-05-15",
            "reserved_by": "tester"
        }
        response = client.post("/api/v1/reservations", json=payload)
        assert response.status_code == 404
        assert response.json()["detail"] == "Unknown seat"
