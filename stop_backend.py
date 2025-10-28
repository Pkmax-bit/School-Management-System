#!/usr/bin/env python3
"""
Script to stop all backend servers
Tắt tất cả các backend server đang chạy
"""

import subprocess
import sys
import os
import signal
import psutil

def kill_processes_by_port(port):
    """Kill processes running on specific port"""
    killed_count = 0
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.info['connections'] or []:
                if conn.laddr.port == port:
                    print(f"🔪 Killing process {proc.info['pid']} ({proc.info['name']}) on port {port}")
                    proc.kill()
                    killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return killed_count

def kill_processes_by_name(name_patterns):
    """Kill processes by name pattern"""
    killed_count = 0
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            proc_name = proc.info['name'].lower()
            cmdline = ' '.join(proc.info['cmdline'] or []).lower()
            
            for pattern in name_patterns:
                if pattern.lower() in proc_name or pattern.lower() in cmdline:
                    print(f"🔪 Killing process {proc.info['pid']} ({proc.info['name']}) - {pattern}")
                    proc.kill()
                    killed_count += 1
                    break
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return killed_count

def main():
    print("🛑 Stopping all backend servers...")
    print("=" * 50)
    
    total_killed = 0
    
    # Kill processes on common backend ports
    ports_to_check = [8000, 8001, 3000, 3001, 5000, 5001, 8080, 8081]
    for port in ports_to_check:
        killed = kill_processes_by_port(port)
        total_killed += killed
        if killed > 0:
            print(f"✅ Killed {killed} process(es) on port {port}")
    
    # Kill processes by name patterns
    name_patterns = [
        'uvicorn',
        'fastapi',
        'python main.py',
        'python -m uvicorn',
        'node server.js',
        'npm start',
        'yarn start',
        'next dev',
        'next start'
    ]
    
    killed = kill_processes_by_name(name_patterns)
    total_killed += killed
    if killed > 0:
        print(f"✅ Killed {killed} process(es) by name pattern")
    
    # Kill any remaining Python processes that might be running our backend
    try:
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, text=True, shell=True)
        if 'python.exe' in result.stdout:
            print("🐍 Found Python processes, checking for backend...")
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if proc.info['name'] == 'python.exe':
                        cmdline = ' '.join(proc.info['cmdline'] or [])
                        if any(keyword in cmdline.lower() for keyword in ['main.py', 'uvicorn', 'fastapi']):
                            print(f"🔪 Killing Python backend process {proc.info['pid']}")
                            proc.kill()
                            total_killed += 1
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
    except Exception as e:
        print(f"⚠️  Could not check Python processes: {e}")
    
    print("=" * 50)
    if total_killed > 0:
        print(f"✅ Successfully stopped {total_killed} backend process(es)")
    else:
        print("ℹ️  No backend processes were running")
    
    print("🔍 Checking if ports are free...")
    for port in [8000, 3000]:
        try:
            result = subprocess.run(['netstat', '-an'], capture_output=True, text=True, shell=True)
            if f':{port}' in result.stdout:
                print(f"⚠️  Port {port} is still in use")
            else:
                print(f"✅ Port {port} is free")
        except Exception:
            print(f"⚠️  Could not check port {port}")
    
    print("=" * 50)
    print("🎉 All backend servers have been stopped!")
    print("💡 To start backend again, run: python start_backend.py")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 Stopping script...")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
