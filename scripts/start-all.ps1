# =====================================================================
#  MissionControl - ONE-COMMAND STARTUP (run after every reboot)
#  Usage:  powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
# =====================================================================

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot

# Configurable paths (override via env vars)
$wslUser = $env:WSL_USER
if (-not $wslUser) { $wslUser = "aditya" }
$tfRunScript = $env:TF_RUN_SCRIPT
if (-not $tfRunScript) { $tfRunScript = "/home/$wslUser/tf-run.sh" }
$tfLiteLlmScript = $env:TF_LITELLM_SCRIPT
if (-not $tfLiteLlmScript) { $tfLiteLlmScript = "/home/$wslUser/tf-litellm.sh" }
$litellmLog = $env:LITELLM_LOG
if (-not $litellmLog) { $litellmLog = "/home/$wslUser/litellm.log" }
$tfLog = $env:TF_LOG
if (-not $tfLog) { $tfLog = "/home/$wslUser/tf.log" }
$mcpDir = Join-Path $root "mcp-servers\demo-infra"

Write-Host ""
Write-Host "=== MissionControl startup ===" -ForegroundColor Cyan

# ---------------------------------------------------------------- [1/8]
Write-Host "[1/8] Checking WSL..."
$wslOk = $false
try {
    $null = wsl -e bash -lc "echo ok" 2>$null
    if ($LASTEXITCODE -eq 0) { $wslOk = $true }
} catch { }
if (-not $wslOk) {
    Write-Host "  ERROR: WSL not reachable. Run: wsl --install" -ForegroundColor Red
    exit 1
}
Write-Host "  WSL OK"

# ---------------------------------------------------------------- [2/8]
Write-Host "[2/8] Detecting IP addresses..."
$wslIp = (wsl -e bash -lc "hostname -I").Trim().Split(" ")[0]
$gw    = (wsl -e bash -lc "ip route show default | head -1 | awk '{print `$3}'").Trim()
Write-Host "  WSL IP (TrueForge):   $wslIp"
Write-Host "  Windows host (MCP):   $gw  (seen from WSL)"

# ---------------------------------------------------------------- [3/8]
Write-Host "[3/8] Starting LiteLLM bridge (WSL :4000)..."
wsl -e bash -lc "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/v1/models --max-time 3" | Out-Null
$litUp = ($LASTEXITCODE -eq 0)
$out = wsl -e bash -lc "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/v1/models --max-time 3"
if ($out -ne "200") {
    wsl -e bash -lc "setsid -f -- $tfLiteLlmScript </dev/null > $litellmLog 2>&1"
    Start-Sleep -Seconds 8
    $out = wsl -e bash -lc "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/v1/models --max-time 3"
}
if ($out -eq "200") { Write-Host "  LiteLLM: UP" -ForegroundColor Green }
else { Write-Host "  LiteLLM: FAILED to start (check WSL ~/litellm.log)" -ForegroundColor Red }

# ---------------------------------------------------------------- [4/8]
Write-Host "[4/8] Starting TrueForge (WSL :3000)..."
$out = ""
try { $out = (wsl -e bash -lc "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 --max-time 4") } catch { $out = "000" }
if ($out -ne "200") {
    wsl -e bash -lc "setsid -f -- $tfRunScript </dev/null > $tfLog 2>&1"
    $up = $false
    foreach ($i in 1..24) {
        Start-Sleep -Seconds 5
        $out = wsl -e bash -lc "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 --max-time 4"
        if ($out -eq "200") { $up = $true; break }
    }
    if (-not $up) { Write-Host "  TrueForge: FAILED (check WSL ~/tf.log)" -ForegroundColor Red }
}
$out = wsl -e bash -lc "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 --max-time 4"
if ($out -eq "200") { Write-Host "  TrueForge: UP" -ForegroundColor Green }

# ---------------------------------------------------------------- [5/8]
Write-Host "[5/8] Starting demo-infra MCP server via Docker Compose..."
$composeBin = "docker"
if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    $composeBin = "docker-compose"
}
$conn = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "  MCP server already running"
} else {
    & $composeBin compose up -d --build demo-infra-mcp
    Start-Sleep -Seconds 8
    try {
        $h = Invoke-RestMethod "http://localhost:8001/health" -TimeoutSec 10
        Write-Host "  MCP server: UP ($($h.status))" -ForegroundColor Green
    } catch { Write-Host "  MCP server: did not respond (check 'docker compose logs demo-infra-mcp')" -ForegroundColor Red }
}

