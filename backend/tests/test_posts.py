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
        json={"text": "Test post content"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["text"] == "Test post content"

def test_delete_post(client, auth_token):
    """Тест видалення поста"""
    token = auth_token("deleteuser123", "delete123@test.com", "delete12345")
    
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