# Stop Sentinel and Demo processes running on ports 8000, 8001, 3000, 5173
Write-Host "Stopping all Sentinel services on ports 8000, 8001, 3000, 5173..." -ForegroundColor Yellow

$ports = @(8000, 8001, 3000, 5173)
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($procId in $pids) {
                if ($procId -gt 0) {
                    Write-Host "Killing process PID $procId on port $port..." -ForegroundColor Red
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        # ignore lookup errors
    }
}

Write-Host "[OK] Ports cleared." -ForegroundColor Green

