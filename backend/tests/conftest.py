import os
import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base
from dependencies import get_db

# Тестова база даних
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=test_engine
)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Створює тестову БД перед всіма тестами"""
    test_engine.dispose()
    
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
        except PermissionError:
            time.sleep(0.5)
            try:
                os.remove("test.db")
            except:
                pass
    
    Base.metadata.create_all(bind=test_engine)
    yield
    test_engine.dispose()

@pytest.fixture
def client():
    """Fixture для TestClient"""
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def auth_token(client):
    """Helper fixture для отримання токену"""
    def _get_token(username="testuser", email="test@test.com", password="test12345"):
        # Реєстрація
        client.post(
            "/auth/register",
            json={
                "username": username,
                "email": email,
                "password": password
            }
        )
        
        # Логін
        login_response = client.post(
            "/auth/login",
            files={
                "username": (None, username),
                "password": (None, password)
            }
        )
        return login_response.json()["access_token"]
    
    return _get_token