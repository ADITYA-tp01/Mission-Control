# MissionControl — One-Click Stop
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker compose down
Write-Host "Done." -ForegroundColor Green
