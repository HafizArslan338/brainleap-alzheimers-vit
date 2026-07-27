@echo off
title BrainLeap Clinical Suite - Setup and Launch
echo ======================================================================
echo           BrainLeap Clinical Decision Support System
echo ======================================================================
echo.

IF NOT EXIST "venv" (
    echo [1/3] Virtual environment not found. Creating 'venv'...
    python -m venv venv
    echo [2/3] Installing dependencies from requirements.txt...
    .\venv\Scripts\python.exe -m pip install --upgrade pip
    .\venv\Scripts\python.exe -m pip install -r requirements.txt
) ELSE (
    echo [1/2] Virtual environment 'venv' detected.
)

echo.
echo [3/3] Starting BrainLeap FastAPI Backend & Clinical Suite...
echo.
echo Open your browser at: http://127.0.0.1:8000
echo Press Ctrl+C in this window to stop the server.
echo ======================================================================
echo.

.\venv\Scripts\python.exe run.py

pause
