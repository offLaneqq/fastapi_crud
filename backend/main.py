from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(likes.router)
app.include_router(posts.router)

# Start page
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI CRUD application!"}