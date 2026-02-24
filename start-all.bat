@echo off
set "ROOT=%~dp0"

echo Starting FastAPI Backend...
start "FastAPI Backend" cmd /k "cd /d %ROOT%backend\fastapi && call venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo Starting Express Backend...
start "Express Backend" cmd /k "cd /d %ROOT%backend\express && node server.js"

echo Starting Frontend...
start "Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

echo All servers started!
pause
