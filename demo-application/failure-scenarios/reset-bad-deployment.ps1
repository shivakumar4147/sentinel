Write-Host "Restoring the normal API deployment..." -ForegroundColor Green

docker compose -f docker-compose.yml up -d --force-recreate api

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to restore normal API deployment." -ForegroundColor Red
    exit 1
}

Write-Host "Normal API deployment restored!" -ForegroundColor Green