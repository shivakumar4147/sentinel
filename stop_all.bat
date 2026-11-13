@echo off
echo Stopping Sentinel services on ports 8000, 8001, 3000, 5173...
python "%~dp0kill_ports.py"
powershell -ExecutionPolicy Bypass -File "%~dp0stop_all.ps1"
echo All services stopped.
