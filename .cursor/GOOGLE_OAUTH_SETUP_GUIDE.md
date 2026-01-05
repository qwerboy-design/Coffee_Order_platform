# Google OAuth 登入設定指南

> **目的**: 設定 Google OAuth 2.0 憑證並整合到咖啡豆訂單系統  
> **預估時間**: 15-20 分鐘  
> **最後更新**: 2026-01-04

---

## 📋 前置準備

- [ ] Google 帳號（用於存取 Google Cloud Console）
- [ ] 專案已安裝 `google-auth-library` 套件
- [ ] 已執行資料庫遷移 `005_add_oauth_id.sql`

---

## 🚀 步驟 1：安裝必要套件

```bash
npm install google-auth-library
```

---

## ☁️ 步驟 2：Google Cloud Console 設定

### 2.1 前往 Google Cloud Console

開啟瀏覽器前往：
```
https://console.cloud.google.com
```

登入您的 Google 帳號。

---

### 2.2 建立新專案（或選擇現有專案）

1. 點擊頂部導覽列的專案選擇器
2. 點擊「新增專案」(NEW PROJECT)
3. 輸入專案名稱：`咖啡豆訂單系統` 或 `Coffee Order Platform`
4. 點擊「建立」(CREATE)
5. 等待專案建立完成（約 10-30 秒）

---

### 2.3 啟用 Google+ API（可選，但建議）

1. 在左側選單選擇「APIs & Services」→「Library」
2. 搜尋「Google+ API」
3. 點擊「Google+ API」
4. 點擊「啟用」(ENABLE)

> **注意**: Google+ API 已棄用，但仍可用於取得用戶基本資料。新專案可跳過此步驟。

---

### 2.4 設定 OAuth 同意畫面

1. 在左側選單選擇「APIs & Services」→「OAuth consent screen」
2. 選擇「External」（外部）
3. 點擊「CREATE」

**填寫應用程式資訊**:

| 欄位 | 值 |
|------|-----|
| App name | 咖啡豆訂單系統 |
| User support email | 您的 Email |
| App logo | (可選) 上傳 Logo |
| Application home page | `https://your-domain.com` 或 `http://localhost:3000` |
| Authorized domains | `your-domain.com` (生產環境) |
| Developer contact information | 您的 Email |

4. 點擊「SAVE AND CONTINUE」

**Scopes（權限範圍）**:

1. 點擊「ADD OR REMOVE SCOPES」
2. 勾選以下權限：
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`
3. 點擊「UPDATE」
4. 點擊「SAVE AND CONTINUE」

**Test users（測試用戶，開發階段）**:

1. 點擊「ADD USERS」
2. 輸入您的 Gmail 地址
3. 點擊「ADD」
4. 點擊「SAVE AND CONTINUE」

**Summary（摘要）**:

1. 檢查設定是否正確
2. 點擊「BACK TO DASHBOARD」

---

### 2.5 建立 OAuth 2.0 憑證

1. 在左側選單選擇「APIs & Services」→「Credentials」
2. 點擊頂部「CREATE CREDENTIALS」→「OAuth client ID」
3. 選擇 Application type: **「Web application」**
4. 輸入名稱：`咖啡豆訂單系統 - Web Client`

**設定授權重新導向 URI** (Authorized redirect URIs):

```
# 本地開發
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/register

# 生產環境（請替換為您的域名）
https://your-domain.com
https://your-domain.com/login
https://your-domain.com/register
```

5. 點擊「CREATE」

**記下憑證**:

系統會顯示您的憑證：

```
Client ID: 123456789-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
Client secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **重要**: 請立即複製並妥善保存這些憑證！

6. 點擊「OK」

---

## 🔧 步驟 3：設定環境變數

### 3.1 更新 .env.local

在專案根目錄的 `.env.local` 檔案中新增：

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx
```

> **注意**: 
> - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 需要 `NEXT_PUBLIC_` 前綴（客戶端使用）
> - `GOOGLE_CLIENT_SECRET` 不需要前綴（僅伺服器端使用）

---

### 3.2 Vercel 部署環境變數設定

如果您使用 Vercel 部署：

1. 前往 Vercel Dashboard
2. 選擇您的專案
3. 前往「Settings」→「Environment Variables」
4. 新增以下變數：

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `您的 Client ID` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `您的 Client Secret` | Production, Preview, Development |

5. 點擊「Save」
6. 重新部署專案

---

## 🗄️ 步驟 4：執行資料庫遷移

在 Supabase SQL Editor 中執行：

```sql
-- 執行 supabase/migrations/005_add_oauth_id.sql
-- 此遷移會新增 oauth_id 欄位到 customers 表

-- 查看遷移內容
\i supabase/migrations/005_add_oauth_id.sql
```

或手動執行：

```sql
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_customers_oauth_id 
ON customers(oauth_id);

