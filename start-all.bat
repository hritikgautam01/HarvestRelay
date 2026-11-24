@echo off
echo ========================================================
echo  Starting Surplus Food Redistribution Matcher System
echo  Backend: http://localhost:3001
echo  Frontend: http://localhost:5173
echo ========================================================
echo.

start "Surplus Food Matcher - Backend (NestJS + Socket.IO)" cmd /k "cd backend && npm run start:dev"
start "Surplus Food Matcher - Frontend (React + Vite + Leaflet)" cmd /k "cd frontend && npm run dev"

echo Both services launched in separate windows!
echo Open your browser at http://localhost:5173

