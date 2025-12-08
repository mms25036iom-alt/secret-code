# Kill process on port 5001
Write-Host "Killing process on port 5001..." -ForegroundColor Yellow
Write-Host ""

$port = 5001
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "Found process ID: $process" -ForegroundColor Cyan
    Stop-Process -Id $process -Force
    Write-Host "✓ Process killed successfully!" -ForegroundColor Green
} else {
    Write-Host "No process found on port $port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Port 5001 is now free!" -ForegroundColor Green
Write-Host "You can now start your server." -ForegroundColor White
Write-Host ""
pause
