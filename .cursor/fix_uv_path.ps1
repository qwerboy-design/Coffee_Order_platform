# Fix uv PATH issue PowerShell script
# Add uv Scripts directory to user PATH

$scriptsPath = "$env:APPDATA\Python\Python314\Scripts"
$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentUserPath -notlike "*$scriptsPath*") {
    Write-Host "Adding $scriptsPath to user PATH..." -ForegroundColor Yellow
    
    $newPath = $currentUserPath + ";" + $scriptsPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    
    Write-Host "Successfully added uv directory to user PATH" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: You need to restart Cursor for changes to take effect" -ForegroundColor Cyan
    Write-Host "After restart, MCP server should be able to find uv command" -ForegroundColor Cyan
} else {
    Write-Host "uv directory is already in PATH" -ForegroundColor Green
}

# Verify uv availability (requires new terminal session)
Write-Host ""
Write-Host "Verifying..." -ForegroundColor Yellow
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
$uvPath = Get-Command uv -ErrorAction SilentlyContinue

if ($uvPath) {
    Write-Host "uv command is now available in current PowerShell session" -ForegroundColor Green
    Write-Host "Location: $($uvPath.Source)" -ForegroundColor Gray
} else {
    Write-Host "uv is still not available in current session (this is normal)" -ForegroundColor Yellow
    Write-Host "Please restart Cursor and terminal" -ForegroundColor Cyan
}

# Test python -m uv as alternative
Write-Host ""
Write-Host "Testing alternative (python -m uv):" -ForegroundColor Yellow
$testResult = python -m uv --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "python -m uv is available: $testResult" -ForegroundColor Green
    Write-Host ""
    Write-Host "If PATH fix doesn't work, you can change the MCP command in Cursor settings" -ForegroundColor Cyan
    Write-Host "from 'uv --directory ...' to 'python -m uv --directory ...'" -ForegroundColor Cyan
}