# ---------------------------------------------------------------- [6/8]
Write-Host "[6/8] Keeping TrueForge MCP registration pointed at this machine..."
try {
    $mcp = Invoke-RestMethod "http://${wslIp}:3000/api/v1/settings/mcp-servers" -TimeoutSec 10
    $current = ($mcp | ConvertTo-Json -Depth 6)
    $want = "http://${gw}:8000/mcp"
    if ($current -notmatch [regex]::Escape($want)) {
        $body = @{ manifest = @{
            type = "remote"; name = "demo-infra"; url = $want
            description = "Simulated production infra: 4 services with metrics, logs, deploys, chaos injection and approval-gated rollback/restart tools."
        } } | ConvertTo-Json -Depth 6
        Invoke-RestMethod -Method Put -Uri "http://${wslIp}:3000/api/v1/settings/mcp-servers" `
            -ContentType "application/json" -Body $body -TimeoutSec 15 | Out-Null
        Write-Host "  MCP registration updated -> $want" -ForegroundColor Yellow
    } else {
        Write-Host "  MCP registration already correct"
    }
} catch {
    Write-Host "  WARNING: could not verify/update MCP registration: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ---------------------------------------------------------------- [7/8]
Write-Host "[7/8] Starting dashboard (Windows :3001)..."
$npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npm) { $npm = (Get-Command npm -ErrorAction SilentlyContinue).Source }
if (-not $npm) { $npm = "npm"; Write-Host "  WARNING: npm not found on PATH; assuming 'npm'" -ForegroundColor Yellow }
$envFile = Join-Path $root "apps\dashboard\.env.local"
$needRestart = $false
if (Test-Path $envFile) {
    $envTxt = Get-Content $envFile -Raw
    if ($envTxt -notmatch [regex]::Escape("TRUEFORGE_URL=http://${wslIp}:3000")) {
        $envTxt = ($envTxt -split "`n" | ForEach-Object {
            if ($_ -match "^TRUEFORGE_URL=")            { "TRUEFORGE_URL=http://${wslIp}:3000" }
            elseif ($_ -match "^NEXT_PUBLIC_TRUEFORGE_URL=") { "NEXT_PUBLIC_TRUEFORGE_URL=http://${wslIp}:3000" }
            else { $_ }
        }) -join "`n"
        [IO.File]::WriteAllText($envFile, $envTxt)
        $needRestart = $true
        Write-Host "  .env.local updated with new WSL IP" -ForegroundColor Yellow
    }
}
$conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    if ($needRestart) {
        $conn | Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
        Start-Process $npm -ArgumentList "run","dev" `
            -WindowStyle Hidden -WorkingDirectory (Join-Path $root "apps\dashboard")
        Write-Host "  dashboard restarted with new IP"
    } else {
        Write-Host "  already running"
    }
} else {
    Start-Process $npm -ArgumentList "run","dev" `
            -WindowStyle Hidden -WorkingDirectory (Join-Path $root "apps\dashboard")
    Write-Host "  dashboard starting..."
}
$dashUp = $false
foreach ($i in 1..15) {
    Start-Sleep -Seconds 4
    try { Invoke-RestMethod "http://localhost:3001/api/infra" -TimeoutSec 8 | Out-Null; $dashUp = $true; break } catch { }
}
if ($dashUp) { Write-Host "  dashboard: UP" -ForegroundColor Green } else { Write-Host "  dashboard: still booting (give it 30s)" -ForegroundColor Yellow }

# ---------------------------------------------------------------- [8/8]
Write-Host "[8/8] Health summary"
try {
    $snap = Invoke-RestMethod "http://localhost:3001/api/infra" -TimeoutSec 10
    Write-Host ("  dashboard -> MCP: connected={0}, services={1}, alerts={2}" -f $snap.connected, $snap.services.Count, $snap.alerts.Count)
} catch { Write-Host "  dashboard API not responding yet" -ForegroundColor Yellow }

Write-Host ""
Write-Host "=== READY ===" -ForegroundColor Cyan
$tfUrl = "http://${wslIp}:3000"
Write-Host "  Dashboard      : http://localhost:3001"
Write-Host "  TrueForge UI   : ${tfUrl}"
Write-Host "  MCP endpoint   : http://localhost:8000/mcp"
if ($needRestart) {
    Write-Host "  NOTE: TrueForge URL changed - close old tabs and reopen ${tfUrl}" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Run a demo: Dashboard -> Chaos Lab -> Inject -> approve in TrueForge chat"
Write-Host ""
