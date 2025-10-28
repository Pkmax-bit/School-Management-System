#!/usr/bin/env python3
"""
Script to start the backend server
Chạy script này để khởi động backend server
"""

import subprocess
import sys
import os

def main():
    print("🚀 Starting School Management System Backend Server...")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("backend/main.py"):
        print("❌ Error: Please run this script from the project root directory")
        print("   Current directory:", os.getcwd())
        print("   Expected to find: backend/main.py")
        sys.exit(1)
    
    # Change to backend directory
    os.chdir("backend")
    
    print("📁 Changed to backend directory")
    print("🔧 Installing dependencies...")
    
    try:
        # Install requirements
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        sys.exit(1)
    
    print("🌐 Starting server on http://localhost:8000")
    print("📋 API Documentation: http://localhost:8000/docs")
    print("❤️  Health Check: http://localhost:8000/health")
    print("=" * 50)
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        # Start the server
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
