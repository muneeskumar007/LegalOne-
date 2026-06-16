#!/bin/bash
echo "========================================="
echo " LegalOne — Starting All Services"
echo "========================================="

# Check Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "⚠️  Ollama not running. Start it with: ollama serve"
  echo "   Then pull model: ollama pull llama3"
  echo ""
fi

# Backend
cd "$(dirname "$0")/backend"
if [ ! -d "venv" ]; then
  echo "Setting up Python venv..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
else
  source venv/bin/activate
fi

echo "▶ Starting Backend on :8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
echo "▶ Starting Frontend on :3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Backend  PID: $BACKEND_PID  → http://localhost:8000"
echo "✓ Frontend PID: $FRONTEND_PID → http://localhost:3000"
echo "✓ API Docs                    → http://localhost:8000/docs"
echo ""
echo "Press CTRL+C to stop all services"

cleanup() {
  echo "Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM
wait
