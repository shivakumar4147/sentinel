@echo off
setlocal enabledelayedexpansion
title Sentinel Platform Controller
echo ==========================================================
echo  Starting Sentinel Full-Stack Incident Response Platform
echo ==========================================================

REM 1. Force kill any existing processes on ports 8000, 8001, 3000, 5173
echo [Prep] Releasing ports 8000, 8001, 3000, 5173...
python "%~dp0kill_ports.py"
timeout /t 2 /nobreak >nul

REM 2. Start Sentinel Backend Control Plane on Port 8000
echo.
echo [1/4] Launching Sentinel Backend Control Plane on http://localhost:8000...
start "Sentinel-Backend-8000" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

REM 3. Start Sentinel AI Engine on Port 8001
echo [2/4] Launching Sentinel AI Engine on http://localhost:8001...
start "Sentinel-AIEngine-8001" cmd /k "cd /d %~dp0ai-engine && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 3 /nobreak >nul

REM 4. Start Live Storefront on Port 5173
echo [3/4] Launching Live Storefront on http://localhost:5173...
start "Veloura-Storefront-5173" cmd /k "cd /d %~dp0demo-application\frontend && npm run dev"

timeout /t 2 /nobreak >nul

REM 5. Start Sentinel Operations Dashboard on Port 3000
echo [4/4] Launching Sentinel Dashboard on http://localhost:3000...
start "Sentinel-Dashboard-3000" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================================
echo  [OK] All 4 Sentinel microservices launched!
echo  -^> Backend Control Plane:   http://localhost:8000/docs
echo  -^> AI Investigation Engine: http://localhost:8001/docs
echo  -^> Veloura Parfums Store:   http://localhost:5173
echo  -^> Operations Dashboard:    http://localhost:3000
echo ==========================================================