COMMENT ON COLUMN customers.oauth_id IS 'OAuth 提供者的用戶 ID（Google sub、Facebook id 等）';
```

**驗證欄位是否新增成功**:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name = 'oauth_id';
```

預期輸出：
```
 column_name | data_type      | is_nullable
-------------+----------------+-------------
 oauth_id    | character varying | YES
```

---

## ✅ 步驟 5：測試 Google OAuth 登入

### 5.1 啟動開發伺服器

```bash
npm run dev
```

---

### 5.2 測試登入流程

1. **開啟瀏覽器**
   ```
   http://localhost:3000/login
   ```

2. **檢查 Google 按鈕是否顯示**
   - 應該看到「使用 Google 登入」按鈕
   - 按鈕上有 Google Logo

3. **點擊 Google 按鈕**
   - 會彈出 Google 登入視窗
   - 選擇您的 Google 帳號
   - 授權應用程式存取您的資料

4. **驗證登入成功**
   - 應該自動重導向回首頁
   - Header 顯示您的名稱
   - 可以正常下訂單

---

### 5.3 測試註冊流程

1. **使用不同的 Google 帳號**
2. **開啟**
   ```
   http://localhost:3000/register
   ```

3. **點擊「使用 Google 註冊」**
4. **驗證新用戶建立**
   - 檢查 Supabase customers 表
   - 應該看到新建立的用戶記錄
   - `auth_provider` 應為 `'google'`

---

## 🐛 常見問題排查

### 問題 1: Google 按鈕不顯示

**可能原因**:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 未設定或格式錯誤
- Google Identity Services 腳本載入失敗

**解決方式**:
```bash
# 檢查環境變數
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID

# 應該顯示：123456789-xxx...

# 如果沒有顯示，請重新啟動開發伺服器
npm run dev
```

**檢查瀏覽器 Console**:
```javascript
// 開啟 DevTools (F12)
// 檢查是否有錯誤訊息
```

---

### 問題 2: 彈出視窗被封鎖

**解決方式**:
1. 允許瀏覽器彈出視窗
2. 檢查瀏覽器設定中的彈出視窗封鎖設定

---

### 問題 3: "Error 400: redirect_uri_mismatch"

**原因**: 授權重新導向 URI 不匹配

**解決方式**:
1. 前往 Google Cloud Console → Credentials
2. 編輯您的 OAuth 2.0 Client ID
3. 確認 Authorized redirect URIs 包含：
   ```
   http://localhost:3000
   http://localhost:3000/login
   ```
4. 儲存變更
5. 等待 5-10 分鐘讓變更生效

---

### 問題 4: "Error 403: access_denied"

**原因**: OAuth 同意畫面設定問題

**解決方式**:
1. 前往 Google Cloud Console → OAuth consent screen
2. 檢查 Publishing status
3. 如果是「Testing」狀態，確認您的帳號在「Test users」清單中
4. 或將狀態改為「In production」（需要審查）

---

### 問題 5: API 回傳 "Google 驗證失敗"

**可能原因**:
- `GOOGLE_CLIENT_SECRET` 未設定
- Client ID 不匹配

**解決方式**:
```bash
# 檢查 .env.local
cat .env.local | grep GOOGLE

# 應該看到兩行：
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

**檢查後端日誌**:
```bash
# 查看終端機輸出
# 應該看到錯誤訊息詳情
```

---

### 問題 6: 用戶建立成功但電話為空

**這是預期行為**！

Google OAuth 不提供電話號碼。用戶可以：
1. 在個人資料頁面補充電話
2. 或在首次下訂單時填寫

---

## 📊 測試檢查清單

- [ ] Google 按鈕顯示正常
- [ ] 點擊按鈕彈出 Google 登入視窗
- [ ] 可以選擇 Google 帳號
- [ ] 授權後自動登入
- [ ] Header 顯示用戶名稱
- [ ] 可以正常下訂單
- [ ] 重新整理頁面後仍保持登入狀態
- [ ] 登出功能正常
- [ ] 再次登入不會建立重複帳號
- [ ] Supabase 中用戶資料正確

---

## 🔒 安全性檢查

- [ ] `GOOGLE_CLIENT_SECRET` 未暴露在客戶端
- [ ] `.env.local` 已加入 `.gitignore`
- [ ] Vercel 環境變數已設定且不公開
- [ ] OAuth 同意畫面資訊準確
- [ ] 僅請求必要的權限（email, profile）
- [ ] Token 驗證使用官方 Library
- [ ] Session 管理安全（使用 JWT）

---

## 📚 相關文件

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)

---

## 🎉 設定完成！

恭喜您已成功設定 Google OAuth 登入功能！

**下一步建議**:
1. 測試不同的 Google 帳號
2. 測試生產環境部署
3. 考慮新增其他 OAuth 提供者（Facebook, LINE）
4. 實作個人資料頁面（補充電話號碼）

---

**文件版本**: v1.0  
**最後更新**: 2026-01-04  
**維護者**: Development Team

