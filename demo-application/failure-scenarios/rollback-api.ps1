Write-Host "Restoring known-good API version..." -ForegroundColor Green

docker tag sentinel-ecommerce-api:known-good demo-application-api:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to restore known-good image." -ForegroundColor Red
    exit 1
}

docker compose up -d --no-build --force-recreate api

if ($LASTEXITCODE -ne 0) {
    Write-Host "API rollback failed." -ForegroundColor Red
    exit 1
}

Write-Host "Known-good API version restored!" -ForegroundColor Green