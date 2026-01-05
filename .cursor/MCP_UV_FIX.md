# MCP 伺服器 uv 命令問題修復指南

## 問題描述

Cursor 的 MCP（Model Context Protocol）伺服器無法啟動，錯誤訊息顯示：
```
'uv' 不是內部或外部命令、可執行的程式或批次檔。
Client error for command spawn uv ENOENT
```

## 根本原因

`uv`（Python 包管理器）已安裝，但其可執行文件所在的目錄不在 Cursor 啟動時讀取的 PATH 環境變量中。

## 診斷結果

根據系統診斷：

1. **uv 已安裝**：位於 `C:\Users\qwerb\AppData\Roaming\Python\Python314\Scripts\uv.exe`
2. **PATH 已更新**：該目錄已在用戶級 PATH 中
3. **需要重啟**：Cursor 需要重新啟動才能讀取新的 PATH

## 解決方案

### 方案 1：重新啟動 Cursor（推薦）

1. **完全關閉 Cursor**（包括所有視窗）
2. **重新啟動 Cursor**
3. **檢查 MCP 伺服器**：MCP 伺服器應該能夠自動啟動

### 方案 2：使用 python -m uv（備用方案）

如果重啟後問題仍然存在，可以在 Cursor 的 MCP 設置中修改命令：

1. 打開 Cursor 設置（Settings）
2. 導航到 **Features > MCP**
3. 找到 **Interactive Feedback MCP** 伺服器配置
4. 將命令從：
   ```
   uv --directory C:\Users\qwerb\interactive-feedback-mcp-main run server.py
   ```
   改為：
   ```
   python -m uv --directory C:\Users\qwerb\interactive-feedback-mcp-main run server.py
   ```

## 驗證修復

重新啟動 Cursor 後，MCP 伺服器應該能夠正常啟動。您可以通過以下方式驗證：

1. 查看 Cursor 的 MCP 日誌，確認沒有 `ENOENT` 錯誤
2. 檢查 MCP 伺服器是否在設置中顯示為「已連接」

## 技術細節

- **uv 版本**：0.9.21
- **Python 版本**：3.14.0
- **MCP 伺服器目錄**：`C:\Users\qwerb\interactive-feedback-mcp-main`
- **uv 安裝位置**：`C:\Users\qwerb\AppData\Roaming\Python\Python314\Scripts\`

## 相關文件

- 診斷腳本：`.cursor/diagnose_mcp_env.py`
- 驗證腳本：`.cursor/verify_uv_fix.py`
- PATH 修復腳本：`.cursor/fix_uv_path.ps1`






