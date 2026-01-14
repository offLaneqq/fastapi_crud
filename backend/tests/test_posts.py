def test_get_posts(client):
    """Тест отримання списку постів"""
    response = client.get("/posts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_unauthorized_create_post(client):
    """Тест створення поста без авторизації"""
    response = client.post("/posts/", json={"text": "Unauthorized post"})
    assert response.status_code == 401

def test_create_post(client, auth_token):
    """Тест створення поста"""
    token = auth_token("postuser123", "post123@test.com", "post12345")
    
    response = client.post(
        "/posts/",
        data={"text": "Test post content"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["text"] == "Test post content"

def test_update_post(client, auth_token):
    """Test updating post"""
    token = auth_token("updateuser123", "update123@test.com", "update12345")
    
    post = client.post(
        "/posts/",
        data={"text": "Original post content"},
        headers={"Authorization": f"Bearer {token}"}
    )
    post_id = post.json()["id"]
    
    response = client.put(
        f"/posts/{post_id}",
        data={"text": "Updated post content"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Updated post content"

def test_update_other_user_post(client, auth_token):
    """Test updating another user's post"""
    token1 = auth_token("user1", "user1@test.com", "password1")
    token2 = auth_token("user2", "user2@test.com", "password2")

    post = client.post(
        "/posts/",
        data={"text": "User1's post"},
        headers={"Authorization": f"Bearer {token1}"}
    )
    post_id = post.json()["id"]

    response = client.put(
        f"/posts/{post_id}",
        data={"text": "User2 trying to update"},
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 403

def test_delete_post(client, auth_token):
    """Тест видалення поста"""
    token = auth_token("deleteuser123", "delete123@test.com", "delete12345")
    
    post = client.post(
        "/posts/",
        data={"text": "Post to delete"},
        headers={"Authorization": f"Bearer {token}"}
    )
    post_id = post.json()["id"]
    
    response = client.delete(
        f"/posts/{post_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 204
    
    get_response = client.get(f"/posts/{post_id}")
    assert get_response.status_code == 404

def test_delete_other_user_post(client, auth_token):
    """Test deleting another user's post"""
    token1 = auth_token("user3", "user3@test.com", "password3")
    token2 = auth_token("user4", "user4@test.com", "password4")

    post = client.post(
        "/posts/",
        data={"text": "User3's post"},
        headers={"Authorization": f"Bearer {token1}"}
    )
    post_id = post.json()["id"]

    response = client.delete(
        f"/posts/{post_id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 403

def test_get_nonexistent_post(client):
    """Test getting a nonexistent post"""
    response = client.get("/posts/9999")
    assert response.status_code == 404