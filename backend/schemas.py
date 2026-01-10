from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field
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

class UserProfile(UserBase):
    id: int
    posts: List[Post] = []
    comments: List[PostReply] = []
    posts_count: int
    comments_count: int

    model_config = ConfigDict(from_attributes=True)
    
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class UserUpdateResponse(BaseModel):
    user: User
    access_token: Optional[str] = None
    token_type: Optional[str] = None

class User(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Token schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Post schemas ---

class PostBase(BaseModel):
    text: str
    image_url: Optional[str] = None

class PostCreate(PostBase):
    pass   # owner_id will be provided separately

class PostReply(PostBase):
    id: int
    timestamp: datetime
    owner: User 
    likes_count: int = 0  
    is_liked_by_user: bool = False  

    model_config = ConfigDict(from_attributes=True)

class Post(PostBase):
    id: int
    timestamp: datetime
    image_url: Optional[str] = None
    owner: User   # Nested user schema
    replies: List[PostReply] = []  # List of replies to this post
    likes_count: int = 0  # Number of likes for the post
    is_liked_by_user: bool = False  # Whether the current user liked this post

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

class LoginForm(BaseModel):
    email: EmailStr
    password: str