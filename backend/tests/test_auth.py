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
    
    response = client.post(
        "/auth/login",
        files={
            "username": (None, "loginuser123"),
            "password": (None, "login12345")
        }
    )
    
    assert response.status_code == 200
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