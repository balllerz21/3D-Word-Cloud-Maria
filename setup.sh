#!/bin/bash

echo "Installing backend dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "Installing frontend dependencies..."
cd ../frontend
npm install

echo "Starting servers..."

# start backend
cd ../backend
source venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!

# start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Servers running!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"

wait $BACKEND_PID $FRONTEND_PID
