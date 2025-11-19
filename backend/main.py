"""
School Management System - Main Application
Hệ thống quản lý trường học với FastAPI
"""

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from supabase import Client
import uvicorn
from typing import List
import traceback

from database import get_db
from config import settings
from routers import auth, users, teachers, students, subjects, classrooms, schedules, assignments, attendances, finances, payments, campuses, expense_categories, rooms

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

# CORS middleware
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["http://localhost:3000"]
# Add common Next.js dev server origins
cors_origins.extend(["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"])
cors_origins = list(set(cors_origins))  # Remove duplicates

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/")
async def root():
    return {"message": "School Management System API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
