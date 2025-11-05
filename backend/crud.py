from sqlalchemy.orm import Session, joinedload
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
    db_user = models.User(username=user.username, email=user.email, avatar_url=user.avatar_url)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Messages CRUD operations ---

def get_messages(db: Session, skip: int = 0, limit: int = 100):
    # Get list of messages with information about their owners and comments
    return db.query(models.Message).options(
        joinedload(models.Message.owner),
        joinedload(models.Message.comments).joinedload(models.Comment.owner)
    ).order_by(models.Message.timestamp.desc()).offset(skip).limit(limit).all()

def create_message(db: Session, message: schemas.MessageCreate, owner_id: int):
    # Create a new message record
    db_message = models.Message(**message.model_dump(), owner_id=owner_id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def update_message(db: Session, message_id: int, new_text: str):
    # Update the text of an existing message
    db_message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if db_message:
        # here is pylance false positive, because db_message.text is definitely a string
        db_message.text = new_text  # type: ignore
        db.commit()
        db.refresh(db_message)
    return db_message

# --- Comments CRUD operations ---

def get_comments(db: Session, skip: int = 0, limit: int = 100):
    # Get list of comments with information about their owners
    return db.query(models.Comment).options(
        joinedload(models.Comment.owner)
    ).order_by(models.Comment.timestamp.desc()).offset(skip).limit(limit).all()

def create_comment(db: Session, comment: schemas.CommentCreate, owner_id: int, message_id: int):
    # Create a new comment record
    db_comment = models.Comment(**comment.model_dump(), owner_id=owner_id, message_id=message_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment