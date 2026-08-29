# MissionControl — One-Click Start
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MissionControl - Starting Everything" -ForegroundColor Cyan
Write-Host "========================================="
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/7] Checking Docker..." -ForegroundColor Yellow
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
Write-Host "[2/7] Starting containers..." -ForegroundColor Yellow
docker compose up -d --build 2>&1 | Out-Null
Write-Host "  PostgreSQL, Redis, MCP server started" -ForegroundColor Green

# Step 3: Wait for health
Write-Host "[3/7] Waiting for MCP server..." -ForegroundColor Yellow
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
Write-Host "[4/7] Starting dashboard..." -ForegroundColor Yellow
$dashboardDir = Join-Path $PSScriptRoot "apps\dashboard"
if (-not (Test-Path "$dashboardDir\node_modules")) {
    Push-Location $dashboardDir
    npm install --silent 2>&1 | Out-Null
    Pop-Location
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:NEXT_PUBLIC_TRUEFORGE_URL='http://localhost:8790'; `$env:TRUEFORGE_URL='http://localhost:8790'; cd '$dashboardDir'; npm run dev"
Write-Host "  Dashboard starting on http://localhost:3001" -ForegroundColor Green

# Step 5: Setup WSL - install Linux-native Node.js 22 locally
Write-Host "[5/7] Setting up WSL..." -ForegroundColor Yellow
$localNode = wsl -d Ubuntu -- bash -c 'if [ -x ~/.local/node/bin/node ]; then ~/.local/node/bin/node -v; fi'
if ($localNode -match "v22") {
    Write-Host "  WSL Node.js 22 already installed locally"
} else {
    Write-Host "  Installing Node.js 22 in WSL (~/.local/node)..."
    wsl -d Ubuntu -- bash -c 'mkdir -p ~/.local/node && curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz | tar -xz -C ~/.local/node --strip-components=1'
}

# Step 6: Install TrueForge in WSL
Write-Host "[6/7] Setting up TrueForge in WSL..." -ForegroundColor Yellow
$tfInstalled = wsl -d Ubuntu -- bash -c 'export PATH=~/.local/node/bin:"$PATH" && npm list -g @truefoundry/trueforge >/dev/null 2>&1 && echo "yes" || echo "no"'
if ($tfInstalled -match "yes") {
    Write-Host "  TrueForge already installed in WSL" -ForegroundColor Green
} else {
    Write-Host "  Installing @truefoundry/trueforge in WSL..."
    wsl -d Ubuntu -- bash -c 'export PATH=~/.local/node/bin:"$PATH" && npm install -g @truefoundry/trueforge'
    Write-Host "  TrueForge installed in WSL" -ForegroundColor Green
}

# Step 7: Start TrueForge
Write-Host "[7/7] Starting TrueForge in WSL..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "wsl -- bash -c 'cd `"/mnt/c/Users/adity/Documents/Mission Control/scripts/wsl`" && bash start-trueforge.sh'"
Write-Host "  TrueForge starting on http://localhost:8790" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Everything is running!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Then in TrueForge UI (http://localhost:8790):" -ForegroundColor Cyan
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
