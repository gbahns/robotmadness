# Kill any existing Node process on port 3000
$port = 3000
$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess | Select-Object -Unique
    foreach ($pid in $processId) {
        Write-Host "Killing existing process $pid on port $port"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# Start the dev server
Write-Host "Starting dev server on port $port"
npm run dev