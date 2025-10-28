@echo off
echo Starting School Management System...

echo.
echo Starting Backend...
cd backend
start cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Starting Frontend...
cd ../frontend
start cmd /k "npm run dev"

echo.
echo Both services are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
