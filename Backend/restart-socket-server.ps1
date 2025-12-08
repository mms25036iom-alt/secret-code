# PowerShell script to restart Socket.IO server
Write-Host "Stopping any process on port 5001..." -ForegroundColor Yellow

$process = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    Write-Host "Found process $process on port 5001. Killing it..." -ForegroundColor Yellow
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Process killed successfully!" -ForegroundColor Green
} else {
    Write-Host "No process found on port 5001" -ForegroundColor Green
}

Write-Host "Starting Socket.IO server..." -ForegroundColor Cyan
node socketServer.js
