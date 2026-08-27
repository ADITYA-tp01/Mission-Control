# =====================================================================
#  MissionControl - ONE-COMMAND STARTUP (run after every reboot)
#  Usage:  powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1
# =====================================================================

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot

# Repository-supplied WSL launchers. Paths are resolved from this checkout via
# wslpath (the repo is mounted under /mnt/c/...), so no per-developer home
# scripts or hard-coded usernames are required. Override any of these via env.
$rootLinux = (wsl -e bash -lc "wslpath -a -u '$root'" 2>$null).Trim()
if (-not $rootLinux) { Write-Error "Could not locate this repo inside WSL (is WSL installed?)"; exit 1 }
$tfLiteLlmScript = $env:TF_LITELLM_SCRIPT
if (-not $tfLiteLlmScript) { $tfLiteLlmScript = "$rootLinux/scripts/wsl/start-litellm.sh" }
$tfRunScript = $env:TF_RUN_SCRIPT
if (-not $tfRunScript) { $tfRunScript = "$rootLinux/scripts/wsl/start-trueforge.sh" }
$litellmLog = $env:LITELLM_LOG
if (-not $litellmLog) { $litellmLog = "~/litellm.log" }
$tfLog = $env:TF_LOG
if (-not $tfLog) { $tfLog = "~/tf.log" }

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
$out = wsl -e bash -lc "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/v1/models --max-time 3"
if ($out -ne "200") {
    wsl -e bash -lc "setsid -f -- bash '$tfLiteLlmScript' </dev/null > $litellmLog 2>&1"
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
    wsl -e bash -lc "setsid -f -- bash '$tfRunScript' </dev/null > $tfLog 2>&1"
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
$compose = @()
try { docker compose version *> $null; if ($LASTEXITCODE -eq 0) { $compose = @("docker", "compose") } } catch { }
if ($compose.Count -eq 0 -and (Get-Command "docker-compose" -ErrorAction SilentlyContinue)) {
    $compose = @("docker-compose")
}
if ($compose.Count -eq 0) { Write-Error "docker compose v2 is required."; exit 1 }
$conn = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "  MCP server already running"
} else {
    & $compose up -d --build demo-infra-mcp
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
    $newTxt = Get-Content $envFile -Raw
    $changed = $false

    # Check and update each TrueForge URL variable independently, appending
    # when a variable is missing. The replacement loop emits only the new
    # value so stale lines are replaced, never duplicated.
    foreach ($key in @("TRUEFORGE_URL", "NEXT_PUBLIC_TRUEFORGE_URL")) {
        $newVal = "${key}=http://${wslIp}:3000"
        if ($newTxt -notmatch [regex]::Escape($newVal)) {
            if ($newTxt -match "^${key}=") {
                $newTxt = (($newTxt -split "`r?`n") | ForEach-Object {
                    if ($_ -match "^${key}=") { $newVal } else { $_ }
                }) -join "`n"
            } else {
                $newTxt = $newTxt.TrimEnd("`r", "`n") + "`n" + $newVal + "`n"
            }
            $changed = $true
        }
    }

    if ($changed) {
        [IO.File]::WriteAllText($envFile, $newTxt)
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
