# MissionControl — One-Click Start
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MissionControl - Starting Everything" -ForegroundColor Cyan
Write-Host "========================================="
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "  Docker is running" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "  ERROR: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "  1. Open Docker Desktop" -ForegroundColor Yellow
    Write-Host "  2. Wait until it says 'Docker Desktop is running'" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Step 2: Start containers
Write-Host "[2/5] Starting containers..." -ForegroundColor Yellow
docker compose up -d --build 2>&1 | Out-Null
Write-Host "  PostgreSQL, Redis, MCP server started" -ForegroundColor Green

# Step 3: Wait for health
Write-Host "[3/5] Waiting for MCP server..." -ForegroundColor Yellow
$retries = 0
while ($retries -lt 15) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 2 | Out-Null
        Write-Host "  MCP server healthy at http://localhost:8001" -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
        $retries++
    }
}
if ($retries -ge 15) {
    Write-Host "  WARNING: MCP server not responding yet" -ForegroundColor Yellow
}

# Step 4: Start dashboard
Write-Host "[4/5] Starting dashboard..." -ForegroundColor Yellow
$dashboardDir = Join-Path $PSScriptRoot "apps\dashboard"
if (-not (Test-Path "$dashboardDir\node_modules")) {
    Push-Location $dashboardDir
    npm install --silent 2>&1 | Out-Null
    Pop-Location
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$dashboardDir'; npm run dev"
Write-Host "  Dashboard starting on http://localhost:3001" -ForegroundColor Green

# Step 5: Setup WSL for TrueForge
Write-Host "[5/5] Setting up TrueForge in WSL..." -ForegroundColor Yellow
$wslNode = wsl -d Ubuntu -- bash -c "which node 2>/dev/null"
if (-not $wslNode) {
    Write-Host "  Installing Node.js in WSL..." -ForegroundColor Yellow
    wsl -d Ubuntu -- bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs" 2>&1 | Out-Null
}
$wslTf = wsl -d Ubuntu -- bash -c "which trueforge 2>/dev/null"
if (-not $wslTf) {
    Write-Host "  Installing TrueForge in WSL..." -ForegroundColor Yellow
    wsl -d Ubuntu -- bash -c "npm install -g @truefoundry/trueforge" 2>&1 | Out-Null
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "wsl -d Ubuntu"
Write-Host "  TrueForge terminal opened (WSL)" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Everything is running!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps in the WSL terminal:" -ForegroundColor Cyan
Write-Host "    npx @truefoundry/trueforge" -ForegroundColor White
Write-Host ""
Write-Host "  Then in TrueForge UI (http://localhost:3000):" -ForegroundColor Cyan
Write-Host "    1. Add your OpenAI API key" -ForegroundColor White
Write-Host "    2. Add MCP server -> http://localhost:8000/mcp" -ForegroundColor White
Write-Host "    3. Create agent 'missioncontrol'" -ForegroundColor White
Write-Host "    4. Use agent/system-prompt.md as system prompt" -ForegroundColor White
Write-Host "    5. Enable approval for rollback_deploy, restart_service" -ForegroundColor White
Write-Host ""
Write-Host "  Dashboard:    http://localhost:3001" -ForegroundColor Cyan
Write-Host "  MCP Server:   http://localhost:8001" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To stop: .\stop.ps1" -ForegroundColor Gray
Write-Host ""
