from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
from dependencies import get_current_user, get_db
from crud import post as post_crud
from crud import like as like_crud


router = APIRouter(prefix="/posts", tags=["Likes"])

@router.post("/{post_id}/like", status_code=status.HTTP_200_OK)
def toggle_like(post_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = post_crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Toggle like
    is_liked = like_crud.toggle_like(db, current_user.id, post_id) # type: ignore
    db.refresh(db_post)
    liked_count = len(db_post.likes)

    return {"is_liked": is_liked, "likes_count": liked_count}

# Get list of likes for a post
@router.get("/{post_id}/likes", status_code=status.HTTP_200_OK)
def get_likes_count(post_id: int, db: Session = Depends(get_db)):
    db_post = post_crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return db_post.likes