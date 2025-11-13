from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from core.security import decode_token
import models

def get_db():
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# HTTPBearer з auto_error=False дозволяє None (опціональна авторизація)
security_optional = HTTPBearer(auto_error=False)
# HTTPBearer з auto_error=True викидає помилку якщо немає токену (обов'язкова авторизація)
security_required = HTTPBearer(auto_error=True)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_required),
    db: Session = Depends(get_db)
) -> models.User:
    user = decode_token(credentials, db)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if credentials is None:
        return None
    
    return decode_token(credentials, db)

# Alias for get_current_user
get_current_active_user = get_current_user