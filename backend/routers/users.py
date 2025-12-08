from datetime import timedelta
from fastapi import APIRouter, Depends, status, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from crud import user as user_crud
import models, schemas
from dependencies import get_current_user, get_current_user_optional, get_db
from services import user_service
from core.security import create_access_token
import shutil
from pathlib import Path
import uuid

UPLOAD_DIR = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

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
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)  # ✅ ДОДАТИ
):
    user = user_crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = user_crud.get_user_posts(db, user_id=user_id, current_user=current_user) or []
    comments = user_crud.get_user_replies(db, user_id=user_id, current_user=current_user) or []

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

@router.put("/me")
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
        setattr(current_user, 'username', user_update.username)

    # ✅ Update email if provided
    email_changed = False
    if user_update.email:
        # Check if email is already registered
        if user_crud.check_is_email_registered(db, user_update.email):
            raise HTTPException(status_code=400, detail="Email already taken")
        setattr(current_user, 'email', user_update.email)
        email_changed = True
    
    # ✅ IMPORTANT: commit changes to the DB
    db.commit()
    db.refresh(current_user)

    new_token = None
    if email_changed:
        # Generate a new access token with the updated email
        new_token = create_access_token(data={"sub": current_user.email}, expires_delta=timedelta(minutes=60))
        print(f"🔑 Generated new token for updated email: {new_token}")
    
    print(f"✅ User updated in DB: username={current_user.username}, email={current_user.email}")
    
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "avatar_url": current_user.avatar_url
        },
        "access_token": new_token,
        "token_type": "bearer" if new_token else None
    }

@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check file type
    allowed_types = ["image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and GIF are allowed.")
    
    # Check file size (limit to 5MB)
    file.file.seek(0, 2)  # Move to end of file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to start
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")
    
    # Generate unique filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing.")
    file_extention = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extention}"
    file_path = UPLOAD_DIR / unique_filename

    # Delete old avatar if exists
    avatar_url = getattr(current_user, 'avatar_url', None)
    if avatar_url:
        old_file = Path(avatar_url.replace("/uploads/", "uploads/"))
        if old_file.exists():
            old_file.unlink()

    # Save new avatar file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update user's avatar URL in the database
    avatar_url = f"/uploads/avatars/{unique_filename}"
    setattr(current_user, 'avatar_url', avatar_url)
    db.commit()
    db.refresh(current_user)

    return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully."}

@router.delete("/me/avatar")
def delete_avatar(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    avatar_url = getattr(current_user, 'avatar_url', None)
    if not avatar_url:
        raise HTTPException(status_code=400, detail="No avatar to delete.")
    
    # Delete the avatar file
    file_path = Path(avatar_url.replace("/uploads/", "uploads/"))
    if file_path.exists():
        file_path.unlink()
    
    # Remove avatar URL from user profile
    setattr(current_user, 'avatar_url', None)
    db.commit()
    db.refresh(current_user)

    return {"message": "Avatar deleted successfully."}