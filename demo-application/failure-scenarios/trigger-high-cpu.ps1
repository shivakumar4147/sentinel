Write-Host "Starting controlled CPU stress..." -ForegroundColor Red

docker rm -f sentinel-ecommerce-cpu-stress 2>$null | Out-Null

docker run -d `
    --name sentinel-ecommerce-cpu-stress `
    --cpus="0.75" `
    --memory="128m" `
    python:3.11-slim `
    python -c "import time; end=time.monotonic()+180; x=0; exec('while time.monotonic() < end: x=(x+1)%1000003')"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start CPU stress." -ForegroundColor Red
    exit 1
}

Write-Host "CPU stress started for 60 seconds!" -ForegroundColor Green