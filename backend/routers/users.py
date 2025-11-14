from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from crud import user as user_crud
from backend import schemas
from backend.dependencies import get_db
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