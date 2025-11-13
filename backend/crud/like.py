from sqlalchemy.orm import Session
import models

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