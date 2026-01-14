from fastapi import HTTPException
from sqlalchemy.orm import Session
from crud import user as user_crud
import models, schemas
from typing import List, Optional
from crud import post as post_crud

def get_posts_with_metadata(db: Session, current_user: Optional[models.User], skip: int = 0, limit: int = 100) -> List[dict]:
    posts = post_crud.get_posts(db, skip=skip, limit=limit)
    current_user_id: Optional[int] = getattr(current_user, 'id', None) if current_user is not None else None

    result = []
    for post in posts:
        post_dict = {
            "id": post.id,
            "text": post.text,
            "timestamp": post.timestamp,
            "owner": post.owner,
            "image_url": post.image_url,
            "replies": [
                schemas.PostReply(
                    id=reply.id,
                    text=reply.text,
                    timestamp=reply.timestamp,
                    owner=reply.owner,
                    likes_count=len(reply.likes),
                    is_liked_by_user=any(like.user_id == current_user_id for like in reply.likes) if current_user_id is not None else False
                ) for reply in post.replies
            ],
            "likes_count": len(post.likes),
            "is_liked_by_user": any(like.user_id == current_user_id for like in post.likes) if current_user_id is not None else False
        }
        result.append(post_dict)

    return result

def delete_post(db: Session, post_id: int, current_user_id: int):
    # Check ownership before deletion
    db_post = post_crud.get_post(db, post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if db_post.owner_id != current_user_id:  # type: ignore
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    post_crud.delete_post(db, post_id)

def update_post(db: Session, post_id: int, new_text: str, current_user_id: int):
    # Check ownership before update
    db_post = post_crud.get_post(db, post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if db_post.owner_id != current_user_id:  # type: ignore
        raise HTTPException(status_code=403, detail="Not authorized to update this post")
    
    return post_crud.update_post(db, post_id, new_text)