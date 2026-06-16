#!/bin/bash
echo "========================================="
echo " LegalOne Frontend Setup"
echo "========================================="
cd "$(dirname "$0")/frontend"
npm install
echo ""
echo "✓ Frontend setup complete!"
echo "  Run: cd frontend && npm run dev"
