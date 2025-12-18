import pytest # type: ignore
from fastapi.testclient import TestClient
from main import app
from database import Base
from dependencies import get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

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
            import time
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

def register_and_get_token(client, username, email, password):
    """Helper для реєстрації та отримання токену"""
    # Реєстрація
    response = client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password
        }
    )
    assert response.status_code == 200, f"Register failed: {response.json()}"
    
    # Логін для отримання токену - ВИКОРИСТОВУЄМО files для form data
    login_response = client.post(
        "/auth/login",
        files={
            "username": (None, username),
            "password": (None, password)
        }
    )
    
    if login_response.status_code != 200:
        print(f"\n=== LOGIN DEBUG ===")
        print(f"Status: {login_response.status_code}")
        print(f"Response: {login_response.json()}")
    
    assert login_response.status_code == 200, f"Login failed: {login_response.json()}"
    return login_response.json()["access_token"]

def test_register_user(client):
    """Тест реєстрації користувача"""
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser123",
            "email": "test123@test.com",
            "password": "test12345"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "username" in data
    assert data["username"] == "testuser123"

def test_register_duplicate(client):
    """Тест реєстрації дубльованого користувача"""
    user_data = {
        "username": "duplicate123",
        "email": "dup123@test.com",
        "password": "test12345"
    }
    
    response1 = client.post("/auth/register", json=user_data)
    assert response1.status_code == 200
    
    response2 = client.post("/auth/register", json=user_data)
    assert response2.status_code == 400

def test_login_user(client):
    """Тест логіну користувача"""
    client.post(
        "/auth/register",
        json={
            "username": "loginuser123",
            "email": "login123@test.com",
            "password": "login12345"
        }
    )
    
    # Використовуємо files для form data
    response = client.post(
        "/auth/login",
        files={
            "username": (None, "loginuser123"),
            "password": (None, "login12345")
        }
    )
    
    assert response.status_code == 200, f"Login failed: {response.json()}"
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    """Тест логіну з неправильним паролем"""
    client.post(
        "/auth/register",
        json={
            "username": "wrongpass123",
            "email": "wrong123@test.com",
            "password": "correct123"
        }
    )
    
    response = client.post(
        "/auth/login",
        files={
            "username": (None, "wrongpass123"),
            "password": (None, "wrong123")
        }
    )
    assert response.status_code == 401

def test_create_post(client):
    """Тест створення поста"""
    token = register_and_get_token(
        client,
        "postuser123",
        "post123@test.com",
        "post12345"
    )
    
    response = client.post(
        "/posts/",
        json={"text": "Test post content"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Test post content"

def test_get_posts(client):
    """Тест отримання списку постів"""
    response = client.get("/posts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_unauthorized_create_post(client):
    """Тест створення поста без авторизації"""
    response = client.post("/posts/", json={"text": "Unauthorized post"})
    assert response.status_code == 401

def test_like_post(client):
    """Тест лайку на пост"""
    token = register_and_get_token(client, "likeuser123", "like123@test.com", "like12345")
    
    post = client.post(
        "/posts/",
        json={"text": "Post to like"},
        headers={"Authorization": f"Bearer {token}"}
    )
    post_id = post.json()["id"]
    
    response = client.post(
        f"/posts/{post_id}/like",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

def test_add_comment(client):
    """Тест додавання коментаря"""
    token = register_and_get_token(client, "commentuser123", "comment123@test.com", "comment12345")
    
    post = client.post(
        "/posts/",
        json={"text": "Post for comment"},
        headers={"Authorization": f"Bearer {token}"}
    )
    post_id = post.json()["id"]
    
    response = client.post(
        f"/posts/{post_id}/reply",
        json={"text": "Test comment"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["text"] == "Test comment"

def test_delete_post(client):
    """Тест видалення поста"""
    token = register_and_get_token(client, "deleteuser123", "delete123@test.com", "delete12345")
    
    post = client.post(
        "/posts/",
        json={"text": "Post to delete"},
        headers={"Authorization": f"Bearer {token}"}
    )
    post_id = post.json()["id"]
    
    response = client.delete(
        f"/posts/{post_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    
    get_response = client.get(f"/posts/{post_id}")
    assert get_response.status_code == 404

def test_get_user_profile(client):
    """Тест отримання профілю користувача"""
    register = client.post(
        "/auth/register",
        json={
            "username": "profileuser123",
            "email": "profile123@test.com",
            "password": "profile12345"
        }
    )
    user_id = register.json()["id"]
    
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "profileuser123"
    assert "posts" in data
    assert "comments" in data