from sqlalchemy.orm import Session, joinedload
from auth import verify_password, get_password_hash
import schemas, models

# --- Users CRUD operations ---

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

# --- Posts CRUD operations ---

def get_post(db: Session, post_id: int):
    # Get a post by ID
    return db.query(models.Post).options(
        joinedload(models.Post.owner),
        joinedload(models.Post.likes),
        joinedload(models.Post.replies).joinedload(models.Post.owner),
        joinedload(models.Post.replies).joinedload(models.Post.likes)
    ).filter(models.Post.id == post_id).first()

def get_posts(db: Session, skip: int = 0, limit: int = 100):
    # Get list of posts with information about their owners and comments
    return db.query(models.Post).options(
        joinedload(models.Post.owner),
        joinedload(models.Post.likes),
        joinedload(models.Post.replies).joinedload(models.Post.owner),
        joinedload(models.Post.replies).joinedload(models.Post.likes)
    ).order_by(models.Post.timestamp.desc()).offset(skip).limit(limit).all()

def create_post(db: Session, post: schemas.PostCreate, owner_id: int, parent_id: int | None = None):
    # Create a new post record
    db_post = models.Post(**post.model_dump(), owner_id=owner_id, parent_id=parent_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def update_post(db: Session, post_id: int, new_text: str):
    # Update the text of an existing post
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        # here is pylance false positive, because db_post.text is definitely a string
        db_post.text = new_text  # type: ignore
        db.commit()
        db.refresh(db_post)
    return db_post

def delete_post(db: Session, post_id: int):
    # Delete a post by ID
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db.delete(db_post)
        db.commit()
    return

# --- Likes CRUD operations ---

def toggle_like(db: Session, user_id: int, post_id: int):
    # Toggle like for a post by a user
    db_like = db.query(models.Like).filter(
        models.Like.user_id == user_id,
        models.Like.post_id == post_id
    ).first()

    if db_like:
        db.delete(db_like)
        db.commit()
        return False  # Like removed
    else:
        new_like = models.Like(user_id=user_id, post_id=post_id)
        db.add(new_like)
        db.commit()
        db.refresh(new_like)
        return True  # Like added