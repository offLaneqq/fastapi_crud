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

@router.put("/me", response_model=schemas.User)
def update_profile_me(
    user_update: schemas.UserUpdate,  # ✅ JSON body
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update current user's profile"""
    print(f"🔍 Received update: {user_update}")  # ✅ Debug log
    print(f"📝 Current user: id={current_user.id}, username={current_user.username}")
    

    if user_update.username:
        if user_crud.check_is_username_taken(db, user_update.username):
            raise HTTPException(status_code=400, detail="Username already taken")
        
        print(f"📝 Updating username: {current_user.username} → {user_update.username}")
        setattr(current_user, 'username', user_update.username)
    
    # ✅ Оновити email
    if user_update.email:
        # Перевірити чи email вже зайнятий
        if user_crud.check_is_email_registered(db, user_update.email):
            raise HTTPException(status_code=400, detail="Email already taken")
        
        print(f"📧 Updating email: {current_user.email} → {user_update.email}")
        setattr(current_user, 'email', user_update.email)
    
    # ✅ ВАЖЛИВО: commit змін в БД
    db.commit()
    db.refresh(current_user)
    
    print(f"✅ User updated in DB: username={current_user.username}, email={current_user.email}")
    
    return current_user