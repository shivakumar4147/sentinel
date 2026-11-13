Write-Host "======================================" -ForegroundColor Green
Write-Host " SENTINEL: RECOVERING DATABASE" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

docker compose start database

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start database." -ForegroundColor Red
    exit 1
}

Write-Host "Waiting for PostgreSQL to become healthy..."

$healthy = $false

for ($i = 1; $i -le 30; $i++) {
    $status = docker inspect sentinel-ecommerce-db --format '{{.State.Health.Status}}'

    if ($status -eq "healthy") {
        $healthy = $true
        break
    }

    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host "Database did not become healthy in time." -ForegroundColor Red
    exit 1
}

Write-Host "Database recovered successfully!" -ForegroundColor Green