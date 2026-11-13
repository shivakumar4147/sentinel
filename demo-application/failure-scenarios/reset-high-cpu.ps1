Write-Host "Stopping CPU stress..." -ForegroundColor Green

docker rm -f sentinel-ecommerce-cpu-stress

if ($LASTEXITCODE -eq 0) {
    Write-Host "CPU stress stopped successfully!" -ForegroundColor Green
}
else {
    Write-Host "CPU stress container already stopped." -ForegroundColor Yellow
}