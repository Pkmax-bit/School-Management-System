"""
School Management System - Main Application
Hệ thống quản lý trường học với FastAPI
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from supabase import Client
import uvicorn
from typing import List
import traceback
import os

from database import get_db
from config import settings
<<<<<<< HEAD
from routers import auth, users, teachers, students, subjects, classrooms, schedules, assignments, attendances, finances, payments, campuses, expense_categories, rooms, lessons, reports, roles, notifications, audit_logs, batch
from middleware.cache_headers import CacheHeadersMiddleware
from middleware.rate_limiter import RateLimiterMiddleware
=======
from routers import auth, users, teachers, students, subjects, classrooms, schedules, assignments, attendances, finances, payments, campuses, expense_categories, rooms, lessons, notifications, template_classrooms
>>>>>>> origin/master

app = FastAPI(
    title="School Management System API",
    description="API cho hệ thống quản lý trường học",
    version="1.0.0"
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    error_detail = str(exc)
    traceback_str = traceback.format_exc()
    print(f"Unhandled exception: {error_detail}")
    print(f"Traceback: {traceback_str}")
    
    # Return a proper error response
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {error_detail}",
            "type": type(exc).__name__
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

<<<<<<< HEAD
# Rate limiting middleware - 60 requests per minute per client
app.add_middleware(RateLimiterMiddleware, requests_per_minute=60)

# Cache headers middleware - Add HTTP cache headers
app.add_middleware(CacheHeadersMiddleware)

# GZip compression middleware - Compress responses > 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)
=======
# Debug endpoint to check versions and connections
@app.get("/api/debug")
async def debug_info():
    """Debug endpoint to check system status"""
    import supabase
    import httpx

    try:
        from services.supabase_client import get_supabase_client
        client = get_supabase_client()

        return {
            "status": "ok",
            "versions": {
                "supabase": supabase.__version__,
                "httpx": httpx.__version__,
            },
            "supabase_connection": "success",
            "environment": os.getenv("ENVIRONMENT", "unknown")
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "versions": {
                "supabase": getattr(supabase, '__version__', 'unknown'),
                "httpx": getattr(httpx, '__version__', 'unknown'),
            }
        }
>>>>>>> origin/master

# CORS middleware - Allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["Subjects"])
app.include_router(classrooms.router, prefix="/api/classrooms", tags=["Classrooms"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Schedules"])
app.include_router(campuses.router, prefix="/api/campuses", tags=["Campuses"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])
app.include_router(attendances.router, prefix="/api/attendances", tags=["Attendances"])
app.include_router(finances.router, prefix="/api/finances", tags=["Finances"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(expense_categories.router, prefix="/api/expense-categories", tags=["Expense Categories"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["Lessons"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(roles.router, prefix="/api/roles", tags=["Roles & Permissions"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
<<<<<<< HEAD
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["Audit Logs"])
app.include_router(batch.router, prefix="/api", tags=["Batch"])
=======
app.include_router(template_classrooms.router, prefix="/api/template-classrooms", tags=["Template Classrooms"])
>>>>>>> origin/master

@app.get("/")
async def root():
    return {"message": "School Management System API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
