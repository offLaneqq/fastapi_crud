from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend import models, schemas
from backend.dependencies import get_current_user, get_current_user, get_current_user_optional, get_db
from crud import post as post_crud
from services import post_service

router = APIRouter(prefix="/posts", tags=["Posts"])

# Endpoint to get a list of posts with their owners and comments
@router.get("/", response_model=List[schemas.Post])
def get_posts(skip: int = 0, limit: int = 100, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    return post_service.get_post_with_metadata(db, current_user, skip, limit)
           
# Endpoint to get a specific post by ID
@router.get("/{post_id}", response_model=schemas.Post)
def get_post(post_id: int, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    post = post_crud.get_post(db, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        "id": post.id,
        "text": post.text,
        "timestamp": post.timestamp,
        "owner": post.owner,
        "replies": [
            schemas.PostReply(
                id=reply.id,
                text=reply.text,
                timestamp=reply.timestamp,
                owner=reply.owner,
                likes_count=len(reply.likes),
                is_liked_by_user=any(like.user_id == current_user.id for like in reply.likes) if current_user else False
            ) for reply in post.replies
        ],
        "likes_count": len(post.likes),
        "is_liked_by_user": any(like.user_id == current_user.id for like in post.likes) if current_user else False
    }

# Endpoint to create a new post
@router.post("/", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_post(post: schemas.PostCreate, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return post_crud.create_post(db, post, owner_id=current_user.id, parent_id=None)

# Endpoint to create a reply to a post
@router.post("/{post_id}/replies", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_reply(post_id: int, reply: schemas.PostCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    # Check if the parent post exists
    parent_post = post_crud.get_post(db, post_id)
    if parent_post is None:
        raise HTTPException(status_code=404, detail="Parent post not found")

    return post_crud.create_post(db, reply, owner_id=current_user.id, parent_id=post_id) # type: ignore
# Endpoint to update an existing post
@router.put("/{post_id}", response_model=schemas.Post)
def update_post(post_id: int, new_text: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_post = post_crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if getattr(db_post, 'owner_id') != getattr(current_user, 'id'):
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    return post_crud.update_post(db, post_id, new_text)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_post = post_crud.get_post(db, post_id)

    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if getattr(db_post, 'owner_id') != getattr(current_user, 'id'):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    post_crud.delete_post(db, post_id)
    return