# Surplus Food Redistribution Matcher - PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching Surplus Food Redistribution Matcher System" -ForegroundColor Green
Write-Host "  SDG 12: Responsible Consumption and Production" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nServices started! Opening browser at http://localhost:5173..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

