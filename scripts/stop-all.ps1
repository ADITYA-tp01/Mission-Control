# =====================================================================
#  MissionControl - STOP EVERYTHING
#  Usage:  powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
# =====================================================================

Write-Host "Stopping MissionControl..." -ForegroundColor Cyan

# Windows side: dashboard + MCP server
# Only stop processes that belong to this project (verified via command line)
# so unrelated python/node apps listening on the same ports are never killed.
$ourPatterns = @(
    "demo-infra",
    "mcp-servers",
    "server\.py",
    "apps[\\/]dashboard",
    "next[- ]dev",
    "npm.*run[, ]dev"
)
foreach ($port in 3001, 8001, 8000) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object {
                $p = Get-Process -Id $_ -ErrorAction SilentlyContinue
                if (-not $p) { return }
                $cmd = ""
                try { $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)").CommandLine } catch { }
                $ours = ($cmd -match ($ourPatterns -join "|"))
                if ($p.ProcessName -in @("python", "node") -and $ours) {
                    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
                    Write-Host "  stopped $($p.ProcessName) (port $port)"
                } else {
                    Write-Host "  skipped port $port pid $($p.Id) ($($p.ProcessName)) - not a MissionControl process" -ForegroundColor Yellow
                }
            }
    }
}

# WSL side: TrueForge + LiteLLM (repo launchers and the processes they exec)
wsl -e bash -lc "pkill -f '[s]tart-trueforge' 2>/dev/null; pkill -f '[t]rueforge' 2>/dev/null; pkill -9 -f '[s]tart-litellm' 2>/dev/null; pkill -9 -f '[l]itellm' 2>/dev/null; echo wsl-stopped"

Write-Host "Done. (WSL VM itself keeps running; use 'wsl --shutdown' to fully stop it.)" -ForegroundColor Green
