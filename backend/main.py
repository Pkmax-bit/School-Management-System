"""
School Management System - Main Application
Hệ thống quản lý trường học với FastAPI
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
import uvicorn
from typing import List

from database import get_db
from config import settings
from routers import auth, users, teachers, students, subjects, classrooms, schedules, assignments, attendances, finances, payments, campuses, expense_categories, rooms

app = FastAPI(
    title="School Management System API",
    description="API cho hệ thống quản lý trường học",
    version="1.0.0"
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

# CORS middleware
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["http://localhost:3000"]
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
