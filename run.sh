#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "==================================================================="
echo "🎬 CINE-SYNAPSE: The Autonomous Studio Operating System (Studio OS)"
echo "==================================================================="

# Virtual environment resolution
if [ -f "$DIR/.venv/bin/uvicorn" ]; then
  UVICORN_BIN="$DIR/.venv/bin/uvicorn"
else
  UVICORN_BIN="python3 -m uvicorn"
fi

echo "Starting Backend API Gateway on http://localhost:8000 ..."
export PYTHONPATH="$DIR"
$UVICORN_BIN backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting Frontend Vite Development Server on http://localhost:5173 ..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "-------------------------------------------------------------------"
echo "✅ CINE-SYNAPSE Studio OS is active:"
echo "   • Studio Dashboard:   http://localhost:5173"
echo "   • OpenAPI 3.1 Specs:  http://localhost:8000/docs"
echo "   • SRE & Prometheus:   http://localhost:8000/metrics"
echo "   • Health & Readiness: http://localhost:8000/healthz | /readyz"
echo "-------------------------------------------------------------------"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT INT TERM
wait
