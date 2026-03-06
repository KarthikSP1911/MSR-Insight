#!/bin/bash

echo "🚀 Starting Smart Report Generator Services..."

# 1. Start FastAPI (Background)
echo "▶️  Starting FastAPI (Port 8000)..."
cd backend/fastapi
# Use the executable directly from the virtual environment
./venv/Scripts/uvicorn.exe main:app --reload --port 8000 &
FASTAPI_PID=$!
cd ../..

# 2. Start Express (Background)
echo "▶️  Starting Express (Port 5000)..."
cd backend/express
node server.js &
EXPRESS_PID=$!
cd ../..

# 3. Start React/Frontend (Background)
echo "▶️  Starting React (Port 5173)..."
cd frontend
npm run dev &
REACT_PID=$!
cd ..

echo "✅ All services started successfully!"
echo "   - FastAPI PID: $FASTAPI_PID"
echo "   - Express PID: $EXPRESS_PID"
echo "   - React PID:   $REACT_PID"
echo ""
echo "Press [CTRL+C] to terminate all services."

# Trap SIGINT to kill background processes gracefully when the terminal is closed/cancelled
trap "kill $FASTAPI_PID $EXPRESS_PID $REACT_PID" SIGINT

# Wait for background processes to keep script running
wait $FASTAPI_PID $EXPRESS_PID $REACT_PID
