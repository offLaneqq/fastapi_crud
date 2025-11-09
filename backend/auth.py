from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt # pyright: ignore[reportMissingModuleSource]
from typing import Optional
import bcrypt # pyright: ignore[reportMissingImports]
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dependencies import get_db
import models

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# HTTPBearer з auto_error=False дозволяє None (опціональна авторизація)
security_optional = HTTPBearer(auto_error=False)
# HTTPBearer з auto_error=True викидає помилку якщо немає токену (обов'язкова авторизація)
security_required = HTTPBearer(auto_error=True)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8')[:72], bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def _decode_token(credentials: HTTPAuthorizationCredentials, db: Session) -> Optional[models.User]:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    return db.query(models.User).filter(models.User.username == username).first()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_required),
    db: Session = Depends(get_db)
) -> models.User:
    user = _decode_token(credentials, db)
    
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
    
    return _decode_token(credentials, db)

# Alias for get_current_user
get_current_active_user = get_current_user