from pydantic_settings import BaseSettings # type: ignore
from typing import List
import os

class Settings(BaseSettings):
    # API Settings
    api_title: str = "FastAPI CRUD"
    api_version: str = "1.0.0"
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # CORS
    cors_origins: str = os.getenv("CORS_ORIGINS", '["http://localhost:5173","http://localhost:3000"]')
    
    class Config:
        env_file = ".env"

settings = Settings()