from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import schemas
from dependencies import get_db, get_current_active_user
from core.security import decode_token
import models
from crud.user import get_user_by_name, get_user_by_email, create_user, authenticate_user
from datetime import timedelta
from core.security import create_access_token
from core.config import settings


router = APIRouter(prefix="/auth", tags=["Authentication"])

# Create new user (registration)
@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_by_name = get_user_by_name(db, user.username)
    if db_user_by_name:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user_by_email = get_user_by_email(db, user.email)
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    return create_user(db, user)

# User login to get access token
@router.post("/login", response_model=schemas.Token)
def login(form_data: schemas.LoginForm, db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Get info about the current user
@router.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user
