#!/bin/bash

echo "Starting Sensor Insight Dashboard..."

# Start the API server in the background
echo "Starting API server..."
cd server && node server.js &
SERVER_PID=$!

# Wait a moment before starting the frontend
sleep 2

# Go back to the main directory
cd ..

# Start the frontend
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo "Shutting down..."
  kill $SERVER_PID
  kill $FRONTEND_PID
  exit 0
}

# Register the cleanup function for when the script is terminated
trap cleanup SIGINT SIGTERM

echo ""
echo "Dashboard started! Access it at http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to press Ctrl+C
wait