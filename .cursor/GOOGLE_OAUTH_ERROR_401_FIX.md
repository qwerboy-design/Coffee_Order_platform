# Google OAuth 錯誤 401: invalid_client 解決方案

> **錯誤訊息**: 已封鎖存取權：授權錯誤  
> **錯誤代碼**: 401: invalid_client  
> **發生時間**: 2026-01-04

---

## 🔍 問題診斷

### 錯誤原因

**"invalid_client"** 錯誤通常由以下原因造成：

1. ❌ **授權重新導向 URI 未設定或設定錯誤**（最常見）
2. ❌ Client ID 或 Client Secret 錯誤
3. ❌ OAuth 同意畫面設定不完整
4. ❌ 應用程式狀態為「測試中」且未加入測試用戶

---

## ✅ 解決方案

### 方案 1: 檢查授權重新導向 URI（最重要）⭐

#### 步驟 1: 前往 Google Cloud Console

1. 開啟 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇您的專案
3. 左側選單 → **APIs & Services** → **Credentials**
4. 找到您的 OAuth 2.0 Client ID 並點擊編輯（鉛筆圖示）

#### 步驟 2: 設定授權重新導向 URI

在 **Authorized redirect URIs** 區域，確認包含以下 URI：

```
http://localhost:3000
http://localhost:3000/
```

**重要**: 
- ⚠️ 必須是 `http://localhost:3000`（不是 `http://127.0.0.1:3000`）
- ⚠️ 結尾有無 `/` 都建議加入
- ⚠️ 不需要加入 `/login` 或 `/register`（Google Identity Services 會自動處理）

#### 步驟 3: 儲存變更

1. 點擊 **SAVE**
2. **等待 5-10 分鐘**讓 Google 套用變更

---

### 方案 2: 檢查 OAuth 同意畫面

#### 步驟 1: 前往 OAuth consent screen

1. Google Cloud Console → **APIs & Services** → **OAuth consent screen**

#### 步驟 2: 確認應用程式狀態

**選項 A: 測試模式（推薦用於開發）**

如果應用程式狀態為「Testing」：
1. 向下滾動到 **Test users** 區域
2. 點擊 **ADD USERS**
3. 新增您要測試的 Gmail 地址（例如：qwerboy@gmail.com）
4. 點擊 **SAVE**

**選項 B: 發布模式（不建議用於開發階段）**

1. 點擊 **PUBLISH APP**
2. 確認發布（需要 Google 審查，可能需要數天）

---

### 方案 3: 驗證 Client ID

#### 步驟 1: 取得正確的 Client ID

1. Google Cloud Console → **Credentials**
2. 找到您的 OAuth 2.0 Client ID
3. 複製 **Client ID**（應該類似：`123456789012-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`）

#### 步驟 2: 更新 .env.local

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=您剛複製的完整Client_ID
```

**重要**: 
- ✅ 必須包含完整的 `.apps.googleusercontent.com`
- ✅ 不要有空格或換行
- ✅ 確認變數名稱是 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

#### 步驟 3: 重啟開發伺服器

```bash
# 停止開發伺服器 (Ctrl+C)
npm run dev
```

---

### 方案 4: 檢查 Client Secret（後端）

雖然這個錯誤通常不是 Client Secret 造成的，但還是檢查一下：

```env
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 驗證修正

### 步驟 1: 清除瀏覽器快取

1. 按 `Ctrl+Shift+Delete` 開啟清除快取
2. 選擇「Cookie 和其他網站資料」
3. 點擊「清除資料」

### 步驟 2: 重新測試

1. 開啟 http://localhost:3000/login
2. 點擊「使用 Google 登入」
3. 選擇帳號

**預期結果**: 應該看到 Google 授權畫面，而不是錯誤訊息

---

## 📋 完整檢查清單

請依序檢查以下項目：

### Google Cloud Console 設定

