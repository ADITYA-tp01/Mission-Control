# MissionControl — One-Click Start
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MissionControl - Starting Everything" -ForegroundColor Cyan
Write-Host "========================================="
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
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
Write-Host "[2/6] Starting containers..." -ForegroundColor Yellow
docker compose up -d --build 2>&1 | Out-Null
Write-Host "  PostgreSQL, Redis, MCP server started" -ForegroundColor Green

# Step 3: Wait for health
Write-Host "[3/6] Waiting for MCP server..." -ForegroundColor Yellow
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
Write-Host "[4/6] Starting dashboard..." -ForegroundColor Yellow
$dashboardDir = Join-Path $PSScriptRoot "apps\dashboard"
if (-not (Test-Path "$dashboardDir\node_modules")) {
    Push-Location $dashboardDir
    npm install --silent 2>&1 | Out-Null
    Pop-Location
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$dashboardDir'; npm run dev"
Write-Host "  Dashboard starting on http://localhost:3001" -ForegroundColor Green

# Step 5: Setup WSL - install Linux-native Node.js
Write-Host "[5/6] Setting up WSL..." -ForegroundColor Yellow
$wslLinuxNode = wsl -d Ubuntu -- bash -c 'test -f /usr/bin/node && echo ok || echo missing'
if ($wslLinuxNode -match "missing") {
    Write-Host "  Installing Node.js 22 in WSL (first time only)..." -ForegroundColor Yellow
    wsl -d Ubuntu -- bash -c 'curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/ns.sh'
    wsl -d Ubuntu -- bash -c 'sudo bash /tmp/ns.sh'
    wsl -d Ubuntu -- bash -c 'sudo apt-get install -y nodejs'
    Write-Host "  Node.js installed in WSL" -ForegroundColor Green
} else {
    Write-Host "  WSL Node.js already installed" -ForegroundColor Green
}

# Step 6: Install TrueForge in WSL
Write-Host "[6/6] Setting up TrueForge in WSL..." -ForegroundColor Yellow
$wslTf = wsl -d Ubuntu -- bash -c 'command -v trueforge 2>/dev/null || echo missing'
if ($wslTf -match "missing") {
    Write-Host "  Installing TrueForge in WSL (first time only)..." -ForegroundColor Yellow
    wsl -d Ubuntu -- bash -c 'export PATH=/usr/bin:/usr/local/bin:$PATH && npm install -g @truefoundry/trueforge'
    Write-Host "  TrueForge installed in WSL" -ForegroundColor Green
} else {
    Write-Host "  TrueForge already installed in WSL" -ForegroundColor Green
}

# Done
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Everything is running!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Now start TrueForge manually:" -ForegroundColor Cyan
Write-Host "    1. Open a NEW terminal" -ForegroundColor White
Write-Host "    2. Type: wsl" -ForegroundColor White
Write-Host "    3. Type: cd ~" -ForegroundColor White
Write-Host "    4. Type: npx @truefoundry/trueforge" -ForegroundColor White
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
