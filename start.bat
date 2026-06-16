@echo off
echo =========================================
echo  LegalOne - Starting All Services
echo =========================================
echo.
echo Starting Backend (FastAPI)...
start "LegalOne Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 >nul
echo Starting Frontend (React)...
start "LegalOne Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo =========================================
echo  Open http://localhost:3000 in browser
echo  Ollama must be running separately:
echo  ollama serve
echo =========================================
pause
