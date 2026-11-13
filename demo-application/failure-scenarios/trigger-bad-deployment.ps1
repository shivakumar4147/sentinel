Write-Host "======================================" -ForegroundColor Red
Write-Host " SENTINEL: TRIGGERING BAD DEPLOYMENT" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red

docker compose -f docker-compose.yml -f docker-compose.bad-deployment.yml up -d --force-recreate api

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to activate bad deployment." -ForegroundColor Red
    exit 1
}

Write-Host "Bad deployment activated successfully!" -ForegroundColor Green