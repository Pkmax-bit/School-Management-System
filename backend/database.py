"""
Database Configuration
Cấu hình Supabase cho hệ thống quản lý trường học
"""

from supabase_client import get_supabase_client
from typing import Generator

def get_db():
    """Dependency để lấy Supabase client"""
    supabase = get_supabase_client()
    try:
        yield supabase
    finally:
        pass
