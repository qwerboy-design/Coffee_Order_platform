# Cursor Usage Statistics Checker
# 查詢 Cursor 快速呼叫模型的使用次數

Write-Host "=== Cursor 使用統計查詢 ===" -ForegroundColor Cyan
Write-Host ""

# 檢查常見的配置和狀態文件位置
$searchPaths = @(
    "$env:APPDATA\Cursor",
    "$env:LOCALAPPDATA\Cursor",
    "$env:USERPROFILE\.cursor"
)

Write-Host "1. 搜尋使用統計相關文件..." -ForegroundColor Yellow

$foundFiles = @()
foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "   檢查: $path" -ForegroundColor Gray
        $files = Get-ChildItem $path -Recurse -Include "*usage*","*stats*","*quota*","*state*.json","*.db" -ErrorAction SilentlyContinue | 
                 Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*\.git*" }
        $foundFiles += $files
    }
}

if ($foundFiles.Count -gt 0) {
    Write-Host "   找到 $($foundFiles.Count) 個相關文件" -ForegroundColor Green
    $foundFiles | ForEach-Object {
        Write-Host "   - $($_.FullName)" -ForegroundColor Gray
    }
} else {
    Write-Host "   未找到明顯的使用統計文件" -ForegroundColor Yellow
}
Write-Host ""

# 檢查 Cursor 設置文件
Write-Host "2. 檢查 Cursor 用戶設置..." -ForegroundColor Yellow
$settingsPath = "$env:APPDATA\Cursor\User\settings.json"
if (Test-Path $settingsPath) {
    Write-Host "   設置文件存在: $settingsPath" -ForegroundColor Green
    try {
        $settings = Get-Content $settingsPath | ConvertFrom-Json
        $settings | Get-Member -MemberType NoteProperty | ForEach-Object {
            if ($_.Name -like "*usage*" -or $_.Name -like "*quota*" -or $_.Name -like "*fast*") {
                Write-Host "   $($_.Name): $($settings.($_.Name))" -ForegroundColor Cyan
            }
        }
    } catch {
        Write-Host "   無法解析設置文件" -ForegroundColor Red
    }
} else {
    Write-Host "   設置文件不存在" -ForegroundColor Yellow
}
Write-Host ""

# 檢查工作區存儲
Write-Host "3. 檢查工作區存儲..." -ForegroundColor Yellow
$workspaceStoragePath = "$env:APPDATA\Cursor\User\workspaceStorage"
if (Test-Path $workspaceStoragePath) {
    $workspaces = Get-ChildItem $workspaceStoragePath -Directory | Select-Object -First 5
    Write-Host "   找到 $($workspaces.Count) 個工作區" -ForegroundColor Gray
    foreach ($ws in $workspaces) {
        $stateFiles = Get-ChildItem $ws.FullName -Filter "*.json" -ErrorAction SilentlyContinue
        if ($stateFiles) {
            Write-Host "   工作區: $($ws.Name)" -ForegroundColor Gray
            $stateFiles | ForEach-Object {
                if ((Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) -match "usage|quota|fast") {
                    Write-Host "     - $($_.Name)" -ForegroundColor Cyan
                }
            }
        }
    }
} else {
    Write-Host "   工作區存儲目錄不存在" -ForegroundColor Yellow
}
Write-Host ""

# 檢查日誌文件
Write-Host "4. 檢查日誌文件..." -ForegroundColor Yellow
$logPath = "$env:APPDATA\Cursor\logs"
if (Test-Path $logPath) {
    $recentLogs = Get-ChildItem $logPath -Filter "*.log" -ErrorAction SilentlyContinue | 
                  Sort-Object LastWriteTime -Descending | Select-Object -First 5
    if ($recentLogs) {
        Write-Host "   最近的日誌文件:" -ForegroundColor Gray
        $recentLogs | ForEach-Object {
            Write-Host "     - $($_.Name) (修改時間: $($_.LastWriteTime))" -ForegroundColor Gray
            # 檢查日誌中是否有使用相關的內容
            $logContent = Get-Content $_.FullName -Tail 50 -ErrorAction SilentlyContinue | Out-String
            if ($logContent -match "usage|quota|fast.*model|api.*call") {
                Write-Host "       包含使用相關信息" -ForegroundColor Cyan
            }
        }
    }
} else {
    Write-Host "   日誌目錄不存在" -ForegroundColor Yellow
}
Write-Host ""

# 重要提示
Write-Host "=== 重要提示 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cursor 的使用統計通常通過以下方式查看:" -ForegroundColor White
Write-Host "1. 在 Cursor 中按 Ctrl+Shift+P (或 Cmd+Shift+P)" -ForegroundColor Yellow
Write-Host "2. 輸入 'Usage' 或 'Quota' 查看相關命令" -ForegroundColor Yellow
Write-Host "3. 或者點擊 Cursor 底部狀態欄查看使用信息" -ForegroundColor Yellow
Write-Host ""
Write-Host "如果 Cursor 有 Web 控制台，可以訪問:" -ForegroundColor White
Write-Host "- https://cursor.sh/settings (需要登入)" -ForegroundColor Cyan
Write-Host ""
Write-Host "注意: Cursor 的使用統計可能儲存在雲端，本地可能無法直接查詢。" -ForegroundColor Yellow
