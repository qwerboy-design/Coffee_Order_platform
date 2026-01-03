# MCP Server Verification Script
# Check if Model Context Protocol (MCP) ingest server is running

Write-Host "=== MCP Server Status Check ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if port 7244 is listening
Write-Host "1. Checking port 7244..." -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String "7244"
if ($portCheck) {
    Write-Host "   [OK] Port 7244 is listening" -ForegroundColor Green
    $portCheck | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   [FAIL] Port 7244 is not listening" -ForegroundColor Red
}
Write-Host ""

# 2. Test network connection
Write-Host "2. Testing network connection..." -ForegroundColor Yellow
$connectionTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 7244 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($connectionTest) {
    Write-Host "   [OK] Connection successful (127.0.0.1:7244)" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Connection failed" -ForegroundColor Red
}
Write-Host ""

# 3. Test HTTP endpoint
Write-Host "3. Testing HTTP endpoint..." -ForegroundColor Yellow
$endpoint = "http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6"
try {
    $testBody = @{
        verify = "mcp_server_check"
        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        sessionId = "verify-session"
    } | ConvertTo-Json -Compress
    
    $response = Invoke-WebRequest -Uri $endpoint -Method POST -Body $testBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] HTTP endpoint responding" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Endpoint: $endpoint" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] HTTP endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Check log file
Write-Host "4. Checking log file..." -ForegroundColor Yellow
$logPath = ".cursor\debug.log"
if (Test-Path $logPath) {
    $logSize = (Get-Item $logPath).Length
    $logContent = Get-Content $logPath -ErrorAction SilentlyContinue
    $logLines = if ($logContent) { ($logContent | Measure-Object -Line).Lines } else { 0 }
    Write-Host "   [OK] Log file exists" -ForegroundColor Green
    Write-Host "   Path: $((Resolve-Path $logPath).Path)" -ForegroundColor Gray
    Write-Host "   Size: $logSize bytes" -ForegroundColor Gray
    Write-Host "   Lines: $logLines" -ForegroundColor Gray
    
    if ($logLines -gt 0) {
        Write-Host "   Recent log entries:" -ForegroundColor Gray
        $logContent | Select-Object -Last 3 | ForEach-Object {
            Write-Host "     $_" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "   [WARN] Log file not created yet (may not have logs written)" -ForegroundColor Yellow
}
Write-Host ""

# 5. Check related processes
Write-Host "5. Checking related processes..." -ForegroundColor Yellow
$cursorProcess = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcess) {
    Write-Host "   [OK] Cursor process is running" -ForegroundColor Green
    $cursorProcess | ForEach-Object {
        Write-Host "   PID: $($_.Id), Started: $($_.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "   [FAIL] Cursor process not running" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=== Verification Summary ===" -ForegroundColor Cyan
if ($portCheck -and $connectionTest) {
    Write-Host "[SUCCESS] MCP server is running" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Information:" -ForegroundColor Cyan
    Write-Host "  - Endpoint: $endpoint" -ForegroundColor White
    Write-Host "  - Log: $logPath" -ForegroundColor White
    Write-Host ""
    Write-Host "You can test the server with:" -ForegroundColor Cyan
    Write-Host '  $body = @{test="ping"} | ConvertTo-Json; Invoke-WebRequest -Uri "' + $endpoint + '" -Method POST -Body $body -ContentType "application/json"' -ForegroundColor DarkGray
} else {
    Write-Host "[FAILED] MCP server may not be running properly" -ForegroundColor Red
    Write-Host "Please check if Cursor is running and MCP feature is enabled" -ForegroundColor Yellow
}
