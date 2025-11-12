from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from dependencies import get_db
from auth import (
    get_current_active_user,
    get_current_user,
    get_current_user_optional,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

import crud, models, schemas
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",   # default Vite port
    "http://localhost:3000",   # default React port 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start page
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI CRUD application!"}

# --- Authentication endpoints ---

# Create new user (registration)
@app.post("/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_by_name = crud.get_user_by_name(db, user.username)
    if db_user_by_name:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user_by_email = crud.get_user_by_email(db, user.email)
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    return crud.create_user(db, user)

# User login to get access token
@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: schemas.LoginForm, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Get info about the current user
@app.get("/auth/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

# --- User endpoints ---

# Endpoint to get a list of users
@app.get("/users/", response_model=List[schemas.User])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

# Endpoint to create a new user
@app.post("/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_by_name = crud.get_user_by_name(db, user.username)
    if db_user_by_name:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user_by_email = crud.get_user_by_email(db, user.email)
    if db_user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

# --- Post endpoints ---

# Endpoint to get a list of posts with their owners and comments
@app.get("/posts/", response_model=List[schemas.Post])
def get_posts(skip: int = 0, limit: int = 100, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    posts = crud.get_posts(db, skip=skip, limit=limit)
    current_user_id: Optional[int] = getattr(current_user, 'id', None) if current_user is not None else None

    result = []
    for post in posts:
        post_dict = {
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
                    is_liked_by_user=any(like.user_id == current_user_id for like in reply.likes) if current_user_id is not None else False
                ) for reply in post.replies
            ],
            "likes_count": len(post.likes),
            "is_liked_by_user": any(like.user_id == current_user_id for like in post.likes) if current_user_id is not None else False
        }
        result.append(post_dict)

    return result

# Endpoint to get a specific post by ID
@app.get("/posts/{post_id}", response_model=schemas.Post)
def get_post(post_id: int, current_user: Optional[models.User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    post = crud.get_post(db, post_id)
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
@app.post("/posts/", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_post(post: schemas.PostCreate, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_post(db, post, owner_id=current_user.id, parent_id=None)

# Endpoint to create a reply to a post
@app.post("/posts/{post_id}/replies", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_reply(post_id: int, reply: schemas.PostCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    # Check if the parent post exists
    parent_post = crud.get_post(db, post_id)
    if parent_post is None:
        raise HTTPException(status_code=404, detail="Parent post not found")

    return crud.create_post(db, reply, owner_id=current_user.id, parent_id=post_id) # type: ignore

# Endpoint to update an existing post
@app.put("/posts/{post_id}", response_model=schemas.Post)
def update_post(post_id: int, new_text: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_post = crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if getattr(db_post, 'owner_id') != getattr(current_user, 'id'):
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    return crud.update_post(db, post_id, new_text)


@app.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_post = crud.get_post(db, post_id)

    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if getattr(db_post, 'owner_id') != getattr(current_user, 'id'):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    crud.delete_post(db, post_id)
    return

# --- Like endpoints ---

@app.post("/posts/{post_id}/like", status_code=status.HTTP_200_OK)
def toggle_like(post_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Toggle like
    is_liked = crud.toggle_like(db, current_user.id, post_id) # type: ignore
    liked_count = len(db_post.likes)

    return {"is_liked": is_liked, "likes_count": liked_count}

# Get list of likes for a post
@app.get("/posts/{post_id}/likes", status_code=status.HTTP_200_OK)
def get_likes_count(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return db_post.likes