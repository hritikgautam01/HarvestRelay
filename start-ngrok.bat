@echo off
title HarvestRelay - Ngrok Public Tunnel
echo ========================================================
echo   HarvestRelay - Live Public Sharing (ngrok)
echo ========================================================
echo.
echo [1/2] Make sure you already ran .\start-all.ps1 in another window!
echo [2/2] Launching ngrok tunnel on port 5173...
echo.
echo Share the "Forwarding" https://...ngrok-free.app link with your friends!
echo ========================================================
echo.
ngrok http 5173
pause
