from sqlalchemy.orm import Session
from typing import TYPE_CHECKING, Optional
import schemas
from core.security import verify_password, get_password_hash

if TYPE_CHECKING:
    import models
else:
    import models

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

def get_user_posts(db: Session, user_id: int, current_user: Optional[models.User] = None):
    # Get posts created by a specific user
    posts = db.query(models.Post).filter(
        models.Post.owner_id == user_id,
        models.Post.parent_id == None
    ).order_by(models.Post.timestamp.desc()).all()

    posts_data = []
    for post in posts:
        is_liked = False
        if current_user:
            is_liked = db.query(models.Like).filter(
                models.Like.post_id == post.id,
                models.Like.user_id == current_user.id
            ).first() is not None
        
        replies = db.query(models.Post).filter(models.Post.parent_id == post.id).all()
        replies_data = []
        for reply in replies:
            reply_is_liked = False
            if current_user:
                reply_is_liked = db.query(models.Like).filter(
                    models.Like.post_id == reply.id,
                    models.Like.user_id == current_user.id
                ).first() is not None
            
            replies_data.append({
                "id": reply.id,
                "text": reply.text,
                "timestamp": reply.timestamp,
                "owner": {
                    "id": reply.owner.id,
                    "username": reply.owner.username,
                    "email": reply.owner.email,
                    "avatar_url": reply.owner.avatar_url
                },
                "likes_count": db.query(models.Like).filter(models.Like.post_id == reply.id).count(),
                "is_liked": reply_is_liked
            })


        posts_data.append({
            "id": post.id,
            "text": post.text,
            "timestamp": post.timestamp,
            "owner": {
                "id": post.owner.id,
                "username": post.owner.username,
                "email": post.owner.email,
                "avatar_url": post.owner.avatar_url
            },
            "likes_count": db.query(models.Like).filter(models.Like.post_id == post.id).count(),
            "replies": replies_data,
            "is_liked_by_user": is_liked,
        })
    return posts_data

def get_user_replies(db: Session, user_id: int, current_user: Optional[models.User] = None):
    """Отримати коментарі користувача з is_liked_by_user"""
    comments = db.query(models.Post).filter(
        models.Post.owner_id == user_id,
        models.Post.parent_id != None
    ).all()
    
    comments_data = []
    for comment in comments:
        is_liked = False
        if current_user:
            is_liked = db.query(models.Like).filter(
                models.Like.post_id == comment.id,
                models.Like.user_id == current_user.id
            ).first() is not None
        
        comments_data.append({
            "id": comment.id,
            "text": comment.text,
            "timestamp": comment.timestamp,
            "owner": {
                "id": comment.owner.id,
                "username": comment.owner.username,
                "email": comment.owner.email,
                "avatar_url": comment.owner.avatar_url
            },
            "parent_id": comment.parent_id,
            "likes_count": db.query(models.Like).filter(models.Like.post_id == comment.id).count(),
            "is_liked_by_user": is_liked  
        })
    
    return comments_data

def check_is_username_taken(db: Session, username: str) -> bool:
    # Check if a username is already taken
    user = get_user_by_name(db, username)
    return user is not None

def check_is_email_registered(db: Session, email: str) -> bool:
    # Check if an email is already registered
    user = get_user_by_email(db, email)
    return user is not None