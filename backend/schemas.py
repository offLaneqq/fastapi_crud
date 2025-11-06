from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# --- Base schemas, which contain common fields ---

class UserBase(BaseModel):
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None

class CommentBase(BaseModel):
    text: str

class MessageBase(BaseModel):
    text: str

# --- Create schemas, used for creating new records ---

class UserCreate(UserBase):
    pass   # for creating a new user, all fields are inherited from UserBase

class CommentCreate(CommentBase):
    pass   # owner_id and message_id will be provided separately

class MessageCreate(MessageBase):
    pass   # owner_id will be provided separately

# --- Schema for user included in other schemas ---

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

# --- Schema for comment ---

class Comment(CommentBase):
    id: int
    timestamp: datetime
    owner: User   # Nested user schema

    class Config:
        orm_mode = True

class Message(MessageBase):
    id: int
    timestamp: datetime
    owner: User   # Nested user schema
    comments: List[Comment] = []  # List of nested comments

    class Config:
        orm_mode = True