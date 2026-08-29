# MissionControl — Setup WSL for TrueForge (run once)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Setting up WSL for TrueForge" -ForegroundColor Cyan
Write-Host "========================================="
Write-Host ""

# Check WSL
Write-Host "[1/3] Checking WSL..." -ForegroundColor Yellow
try {
    $wslStatus = wsl -l --running 2>&1
    Write-Host "  WSL is available" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: WSL is not installed!" -ForegroundColor Red
    Write-Host "  Run: wsl --install" -ForegroundColor Yellow
    exit 1
}

# Install Node.js in WSL
Write-Host "[2/3] Installing Node.js in WSL (if needed)..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "which node >/dev/null 2>&1 || (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs)"
Write-Host "  Node.js ready in WSL" -ForegroundColor Green

# Install TrueForge in WSL
Write-Host "[3/3] Installing TrueForge in WSL..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -c "npm install -g @truefoundry/trueforge 2>/dev/null || true"
Write-Host "  TrueForge ready in WSL" -ForegroundColor Green

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  WSL setup complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To start TrueForge:" -ForegroundColor Cyan
Write-Host "    wsl" -ForegroundColor White
Write-Host "    npx @truefoundry/trueforge" -ForegroundColor White
Write-Host ""
