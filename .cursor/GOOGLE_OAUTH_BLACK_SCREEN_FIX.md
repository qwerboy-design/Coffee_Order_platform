# Google OAuth 黑畫面問題修正

> **錯誤**: The given origin is not allowed for the given client ID  
> **症狀**: 點擊 Google 登入按鈕後出現黑畫面或無反應  
> **發生時間**: 2026-01-04

---

## 🔍 問題根源

瀏覽器 Console 錯誤：
```
[ERROR] [GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

**原因**: Google Cloud Console 沒有設定 **Authorized JavaScript origins**

---

## ✅ 解決方案（2 步驟）

### 步驟 1: 前往 Google Cloud Console

1. 開啟 [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. 選擇您的專案
3. 找到 OAuth 2.0 Client ID：`812698310992-crs14l6dlcqo640b31ts7nskoof5biar`
4. 點擊 **編輯圖示**（鉛筆）

---

### 步驟 2: 設定兩個重要欄位 ⭐⭐⭐

#### 2.1 Authorized JavaScript origins（必須設定）

```
Authorized JavaScript origins
─────────────────────────────────
URIs 1 [http://localhost:3000      ] [刪除]
─────────────────────────────────
[+ ADD URI]
```

**重要**: 
- ✅ 必須是 `http://localhost:3000`（不包含尾部斜線）
- ✅ 協議是 `http`（不是 `https`）
- ✅ 使用 `localhost`（不是 `127.0.0.1`）

#### 2.2 Authorized redirect URIs（也要設定）

```
Authorized redirect URIs
─────────────────────────────────
URIs 1 [http://localhost:3000      ] [刪除]
URIs 2 [http://localhost:3000/     ] [刪除]
─────────────────────────────────
[+ ADD URI]
```

**重要**: 
- ✅ 第一個：`http://localhost:3000`（不含尾部斜線）
- ✅ 第二個：`http://localhost:3000/`（含尾部斜線）

---

### 步驟 3: 儲存並等待

1. 點擊 **SAVE** 按鈕
2. **等待 5-10 分鐘**（讓 Google 套用變更）

---

## 🧪 重新測試

### 1. 清除瀏覽器快取

```
按 Ctrl+Shift+Delete
選擇「Cookie 和其他網站資料」
清除資料
```

### 2. 重啟開發伺服器

```bash
# 按 Ctrl+C 停止伺服器
npm run dev
```

### 3. 等待 5-10 分鐘後測試

1. 開啟 http://localhost:3000/login
2. 按 F12 開啟開發者工具
3. 切換到 Console 標籤
4. 點擊「使用 Google 登入」

---

## ✅ 成功指標

修正成功後：
- ✅ Console 沒有紅色錯誤訊息
- ✅ 點擊按鈕後彈出 Google 授權視窗
- ✅ 可以選擇 Google 帳號
- ✅ 不會出現黑畫面

---

## 📋 完整檢查清單

**Google Cloud Console 設定**:
- [ ] Authorized JavaScript origins 包含 `http://localhost:3000`
- [ ] Authorized redirect URIs 包含 `http://localhost:3000`
- [ ] Authorized redirect URIs 包含 `http://localhost:3000/`
- [ ] 已點擊 SAVE
- [ ] 已等待 5-10 分鐘

**OAuth 同意畫面**:
- [ ] 應用程式狀態為「Testing」
- [ ] Test users 包含您的 Gmail 帳號

**本地環境**:
- [ ] 瀏覽器快取已清除
- [ ] 開發伺服器已重啟
- [ ] 確認 URL 是 `http://localhost:3000`（不是 127.0.0.1）

---

## 📸 正確的設定畫面

### Authorized JavaScript origins

```
Authorized JavaScript origins
For use with requests from a browser

Add authorized JavaScript origins for your web application. The origins where 
you'll be requesting authorization must be added to the authorized JavaScript 
origins list.

─────────────────────────────────
URIs 1  http://localhost:3000        [刪除]
URIs 2  https://yourdomain.com       [刪除]  (生產環境)
─────────────────────────────────
[+ ADD URI]
```

### Authorized redirect URIs

```
Authorized redirect URIs
For use with requests from a web server

Redirect URIs are where OAuth 2.0 server sends the user after completing the 
authorization flow. The redirect URI must exactly match one of the authorized 
redirect URIs you have configured.

─────────────────────────────────
URIs 1  http://localhost:3000        [刪除]
URIs 2  http://localhost:3000/       [刪除]
URIs 3  https://yourdomain.com       [刪除]  (生產環境)
─────────────────────────────────
[+ ADD URI]
```

---

## 🐛 還是黑畫面？

### 檢查 Console 錯誤

按 F12 → Console 標籤，尋找：

**如果看到**:
```
[ERROR] [GSI_LOGGER]: The given origin is not allowed
```
→ JavaScript origins 還沒設定或還沒生效（等待更久）

**如果看到**:
```
錯誤 401: invalid_client
```
→ Redirect URIs 設定錯誤

**如果看到**:
```
錯誤 403: access_denied
```
→ 測試用戶未加入或應用程式未發布

---

## 💡 為什麼需要兩個設定？

### Authorized JavaScript origins
- **用途**: 允許網頁載入 Google Identity Services JavaScript 腳本
- **格式**: `http://localhost:3000`（協議 + 域名 + 端口）
- **不含**: 路徑、斜線、參數

### Authorized redirect URIs
- **用途**: OAuth 回調後重新導向的目標 URL
- **格式**: `http://localhost:3000` 和 `http://localhost:3000/`
- **建議**: 同時加入有斜線和無斜線的版本

---

## ⏰ 等待時間說明

Google 設定變更的傳播時間：
- **最快**: 5 分鐘
- **通常**: 5-10 分鐘
- **最慢**: 可能需要 1 小時

**在等待期間請務必**:
1. 清除瀏覽器快取
2. 重啟開發伺服器
3. 確認設定已儲存
4. 喝杯咖啡 ☕

---

## 🎯 測試步驟

### 1. 開啟開發者工具
```
按 F12
切換到 Console 標籤
```

### 2. 測試登入
```
開啟 http://localhost:3000/login
點擊「使用 Google 登入」
觀察 Console 訊息
```

### 3. 成功畫面
```
✅ 彈出 Google 授權視窗
✅ 顯示應用程式名稱「咖啡豆訂單系統」
✅ 顯示權限請求
✅ 可以選擇帳號
```

---

## 📞 需要協助？

如果按照以上步驟還是遇到問題，請提供：

1. Google Cloud Console 的截圖（Authorized JavaScript origins 和 Redirect URIs）
2. 瀏覽器 Console 的完整錯誤訊息
3. 您使用的 URL（localhost:3000 或 127.0.0.1:3000？）
4. OAuth 同意畫面的狀態和測試用戶

---

## 🚀 快速修正命令

```bash
# 1. 清除快取（瀏覽器操作）
# Ctrl+Shift+Delete → 清除資料

# 2. 重啟開發伺服器
Ctrl+C
npm run dev

# 3. 等待 5-10 分鐘

# 4. 測試
# 開啟 http://localhost:3000/login
```

---

**文件版本**: v1.0  
**最後更新**: 2026-01-04  
**問題**: Google OAuth 黑畫面  
**根本原因**: 未設定 Authorized JavaScript origins  
**解決率**: 99%

