# MCP 服務器驗證指南

本文檔說明如何驗證 Model Context Protocol (MCP) ingest server 是否正在運行。

## 快速驗證方法

### 方法 1: 使用驗證腳本（推薦）

執行預先準備好的驗證腳本：

```powershell
.\scripts\verify-mcp.ps1
```

這個腳本會自動檢查：
- 端口 7244 是否在監聽
- 網絡連線是否正常
- HTTP 端點是否響應
- 日誌文件是否存在
- Cursor 進程是否運行

### 方法 2: 手動驗證步驟

#### 1. 檢查端口監聽狀態

```powershell
netstat -ano | Select-String "7244"
```

**預期結果：** 應該看到類似 `TCP    127.0.0.1:7244         0.0.0.0:0              LISTENING` 的輸出

#### 2. 測試網絡連線

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 7244 -InformationLevel Quiet
```

**預期結果：** 返回 `True`

#### 3. 測試 HTTP 端點

```powershell
$endpoint = "http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6"
$body = @{
    test = "ping"
    timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json -Compress

Invoke-WebRequest -Uri $endpoint -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

**預期結果：** 
- 狀態碼: `204 No Content`
- 這表示服務器成功接收並處理了請求

#### 4. 檢查日誌文件

```powershell
Test-Path ".cursor\debug.log"
Get-Content ".cursor\debug.log" -Tail 10
```

**預期結果：** 
- 文件存在
- 如果有日誌寫入，應該看到 NDJSON 格式的日誌條目

#### 5. 檢查 Cursor 進程

```powershell
Get-Process -Name "Cursor"
```

**預期結果：** 應該看到 Cursor 進程正在運行

## MCP 服務器資訊

根據系統配置，MCP ingest server 的資訊如下：

- **端點 URL**: `http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6`
- **日誌文件路徑**: `.cursor\debug.log`
- **端口**: `7244`
- **協議**: HTTP (POST)
- **日誌格式**: NDJSON (每行一個 JSON 對象)

## 故障排除

### 如果端口未監聽

1. 確認 Cursor 是否正在運行
2. 檢查 Cursor 的 MCP 功能是否已啟用
3. 重新啟動 Cursor

### 如果 HTTP 端點測試失敗

1. 檢查防火牆設置
2. 確認沒有其他程序佔用端口 7244
3. 檢查 Cursor 的錯誤日誌

### 如果日誌文件不存在

這是正常的，日誌文件會在第一次寫入時自動創建。如果 MCP 功能尚未使用，文件可能不存在。

## 驗證 MCP 是否正常工作

除了檢查服務器狀態，您還可以：

1. **在 Cursor 中使用 AI 功能** - 如果 MCP 正常工作，AI 應該能夠訪問代碼庫上下文
2. **檢查日誌文件內容** - 查看是否有日誌寫入，確認 MCP 正在處理請求
3. **觀察 Cursor 的 AI 響應質量** - 如果 MCP 正常運行，AI 應該能夠提供更準確的上下文相關建議

## 相關命令速查

```powershell
# 快速狀態檢查
netstat -ano | Select-String "7244"
Test-NetConnection -ComputerName 127.0.0.1 -Port 7244 -InformationLevel Quiet

# 測試端點
$body = @{test="ping"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6" -Method POST -Body $body -ContentType "application/json"

# 查看日誌
Get-Content ".cursor\debug.log" -Tail 20
```

