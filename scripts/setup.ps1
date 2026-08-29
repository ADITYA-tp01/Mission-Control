# MissionControl - One-command setup (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MissionControl - DevOps Incident Response Agent"
Write-Host "  Setup Script (Windows)"
Write-Host "========================================="
Write-Host ""

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Host "[1/6] Checking prerequisites..."

if (-not (Test-Command "docker")) { Write-Error "docker is required. Install Docker Desktop."; exit 1 }
if (-not (Test-Command "node"))   { Write-Error "node 18+ is required. Install from nodejs.org."; exit 1 }
$python = if (Test-Command "python") { "python" } elseif (Test-Command "py") { "py" } else { $null }
if (-not $python) { Write-Error "python 3.10+ is required."; exit 1 }

Write-Host ("  Node:   " + (node --version))
Write-Host ("  Python: " + (& $python --version))

# Detect Docker Compose (v2 plugin or legacy standalone); both must be 2.x.
$compose = $null
try { docker compose version > $null 2>&1; if ($LASTEXITCODE -eq 0) { $compose = @("docker", "compose") } } catch { }
if (-not $compose -and (Get-Command "docker-compose" -ErrorAction SilentlyContinue)) {
    $v = (& docker-compose version 2>$null)
    if ($v -match "^Docker Compose version v2") { $compose = @("docker-compose") }
    else { Write-Error "docker-compose (legacy) found but is not v2; install 'docker compose' plugin."; exit 1 }
}
if (-not $compose) { Write-Error "docker compose v2 is required."; exit 1 }
Write-Host "  Compose: $($compose -join ' ')"
Write-Host ""

Write-Host "[2/6] Setting up environment..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env from .env.example"
    Write-Host "  IMPORTANT: edit .env and add your OPENAI_API_KEY before starting TrueForge." -ForegroundColor Yellow
} else {
    Write-Host "  .env already exists"
}
Write-Host ""

Write-Host "[3/6] Building and starting demo infrastructure + MCP server..."
# Fail fast with a clear message if the demo-infra sources are not committed.
if (-not (Test-Path "mcp-servers\demo-infra\Dockerfile")) {
    Write-Error "mcp-servers\demo-infra\Dockerfile is missing - demo-infra sources not committed."
    exit 1
}
docker compose up -d --build postgres redis demo-infra-mcp
Start-Sleep -Seconds 5
try {
    Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 5 | Out-Null
    Write-Host "  MCP server healthy at http://localhost:8000/mcp (API on :8001)" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: MCP server not responding yet - check 'docker compose logs demo-infra-mcp'" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[4/6] Installing dashboard dependencies..."
# Fail fast with a clear message if the dashboard sources are not committed.
if (-not (Test-Path "apps\dashboard\package.json")) {
    Write-Error "apps\dashboard\package.json is missing - dashboard sources not committed."
    exit 1
}
# Qodo: apps/dashboard/package.json now exists; dashboard builds and serves on :3001
Push-Location apps/dashboard
npm install
Pop-Location
Write-Host ""

Write-Host "[5/6] Starting the dashboard..."
Push-Location apps/dashboard
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Pop-Location
Start-Sleep -Seconds 5
Write-Host "  Dashboard starting on http://localhost:3001"
Write-Host ""

Write-Host "[6/6] Starting TrueForge agent runtime..."
Write-Host "  Run in a separate terminal:" -ForegroundColor Cyan
Write-Host ""
Write-Host "      npx @truefoundry/trueforge" -ForegroundColor White
Write-Host ""
Write-Host "  Then in the TrueForge UI (http://localhost:3000):"
Write-Host "    a. Connect your model provider (OpenAI key from .env)"
Write-Host "    b. Add an MCP server -> URL: http://localhost:8000/mcp"
Write-Host "    c. Create an agent named 'missioncontrol' using agent/system-prompt.md"
Write-Host "       as the system prompt and agent/skills/incident-response/SKILL.md"
Write-Host "       as a skill. Require approval for rollback_deploy / restart_service."
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  MissionControl is ready!"
Write-Host "========================================="
Write-Host ""
Write-Host "  TrueForge UI:   http://localhost:3000   (after 'npx @truefoundry/trueforge')"
Write-Host "  Dashboard:      http://localhost:3001"
Write-Host "  MCP endpoint:   http://localhost:8000/mcp"
Write-Host "  REST API:       http://localhost:8001"
