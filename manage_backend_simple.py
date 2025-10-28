#!/usr/bin/env python3
"""
Simple Backend Management Script
Script quản lý backend đơn giản - Start/Stop/Status
"""

import subprocess
import sys
import os
import time

def check_port(port):
    """Check if port is in use"""
    try:
        result = subprocess.run(['netstat', '-an'], capture_output=True, text=True, shell=True)
        return f':{port}' in result.stdout and 'LISTENING' in result.stdout
    except Exception:
        return False

def check_backend_status():
    """Check if backend is running"""
    print("Checking backend status...")
    print("=" * 40)
    
    # Check port 8000
    is_running = check_port(8000)
    if is_running:
        print("Backend is running on port 8000")
        
        # Try to check health endpoint
        try:
            import requests
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                print(f"Health: OK - {response.json()}")
            else:
                print(f"Health: HTTP {response.status_code}")
        except Exception as e:
            print(f"Health: Cannot reach - {e}")
    else:
        print("Backend is not running on port 8000")
    
    # Check other common ports
    other_ports = [8001, 3000, 5000, 8080]
    for port in other_ports:
        if check_port(port):
            print(f"Port {port} is in use")

def start_backend():
    """Start backend server"""
    print("Starting backend server...")
    print("=" * 40)
    
    # Check if already running
    if check_port(8000):
        print("Backend is already running on port 8000")
        choice = input("Do you want to restart it? (y/N): ").lower()
        if choice == 'y':
            stop_backend()
        else:
            print("Keeping existing backend running...")
            return
    
    # Change to backend directory
    if not os.path.exists("backend/main.py"):
        print("Error: backend/main.py not found")
        print("Please run this script from the project root directory")
        return
    
    os.chdir("backend")
    
    try:
        print("Installing dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("Dependencies installed")
        
        print("Starting server...")
        print("URL: http://localhost:8000")
        print("Docs: http://localhost:8000/docs")
        print("Health: http://localhost:8000/health")
        print("=" * 40)
        print("Press Ctrl+C to stop the server")
        print("=" * 40)
        
        # Start server
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", 
                       "--host", "0.0.0.0", "--port", "8000", "--reload"])
        
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

def stop_backend():
    """Stop backend server"""
    print("Stopping backend server...")
    print("=" * 40)
    
    # Use the simple stop script
    try:
        result = subprocess.run([sys.executable, "stop_backend_simple.py"], 
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
    except Exception as e:
        print(f"Error stopping backend: {e}")

def main():
    if len(sys.argv) < 2:
        print("Backend Management Script")
        print("=" * 40)
        print("Usage:")
        print("  python manage_backend_simple.py start   - Start backend server")
        print("  python manage_backend_simple.py stop    - Stop backend server")
        print("  python manage_backend_simple.py status  - Check backend status")
        print("  python manage_backend_simple.py restart - Restart backend server")
        print("=" * 40)
        return
    
    command = sys.argv[1].lower()
    
    if command == "start":
        start_backend()
    elif command == "stop":
        stop_backend()
    elif command == "status":
        check_backend_status()
    elif command == "restart":
        stop_backend()
        time.sleep(2)
        start_backend()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: start, stop, status, restart")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nGoodbye!")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