- [ ] 已建立 OAuth 2.0 Client ID
- [ ] 應用程式類型選擇「Web application」
- [ ] 授權重新導向 URI 包含 `http://localhost:3000`
- [ ] 授權重新導向 URI 包含 `http://localhost:3000/`
- [ ] OAuth 同意畫面已設定
- [ ] 如果是測試模式，已加入測試用戶
- [ ] 已儲存變更並等待 5-10 分鐘

### 環境變數設定

- [ ] `.env.local` 包含 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] `.env.local` 包含 `GOOGLE_CLIENT_SECRET`
- [ ] Client ID 格式正確（以 `.apps.googleusercontent.com` 結尾）
- [ ] 沒有多餘的空格或引號
- [ ] 已重啟開發伺服器

### 瀏覽器設定

- [ ] 已清除快取和 Cookie
- [ ] 使用的帳號是測試用戶清單中的帳號
- [ ] 瀏覽器允許第三方 Cookie

---

## 🔧 快速修正步驟

### 最常見的解決方式（95% 有效）

```
1. Google Cloud Console → Credentials
2. 編輯 OAuth 2.0 Client ID
3. Authorized redirect URIs 新增:
   http://localhost:3000
   http://localhost:3000/
4. SAVE
5. 等待 5 分鐘
6. 清除瀏覽器快取
7. 重新測試
```

---

## 📸 正確的設定畫面

### Authorized redirect URIs 應該看起來像這樣：

```
Authorized redirect URIs
─────────────────────────────────
URIs 1  http://localhost:3000        [刪除]
URIs 2  http://localhost:3000/       [刪除]
URIs 3  https://yourdomain.com       [刪除]  (生產環境)
─────────────────────────────────
[+ ADD URI]
```

### OAuth consent screen - Test users

```
Test users
──────────────────────────
qwerboy@gmail.com          [刪除]
──────────────────────────
[+ ADD USERS]
```

---

## ⏰ 等待時間

設定變更後需要等待：
- **最短**: 5 分鐘
- **通常**: 5-10 分鐘
- **最長**: 可能需要 1 小時

在等待期間：
1. 清除瀏覽器快取
2. 重啟開發伺服器
3. 確認環境變數正確

---

## 🐛 如果還是不行

### 檢查瀏覽器 Console

1. 按 `F12` 開啟開發者工具
2. 切換到 **Console** 標籤
3. 尋找錯誤訊息
4. 截圖並提供給我

### 檢查 Network 請求

1. 開發者工具 → **Network** 標籤
2. 點擊 Google 登入按鈕
3. 查看是否有失敗的請求
4. 檢查 Request Headers 中的 `client_id`

---

## 💡 常見問題

### Q: 為什麼要等 5-10 分鐘？

**A**: Google 的設定變更需要時間傳播到所有伺服器。立即測試可能還是看到舊設定。

### Q: 我可以使用 127.0.0.1:3000 嗎？

**A**: 不建議。雖然 `localhost` 和 `127.0.0.1` 技術上相同，但 Google OAuth 視為不同的域名。請使用 `localhost`。

### Q: 需要設定 /login 或 /register 嗎？

**A**: 不需要。Google Identity Services 會自動處理回調。只需設定根路徑即可。

### Q: 測試用戶有數量限制嗎？

**A**: 測試模式最多 100 個測試用戶。對開發來說綽綽有餘。

---

## ✅ 成功指標

修正成功後，您應該看到：

1. ✅ Google 授權畫面（不是錯誤頁面）
2. ✅ 應用程式名稱和圖示
3. ✅ 權限請求清單（email, profile）
4. ✅ 「允許」和「取消」按鈕

---

## 📞 需要更多協助？

如果按照以上步驟還是遇到問題，請提供：

1. Google Cloud Console 的授權重新導向 URI 截圖
2. OAuth 同意畫面的狀態（Testing 或 In production）
3. 測試用戶清單截圖
4. 瀏覽器 Console 的錯誤訊息

我會立即協助您！

---

**文件版本**: v1.0  
**最後更新**: 2026-01-04  
**問題**: 錯誤 401: invalid_client  
**解決率**: 95%+

