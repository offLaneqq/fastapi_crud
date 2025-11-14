from fastapi import HTTPException
from sqlalchemy.orm import Session
from crud import user as user_crud
import schemas

def create_user_with_validation(db: Session, user: schemas.UserCreate):
    
    # Check username
    db_user_by_name = user_crud.get_user_by_name(db, user.username)
    if db_user_by_name:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check email
    db_user_by_email = user_crud.get_user_by_email(db, user.email)
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    return user_crud.create_user(db, user)