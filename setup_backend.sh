#!/bin/bash
echo "========================================="
echo " LegalOne Backend Setup"
echo "========================================="
cd "$(dirname "$0")/backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo ""
echo "✓ Backend setup complete!"
echo "  Run: cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000"
