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