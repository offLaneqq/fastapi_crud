from sqlalchemy.orm import Session, joinedload
import models, schemas

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
    ).filter(models.Post.parent_id == None).order_by(models.Post.timestamp.desc()).offset(skip).limit(limit).all()

def create_post(db: Session, post: schemas.PostCreate, owner_id: int, parent_id: int | None = None):
    # Create a new post record
    db_post = models.Post(**post.model_dump(), owner_id=owner_id, parent_id=parent_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def update_post(db: Session, post_id: int, text: str):
    # Update the text of an existing post
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        # here is pylance false positive, because db_post.text is definitely a string
        db_post.text = text  # type: ignore FIX THAT!!!
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
