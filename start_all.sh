#!/bin/bash
echo "Starting LegalOne System..."
# Start backend in background
(cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!
# Start frontend in background
(cd frontend && npm run dev) &
FRONTEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Open http://localhost:3000"
echo "Press CTRL+C to stop all services"
wait
