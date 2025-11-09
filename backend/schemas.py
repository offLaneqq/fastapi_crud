from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# --- User schemas ---

class UserBase(BaseModel):
    username: str
    email: EmailStr
    avatar_url: Optional[str] = Field(
        default=None, 
        examples=[None],
        description="URL of the user's avatar image"
    )

class UserCreate(UserBase):
    password: str = Field(
        min_length=8,
        examples=["strongpassword123"],
        description="Password for the user account"
    )   # for creating a new user, all fields are inherited from UserBase

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- Token schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Post schemas ---

class PostBase(BaseModel):
    text: str

class PostCreate(PostBase):
    pass   # owner_id will be provided separately

class PostReply(PostBase):
    id: int
    timestamp: datetime
    owner: User 
    likes_count: int = 0  
    is_liked_by_user: bool = False  

    class Config:
        from_attributes = True

class Post(PostBase):
    id: int
    timestamp: datetime
    owner: User   # Nested user schema
    replies: List[PostReply] = []  # List of replies to this post
    likes_count: int = 0  # Number of likes for the post
    is_liked_by_user: bool = False  # Whether the current user liked this post

    class Config:
        from_attributes = True

# --- Like schemas ---

class LikeBase(BaseModel):
    pass  # No additional fields needed for base

class LikeCreate(LikeBase):
    pass  # No additional fields needed for creation

class Like(LikeBase):
    id: int
    user_id: int
    post_id: int
    timestamp: datetime

    class Config:
        from_attributes = True