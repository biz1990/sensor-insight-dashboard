
@echo off
echo Starting Sensor Insight Dashboard...

echo Starting API server...
start cmd /k "cd server && node server.js"

echo Starting frontend...
start cmd /k "npm run dev"

echo.
echo Dashboard started! Access it at http://localhost:8080
echo.
echo Press Ctrl+C in each window to stop the servers
