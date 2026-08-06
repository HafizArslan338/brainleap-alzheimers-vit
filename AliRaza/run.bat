@echo off
echo ==============================================
echo BrainLeap Clinical Dashboard - Startup Script
echo ==============================================

if not exist venv (
    echo [1/3] Creating virtual environment...
    python -m venv venv
)

echo [2/3] Installing/Verifying requirements...
call venv\Scripts\activate
pip install -r requirements.txt

echo [3/3] Starting BrainLeap Server...
echo The application will be available at: http://127.0.0.1:8000
echo.
uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
