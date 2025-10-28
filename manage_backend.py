#!/usr/bin/env python3
"""
Backend Management Script
Script quản lý backend server - Start/Stop/Status
"""

import subprocess
import sys
import os
import psutil
import time

def check_port(port):
    """Check if port is in use"""
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.info['connections'] or []:
                if conn.laddr.port == port:
                    return True, proc.info['pid'], proc.info['name']
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False, None, None

def check_backend_status():
    """Check if backend is running"""
    print("🔍 Checking backend status...")
    print("=" * 40)
    
    # Check port 8000
    is_running, pid, name = check_port(8000)
    if is_running:
        print(f"✅ Backend is running on port 8000")
        print(f"   PID: {pid}")
        print(f"   Process: {name}")
        
        # Try to check health endpoint
        try:
            import requests
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                print(f"   Health: ✅ OK - {response.json()}")
            else:
                print(f"   Health: ⚠️  HTTP {response.status_code}")
        except Exception as e:
            print(f"   Health: ❌ Cannot reach - {e}")
    else:
        print("❌ Backend is not running on port 8000")
    
    # Check other common ports
    other_ports = [8001, 3000, 5000, 8080]
    for port in other_ports:
        is_running, pid, name = check_port(port)
        if is_running:
            print(f"⚠️  Port {port} is in use by PID {pid} ({name})")

def start_backend():
    """Start backend server"""
    print("🚀 Starting backend server...")
    print("=" * 40)
    
    # Check if already running
    is_running, pid, name = check_port(8000)
    if is_running:
        print(f"⚠️  Backend is already running on port 8000 (PID: {pid})")
        choice = input("Do you want to restart it? (y/N): ").lower()
        if choice == 'y':
            stop_backend()
        else:
            print("Keeping existing backend running...")
            return
    
    # Change to backend directory
    if not os.path.exists("backend/main.py"):
        print("❌ Error: backend/main.py not found")
        print("   Please run this script from the project root directory")
        return
    
    os.chdir("backend")
    
    try:
        print("📦 Installing dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True)
        print("✅ Dependencies installed")
        
        print("🌐 Starting server...")
        print("   URL: http://localhost:8000")
        print("   Docs: http://localhost:8000/docs")
        print("   Health: http://localhost:8000/health")
        print("=" * 40)
        print("Press Ctrl+C to stop the server")
        print("=" * 40)
        
        # Start server
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", 
                       "--host", "0.0.0.0", "--port", "8000", "--reload"])
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def stop_backend():
    """Stop backend server"""
    print("🛑 Stopping backend server...")
    print("=" * 40)
    
    killed_count = 0
    
    # Kill processes on port 8000
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.info['connections'] or []:
                if conn.laddr.port == 8000:
                    print(f"🔪 Killing process {proc.info['pid']} ({proc.info['name']}) on port 8000")
                    proc.kill()
                    killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    # Kill uvicorn processes
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['name'] == 'python.exe':
                cmdline = ' '.join(proc.info['cmdline'] or [])
                if 'uvicorn' in cmdline.lower() and 'main:app' in cmdline.lower():
                    print(f"🔪 Killing uvicorn process {proc.info['pid']}")
                    proc.kill()
                    killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    if killed_count > 0:
        print(f"✅ Stopped {killed_count} process(es)")
        time.sleep(1)  # Wait a moment for processes to stop
    else:
        print("ℹ️  No backend processes were running")
    
    # Verify port is free
    is_running, _, _ = check_port(8000)
    if is_running:
        print("⚠️  Port 8000 is still in use")
    else:
        print("✅ Port 8000 is now free")

def main():
    if len(sys.argv) < 2:
        print("🔧 Backend Management Script")
        print("=" * 40)
        print("Usage:")
        print("  python manage_backend.py start   - Start backend server")
        print("  python manage_backend.py stop    - Stop backend server")
        print("  python manage_backend.py status  - Check backend status")
        print("  python manage_backend.py restart - Restart backend server")
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
        print(f"❌ Unknown command: {command}")
        print("Available commands: start, stop, status, restart")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
