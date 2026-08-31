# MissionControl — One-Click Stop
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker compose down

Write-Host "Stopping Dashboard..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Write-Host "Done." -ForegroundColor Green
