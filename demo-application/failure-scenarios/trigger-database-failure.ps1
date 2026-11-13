Write-Host "======================================" -ForegroundColor Red
Write-Host " SENTINEL: TRIGGERING DATABASE FAILURE" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Red

docker compose stop database

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to stop database." -ForegroundColor Red
    exit 1
}

Write-Host "Database failure activated successfully!" -ForegroundColor Green
Write-Host "The API should now report database unavailability."