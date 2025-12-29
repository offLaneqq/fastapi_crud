def test_like_post(client, auth_token):
    """Тест лайку на пост"""
    token = auth_token("likeuser123", "like123@test.com", "like12345")
    
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

def test_add_comment(client, auth_token):
    """Тест додавання коментаря"""
    token = auth_token("commentuser123", "comment123@test.com", "comment12345")
    
    post = client.post(
        "/posts/",
        json={"text": "Post for comment"},
        headers={"Authorization": f"Bearer {token}"}
    )
    post_id = post.json()["id"]
    
    response = client.post(
        f"/posts/{post_id}/replies",
        json={"text": "Test comment"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["text"] == "Test comment"