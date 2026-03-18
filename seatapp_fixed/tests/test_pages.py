from fastapi.testclient import TestClient
from app.main import app
import pytest

def test_index_page():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert b"Welcome to DeskHero" in response.content

def test_locations_page():
    with TestClient(app) as client:
        response = client.get("/locations")
        assert response.status_code == 200
        assert b"Our Locations" in response.content

def test_reservations_page():
    with TestClient(app) as client:
        response = client.get("/reservations")
        assert response.status_code == 200
        assert b"Reservations" in response.content

def test_static_css():
    with TestClient(app) as client:
        response = client.get("/static/styles.css")
        assert response.status_code == 200
        assert b"--primary-color" in response.content
