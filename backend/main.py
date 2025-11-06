from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

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

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Start page
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI CRUD application!"}

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

# --- Message endpoints ---

# Endpoint to get a list of messages with their owners and comments
@app.get("/messages/", response_model=List[schemas.Message])
def get_messages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    messages = crud.get_messages(db, skip=skip, limit=limit)
    return messages

# Endpoint to create a new message
@app.post("/messages/", response_model=schemas.Message, status_code=status.HTTP_201_CREATED)
def create_message(message: schemas.MessageCreate, owner_id: int, db: Session = Depends(get_db)):
    return crud.create_message(db, message, owner_id)

# Endpoint to update an existing message
@app.put("/messages/{message_id}", response_model=schemas.Message)
def update_message(message_id: int, new_text: str, db: Session = Depends(get_db)):
    db_message = crud.update_message(db, message_id, new_text)
    if db_message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return db_message

# --- Comment endpoints ---

# Endpoint to get a list of comments
@app.get("/comments/", response_model=List[schemas.Comment])
def get_comments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    comments = crud.get_comments(db, skip=skip, limit=limit)
    return comments

# Endpoint to create a new comment
@app.post("/messages/{message_id}/comments/", response_model=schemas.Comment, status_code=status.HTTP_201_CREATED)
def create_comment(
    message_id: int,  # Get message ID from the URL path
    comment: schemas.CommentCreate,  # Get comment body (text)
    owner_id: int,  # TEMPORARY: while there is no authentication, we pass manually
    db: Session = Depends(get_db)
):
    # Check if the message exists
    db_message = crud.get_message(db, message_id)
    if not db_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return crud.create_comment(db=db, comment=comment, owner_id=owner_id, message_id=message_id)

