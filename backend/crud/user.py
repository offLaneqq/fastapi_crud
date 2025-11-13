from sqlalchemy.orm import Session
import models, schemas

def get_user(db: Session, user_id: int):
    # Get a user by ID
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    # Get a user by email
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_name(db: Session, user: str):
    # Get a user by username
    return db.query(models.User).filter(models.User.username == user).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    # Get list of users with pagination
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    # Create a new user record
    hashed_password = get_password_hash(user.password)  # type: ignore
    db_user = models.User(username=user.username, email=user.email, avatar_url=user.avatar_url, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    # Authenticate user by email and password
    user = get_user_by_email(db, email)
    if user is None:
        return False
    if not verify_password(password, user.hashed_password):  # type: ignore
        return False
    return user