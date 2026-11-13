# Sentinel Full-Stack Startup Script
# Launches Backend (8000), AI Engine (8001), Storefront (5173), and Dashboard (3000).

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Sentinel Full-Stack Incident Response Platform " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Kill stale processes
Write-Host "[Step 0/4] Releasing ports 8000, 8001, 3000, 5173..." -ForegroundColor Yellow
python "$root\kill_ports.py"
Start-Sleep -Seconds 2

# 2. Start Sentinel Backend on Port 8000
Write-Host ""
Write-Host "[1/4] Launching Sentinel Backend Control Plane on http://localhost:8000..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\backend`" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

# 3. Start Sentinel AI Investigation Engine on Port 8001
Write-Host "[2/4] Launching Sentinel AI Investigation Engine on http://localhost:8001..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\ai-engine`" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

Start-Sleep -Seconds 3

# 4. Start Live Storefront on Port 5173
Write-Host "[3/4] Launching Live Storefront on http://localhost:5173..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\demo-application\frontend`" && npm run dev"

Start-Sleep -Seconds 2

# 5. Start Sentinel Dashboard on Port 3000
Write-Host "[4/4] Launching Sentinel Dashboard on http://localhost:3000..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\frontend`" && npm run dev"

Write-Host ""
Write-Host "[OK] All 4 services launched in separate windows!" -ForegroundColor Cyan
Write-Host "-> Backend Control Plane:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "-> AI Engine API:          http://localhost:8001/docs" -ForegroundColor White
Write-Host "-> Live Storefront:        http://localhost:5173" -ForegroundColor White
Write-Host "-> Operations Dashboard:   http://localhost:3000" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
