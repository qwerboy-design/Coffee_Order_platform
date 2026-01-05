# 設定 Google OAuth 環境變數

> **立即設定**: 將您的 Google OAuth 憑證加入 `.env.local`

---

## 📝 設定步驟

### 1. 開啟 `.env.local` 檔案

在專案根目錄找到 `.env.local` 檔案並開啟。

### 2. 新增 Google OAuth 憑證

在檔案最後新增以下兩行：

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=您從Google_Cloud_Console取得的Client_ID
GOOGLE_CLIENT_SECRET=您從Google_Cloud_Console取得的Client_Secret
```

### 3. 替換為您的實際憑證

**範例格式**:
```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
```

---

## ⚠️ 重要提示

### Client ID 格式
- ✅ 必須以 `.apps.googleusercontent.com` 結尾
- ✅ 通常是一長串數字和字母
- ✅ 需要 `NEXT_PUBLIC_` 前綴（這樣客戶端才能使用）

### Client Secret 格式
- ✅ 通常以 `GOCSPX-` 開頭
- ✅ 不需要 `NEXT_PUBLIC_` 前綴（僅伺服器端使用）
- ⚠️ 這是敏感資訊，請勿洩漏

---

## 🔍 如何找到您的憑證

### 在 Google Cloud Console

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇您的專案
3. 左側選單 → **APIs & Services** → **Credentials**
4. 找到您剛建立的 OAuth 2.0 Client ID
5. 點擊 Client ID 名稱查看詳情
6. 複製以下資訊：
   - **Client ID** → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Client secret** → `GOOGLE_CLIENT_SECRET`

---

## ✅ 驗證設定

設定完成後，執行以下命令驗證：

```bash
node scripts/verify-google-oauth-setup.js
```

**預期看到**:
```
✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID: 123456789...
✅ GOOGLE_CLIENT_SECRET: GOCSPX-...
✅ 所有檢查通過！
```

---

## 🐛 常見錯誤

### 錯誤 1: "未設定"
```
❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID: 未設定
```

**原因**: 環境變數名稱錯誤或檔案未儲存

**解決**: 
- 確認變數名稱完全相同（大小寫敏感）
- 確認檔案已儲存
- 重新啟動開發伺服器

### 錯誤 2: "格式不正確"
```
⚠️ Client ID 格式可能不正確
```

**原因**: Client ID 格式錯誤

**解決**: 
- 檢查是否以 `.apps.googleusercontent.com` 結尾
- 確認沒有多餘的空格或換行
- 從 Google Cloud Console 重新複製

### 錯誤 3: 開發伺服器看不到新的環境變數

**解決**: 
```bash
# 停止開發伺服器 (Ctrl+C)
# 重新啟動
npm run dev
```

---

## 📋 完整的 .env.local 範例

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# JWT Session
JWT_SECRET=your_32_character_secret_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (新增這兩行)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
```

---

## 🚀 下一步

設定完成後：

1. ✅ 驗證設定
   ```bash
   node scripts/verify-google-oauth-setup.js
   ```

2. ✅ 執行資料庫遷移
   ```sql
   -- 在 Supabase SQL Editor 執行
   -- supabase/migrations/005_add_oauth_id.sql
   ```

3. ✅ 啟動開發伺服器
   ```bash
   npm run dev
   ```

4. ✅ 測試 Google 登入
   ```
   開啟: http://localhost:3000/login
   點擊: 使用 Google 登入
   ```

---

**需要協助？** 請告訴我遇到什麼問題！

