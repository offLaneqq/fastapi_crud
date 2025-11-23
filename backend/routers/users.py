from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from crud import user as user_crud
import models, schemas
from dependencies import get_current_user, get_db
from services import user_service
    

router = APIRouter(prefix="/users", tags=["Users"])

# Endpoint to get a list of users
@router.get("/", response_model=List[schemas.User])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = user_crud.get_users(db, skip=skip, limit=limit)
    return users

# Endpoint to create a new user
@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user_with_validation(db, user)

@router.get("/{user_id}", response_model=schemas.UserProfile)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = user_crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = user_crud.get_user_posts(db, user_id=user_id)
    comments = user_crud.get_user_replies(db, user_id=user_id)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "posts": posts,
        "comments": comments,
        "posts_count": len(posts),
        "comments_count": len(comments)
    }

@router.put("/{user_id}", response_model=schemas.User)
def update_profile(username: Optional[str] = None,
                   email: Optional[str] = None,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    
    if username and user_crud.check_is_username_taken(db, username=username):
        setattr(current_user, 'username', username)
    
    if email and user_crud.check_is_email_registered(db, email=email):
        setattr(current_user, 'email', email)
    
    db.commit()
    db.refresh(current_user)
    return current_user