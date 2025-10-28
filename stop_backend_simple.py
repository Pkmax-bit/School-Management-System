#!/usr/bin/env python3
"""
Simple script to stop backend servers
Script đơn giản để tắt backend server
"""

import subprocess
import sys
import os

def kill_processes_by_port(port):
    """Kill processes running on specific port using netstat and taskkill"""
    try:
        # Find processes using the port
        result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True, shell=True)
        pids = []
        
        for line in result.stdout.split('\n'):
            if f':{port}' in line and 'LISTENING' in line:
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    if pid.isdigit():
                        pids.append(pid)
        
        # Kill the processes
        killed_count = 0
        for pid in pids:
            try:
                print(f"Killing process {pid} on port {port}")
                subprocess.run(['taskkill', '/F', '/PID', pid], check=True, capture_output=True)
                killed_count += 1
            except subprocess.CalledProcessError:
                print(f"Could not kill process {pid}")
        
        return killed_count
    except Exception as e:
        print(f"Error checking port {port}: {e}")
        return 0

def kill_python_processes():
    """Kill Python processes that might be running backend"""
    try:
        # Find Python processes
        result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, text=True, shell=True)
        
        killed_count = 0
        for line in result.stdout.split('\n'):
            if 'python.exe' in line:
                parts = line.split()
                if len(parts) >= 2:
                    pid = parts[1]
                    try:
                        # Get command line to check if it's our backend
                        cmd_result = subprocess.run(['wmic', 'process', 'where', f'ProcessId={pid}', 'get', 'CommandLine'], 
                                                  capture_output=True, text=True, shell=True)
                        cmdline = cmd_result.stdout.lower()
                        
                        if any(keyword in cmdline for keyword in ['main.py', 'uvicorn', 'fastapi']):
                            print(f"Killing Python backend process {pid}")
                            subprocess.run(['taskkill', '/F', '/PID', pid], check=True, capture_output=True)
                            killed_count += 1
                    except Exception:
                        pass
        
        return killed_count
    except Exception as e:
        print(f"Error checking Python processes: {e}")
        return 0

def main():
    print("Stopping all backend servers...")
    print("=" * 50)
    
    total_killed = 0
    
    # Kill processes on common backend ports
    ports_to_check = [8000, 8001, 3000, 3001, 5000, 5001, 8080, 8081]
    for port in ports_to_check:
        killed = kill_processes_by_port(port)
        total_killed += killed
        if killed > 0:
            print(f"Killed {killed} process(es) on port {port}")
    
    # Kill Python backend processes
    killed = kill_python_processes()
    total_killed += killed
    if killed > 0:
        print(f"Killed {killed} Python backend process(es)")
    
    print("=" * 50)
    if total_killed > 0:
        print(f"Successfully stopped {total_killed} process(es)")
    else:
        print("No backend processes were running")
    
    # Check if ports are free
    print("\nChecking if ports are free...")
    for port in [8000, 3000]:
        try:
            result = subprocess.run(['netstat', '-an'], capture_output=True, text=True, shell=True)
            if f':{port}' in result.stdout:
                print(f"WARNING: Port {port} is still in use")
            else:
                print(f"Port {port} is free")
        except Exception:
            print(f"Could not check port {port}")
    
    print("=" * 50)
    print("All backend servers have been stopped!")
    print("To start backend again, run: python start_backend.py")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopping script...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
