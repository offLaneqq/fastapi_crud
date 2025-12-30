from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
import os

from routers import likes, posts, users
from core.config import settings
from routers import auth

import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version
)

# Parse CORS origins - support both JSON array and comma-separated string
cors_origins_env = os.getenv("CORS_ORIGINS", settings.cors_origins)

try:
    # Try parsing as JSON array first
    cors_origins = json.loads(cors_origins_env)
    if not isinstance(cors_origins, list):
        cors_origins = [cors_origins_env]
except (json.JSONDecodeError, TypeError):
    # If not JSON, try comma-separated or single value
    if "," in cors_origins_env:
        cors_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    else:
        cors_origins = [cors_origins_env]

# Strip trailing slashes from all origins (CORS is strict about exact matches)
cors_origins = [origin.rstrip('/') for origin in cors_origins]

# Always include localhost for development
if "http://localhost:5173" not in cors_origins:
    cors_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

print(f"🌍 CORS allowed origins: {cors_origins}")  # Debug log

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(likes.router)
app.include_router(posts.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Start page
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI CRUD application!"}