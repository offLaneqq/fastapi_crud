from datetime import datetime
import os
import shutil
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas
from dependencies import get_current_user, get_current_user, get_current_user_optional, get_db
from crud import post as post_crud
from services import post_service

router = APIRouter(prefix="/posts", tags=["Posts"])

# Endpoint to get a list of posts with their owners and comments
@router.get("/", response_model=List[schemas.Post])
def get_posts(skip: int = 0, limit: int = 100, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    return post_service.get_posts_with_metadata(db, current_user, skip, limit)
           
# Endpoint to get a specific post by ID
@router.get("/{post_id}", response_model=schemas.Post)
def get_post(post_id: int, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    post = post_crud.get_post(db, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        "id": post.id,
        "text": post.text,
        "timestamp": post.timestamp,
        "owner": post.owner,
        "replies": [
            schemas.PostReply(
                id=reply.id,
                text=reply.text,
                timestamp=reply.timestamp,
                owner=reply.owner,
                likes_count=len(reply.likes),
                is_liked_by_user=any(like.user_id == current_user.id for like in reply.likes) if current_user else False
            ) for reply in post.replies
        ],
        "likes_count": len(post.likes),
        "is_liked_by_user": any(like.user_id == current_user.id for like in post.likes) if current_user else False
    }

# Endpoint to create a new post
@router.post("/", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_post(text: str = Form(...), current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db), image: UploadFile = File(None)):
    image_url = None

    if image and image.filename:
        allowed_extensions = {"png", "jpg", "jpeg", "gif"}
        file_extension = os.path.splitext(image.filename)[1].lower()

        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid image format. Allowed formats: {', '.join(allowed_extensions)}")

        unique_filename = f"post_{current_user.id}_{int(datetime.now().timestamp())}{file_extension}"
        file_path = os.path.join("uploads", unique_filename)

        os.makedirs("uploads", exist_ok=True)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_url = f"/uploads/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    # Create the post with the image URL if provided
    post_data = schemas.PostCreate(text=text)

    return post_crud.create_post(db, post_data, owner_id=current_user.id, parent_id=None)  # type: ignore

# Endpoint to create a reply to a post
@router.post("/{post_id}/replies", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_reply(post_id: int, text: str = Form(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db), image: UploadFile = File(None)):
    
    # Check if the parent post exists
    parent_post = post_crud.get_post(db, post_id)
    if parent_post is None:
        raise HTTPException(status_code=404, detail="Parent post not found")

    image_url = None

    if image and image.filename:
        allowed_extensions = {"png", "jpg", "jpeg", "gif"}
        file_extension = os.path.splitext(image.filename)[1].lower()

        if file_extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid image format. Allowed formats: {', '.join(allowed_extensions)}")

        unique_filename = f"reply_{current_user.id}_{int(datetime.now().timestamp())}{file_extension}"
        file_path = os.path.join("uploads", unique_filename)

        os.makedirs("uploads", exist_ok=True)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_url = f"/uploads/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    reply_data = schemas.PostCreate(text=text)
    return post_crud.create_post(db, reply_data, owner_id=current_user.id, parent_id=post_id) # type: ignore


# Endpoint to update an existing post
@router.put("/{post_id}", response_model=schemas.Post)
def update_post(post_id: int, new_text: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_post = post_crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if getattr(db_post, 'owner_id') != getattr(current_user, 'id'):
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    return post_crud.update_post(db, post_id, new_text)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_post = post_crud.get_post(db, post_id)

    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if getattr(db_post, 'owner_id') != getattr(current_user, 'id'):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    post_crud.delete_post(db, post_id)
    return