# =====================================================================
#  MissionControl - STOP EVERYTHING
#  Usage:  powershell -ExecutionPolicy Bypass -File scripts\stop-all.ps1
# =====================================================================

Write-Host "Stopping MissionControl..." -ForegroundColor Cyan

# Windows side: dashboard + MCP server
foreach ($port in 3001, 8001, 8000) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object {
                $p = Get-Process -Id $_ -ErrorAction SilentlyContinue
                if ($p -and $p.ProcessName -in @("python", "node")) {
                    Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
                    Write-Host "  stopped $($p.ProcessName) (port $port)"
                }
            }
    }
}

# WSL side: TrueForge + LiteLLM
wsl -e bash -lc "pkill -f '[t]f-run' 2>/dev/null; pkill -9 -f '[l]itellm' 2>/dev/null; echo wsl-stopped"

Write-Host "Done. (WSL VM itself keeps running; use 'wsl --shutdown' to fully stop it.)" -ForegroundColor Green
