"""
Configuration settings for the School Management System
"""

import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret"  # JWT secret for token verification
    
    # Database Configuration (Supabase PostgreSQL)
    DATABASE_URL: str = ""
    DB_HOST: str = ""
    DB_PORT: int = 5432
    DB_NAME: str = ""
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    
    # JWT Configuration
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 hours
    
    # Email Configuration
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    
    # Application Configuration
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10485760
    
    class Config:
        env_file = ".env"

settings = Settings()
