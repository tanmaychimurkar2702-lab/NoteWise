import os
import io
import pytest
from backend.app import create_app
from backend.models.database import get_db_connection, DB_PATH
from backend.services.vector_service import vector_service

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["model"] == "sentence-transformers/all-MiniLM-L6-v2"
    assert data["vector_dimension"] == 384

def test_empty_dashboard_stats(client):
    res = client.get('/api/dashboard/stats')
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "total_documents" in data
    assert "total_pages" in data
    assert "total_chunks" in data
    assert "subject_distribution" in data

def test_upload_txt_document(client):
    content = b"Deadlock prevention in OS requires breaking one of Coffman's four conditions."
    data = {
        'file': (io.BytesIO(content), 'test_deadlock.txt'),
        'subject': 'Operating Systems'
    }
    res = client.post('/api/documents/upload', data=data, content_type='multipart/form-data')
    assert res.status_code == 201
    body = res.get_json()
    assert body["success"] is True
    doc_id = body["data"]["document_id"]

    # Check search finds it semantically
    search_res = client.post('/api/search', json={'query': 'How to prevent system deadlocks?'})
    assert search_res.status_code == 200
    results = search_res.get_json()["results"]
    assert len(results) > 0
    assert results[0]["document_id"] == doc_id
    assert results[0]["similarity_score"] > 25.0

    # Clean up test doc
    del_res = client.delete(f'/api/documents/{doc_id}')
    assert del_res.status_code == 200

def test_empty_file_upload(client):
    data = {
        'file': (io.BytesIO(b""), 'empty.txt'),
        'subject': 'General'
    }
    res = client.post('/api/documents/upload', data=data, content_type='multipart/form-data')
    assert res.status_code == 400
    assert "empty" in res.get_json()["error"].lower()

def test_invalid_extension_upload(client):
    data = {
        'file': (io.BytesIO(b"test binary"), 'malicious.exe'),
        'subject': 'General'
    }
    res = client.post('/api/documents/upload', data=data, content_type='multipart/form-data')
    assert res.status_code == 400
    assert "unsupported" in res.get_json()["error"].lower()
