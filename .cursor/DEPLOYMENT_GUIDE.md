# 部署指南：Google OAuth 功能上線

> **部署日期**: 2026-01-04  
> **新功能**: Google OAuth 登入 + 帳號綁定 + OTP 註冊  
> **目標**: GitHub + Vercel 生產環境

---

## 📋 部署前檢查清單

### 本地測試 ✅
- [x] Google OAuth 登入測試成功
- [x] 環境變數設定正確
- [x] 開發伺服器運行正常
- [ ] 資料庫遷移已執行

### 準備部署
- [ ] Git 提交所有變更
- [ ] 推送到 GitHub
- [ ] Vercel 環境變數設定
- [ ] Google OAuth 生產環境設定

---

## 🚀 部署步驟

### 步驟 1: 提交到 Git

#### 1.1 加入所有新檔案

```bash
# 加入 Google OAuth 相關檔案
git add app/api/auth/google/
git add app/api/auth/link-google/
git add app/api/auth/unlink-google/
git add app/api/auth/me/
git add app/(customer)/profile/
git add components/auth/GoogleLoginButton.tsx
git add components/auth/LinkGoogleButton.tsx
git add supabase/migrations/005_add_oauth_id.sql

# 加入文件
git add .cursor/*.md

# 加入測試腳本
git add scripts/verify-google-oauth-setup.js
git add scripts/test-google-oauth-api.js

# 加入修改的檔案
git add types/customer.ts
git add lib/supabase/customers.ts
git add app/(customer)/login/page.tsx
git add app/(customer)/register/page.tsx
git add components/shared/UserMenu.tsx
git add package.json
git add package-lock.json
```

#### 1.2 提交變更

```bash
git commit -m "feat: Add Google OAuth login and account linking

- Implement Google OAuth 2.0 authentication
- Add account linking/unlinking functionality
- Create profile page for account management
- Add oauth_id field to customers table
- Update login and register pages with Google button
- Add comprehensive documentation and testing guides

Features:
- Google OAuth login for new and existing users
- Link Google account to existing accounts
- Unlink Google account with password protection
- Profile page with account statistics
- Automated setup verification scripts

Dependencies:
- google-auth-library: ^10.5.0"
```

#### 1.3 推送到 GitHub

```bash
git push origin master
```

---

### 步驟 2: 設定 Vercel 環境變數

#### 2.1 前往 Vercel Dashboard

1. 開啟 [Vercel Dashboard](https://vercel.com)
2. 選擇您的專案
3. 前往 **Settings** → **Environment Variables**

#### 2.2 新增 Google OAuth 環境變數

**新增以下變數**:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 您的生產環境Client_ID | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | 您的生產環境Client_Secret | Production, Preview, Development |

**重要提示**:
- ⚠️ 使用**生產環境**的 Client ID 和 Secret（不是開發環境的）
- ⚠️ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 需要 `NEXT_PUBLIC_` 前綴
- ⚠️ 選擇所有環境（Production, Preview, Development）

#### 2.3 確認現有環境變數

確保以下環境變數已設定：

```env
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ RESEND_API_KEY
✅ RESEND_FROM_EMAIL
✅ JWT_SECRET
✅ NEXT_PUBLIC_APP_URL (應為您的生產域名)
✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID (新增)
✅ GOOGLE_CLIENT_SECRET (新增)
```

---

### 步驟 3: Google Cloud Console 生產環境設定

#### 3.1 取得 Vercel 部署 URL

部署後，您會得到類似的 URL：
- **Production**: `https://your-app.vercel.app`
- **Preview**: `https://your-app-xxxx.vercel.app`

#### 3.2 更新 Google OAuth 設定

前往 [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)

**選項 A: 使用相同的 Client ID（建議）**

編輯現有的 OAuth 2.0 Client ID，新增：

**Authorized JavaScript origins**:
```
http://localhost:3000              (開發環境)
https://your-app.vercel.app        (生產環境)
```

**Authorized redirect URIs**:
```
http://localhost:3000              (開發環境)
http://localhost:3000/             (開發環境)
https://your-app.vercel.app        (生產環境)
https://your-app.vercel.app/       (生產環境)
```

**選項 B: 建立新的 Client ID（推薦用於嚴格分離）**

1. 建立新的 OAuth 2.0 Client ID（命名為「Production」）
2. 僅設定生產環境的 URLs
3. 在 Vercel 使用新的 Client ID 和 Secret

#### 3.3 OAuth 同意畫面

**如果是測試模式**:
- 需要將使用者加入「Test users」清單
- 或發布應用程式為「In production」

**發布應用程式**:
1. OAuth consent screen → **PUBLISH APP**
2. 確認發布（可能需要 Google 審查）
3. 審查通過前，僅測試用戶可使用

---

### 步驟 4: 執行 Supabase 遷移（生產環境）

**在 Supabase Production Database 執行**:

```sql
-- 執行 supabase/migrations/005_add_oauth_id.sql

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_customers_oauth_id 
ON customers(oauth_id);

COMMENT ON COLUMN customers.oauth_id IS 'OAuth 提供者的用戶 ID（Google sub、Facebook id 等）';
```

**驗證**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'customers' AND column_name = 'oauth_id';
```

---

### 步驟 5: 觸發 Vercel 部署

#### 5.1 自動部署

推送到 GitHub 後，Vercel 會自動部署：

```bash
git push origin master
```

#### 5.2 手動部署（可選）

1. Vercel Dashboard → 您的專案
2. 點擊 **Deployments**
3. 點擊最新的部署
4. 如果需要，點擊 **Redeploy**

#### 5.3 監控部署狀態

```
Building...
✓ Completed
✓ Deploying...
✓ Ready
```

部署完成後會顯示：
```
✅ Production: https://your-app.vercel.app
```

---

### 步驟 6: 生產環境測試

#### 6.1 基本功能測試

```
1. 開啟 https://your-app.vercel.app/login
2. 檢查 Google 登入按鈕是否顯示
3. 點擊「使用 Google 登入」
4. 選擇 Google 帳號授權
5. 驗證自動登入成功
```

#### 6.2 帳號綁定測試

```
1. 使用 OTP 註冊新帳號
2. 前往個人資料頁面
3. 綁定 Google 帳號
4. 登出後用 Google 登入
5. 驗證登入到相同帳號
```

#### 6.3 檢查 Console 錯誤

```
按 F12 → Console 標籤
不應有紅色錯誤訊息
```

---

## 📋 部署檢查清單

### Git & GitHub
- [ ] 所有檔案已加入 Git
- [ ] Commit 訊息清晰
- [ ] 已推送到 GitHub
- [ ] GitHub Actions 運行成功（如有）

### Vercel
- [ ] 環境變數已設定（包含 Google OAuth）
- [ ] 部署成功
- [ ] Production URL 可訪問
- [ ] 沒有部署錯誤

### Google Cloud Console
- [ ] JavaScript origins 包含生產域名
- [ ] Redirect URIs 包含生產域名
- [ ] OAuth 同意畫面已發布（或測試用戶已加入）
- [ ] 設定已儲存並等待生效

### Supabase
- [ ] 生產資料庫已執行遷移
- [ ] oauth_id 欄位已建立
- [ ] 索引已建立

### 功能測試
- [ ] Google 登入正常運作
- [ ] 帳號綁定功能正常
- [ ] 個人資料頁面顯示正確
- [ ] 沒有 Console 錯誤

---

## 🐛 常見部署問題

### 問題 1: Vercel 部署失敗

**錯誤**: Build failed

**檢查**:
```bash
# 本地測試 build
npm run build
```

**常見原因**:
- TypeScript 錯誤
- 缺少環境變數
- 套件版本衝突

### 問題 2: 生產環境 Google 登入失敗

**錯誤**: invalid_client 或 origin not allowed

**解決**:
1. 確認 Google Cloud Console 的 JavaScript origins 包含正確的域名
2. 確認使用的是 `https://`（不是 `http://`）
3. 等待 5-10 分鐘讓 Google 設定生效

### 問題 3: 環境變數未生效

**解決**:
1. Vercel Dashboard → Settings → Environment Variables
2. 確認變數名稱正確（大小寫敏感）
3. 確認選擇了正確的環境（Production）
4. 重新部署：Deployments → Redeploy

### 問題 4: 資料庫遷移錯誤

**錯誤**: column "oauth_id" already exists

**解決**: 這是正常的，表示欄位已存在，可忽略

---

## 📊 部署後監控

### Vercel Analytics

1. Vercel Dashboard → Analytics
2. 監控：
   - 頁面載入時間
   - 錯誤率
   - 流量來源

### Supabase Logs

1. Supabase Dashboard → Logs
2. 檢查：
   - API 請求
   - 錯誤訊息
   - 慢查詢

### Google Cloud Console

1. APIs & Services → Dashboard
2. 監控：
   - OAuth API 使用量
   - 錯誤率

---

## 🎯 部署成功指標

### 技術指標
- ✅ Vercel 部署狀態：Ready
- ✅ 建置時間：< 2 分鐘
- ✅ 無 TypeScript 錯誤
- ✅ 無 ESLint 錯誤
- ✅ 無 Console 錯誤

### 功能指標
- ✅ 所有頁面可訪問
- ✅ Google 登入正常運作
- ✅ 帳號綁定功能正常
- ✅ 資料正確儲存

### 使用者體驗
- ✅ 頁面載入速度快（< 3 秒）
- ✅ 按鈕回應靈敏
- ✅ 錯誤訊息清晰
- ✅ 行動版顯示正常

---

## 📚 相關文件

1. **Google OAuth 設定**: `.cursor/GOOGLE_OAUTH_SETUP_GUIDE.md`
2. **測試指南**: `.cursor/ACCOUNT_LINKING_TEST.md`
3. **實作總結**: `.cursor/IMPLEMENTATION_COMPLETE_SUMMARY.md`
4. **錯誤排查**: `.cursor/GOOGLE_OAUTH_ERROR_401_FIX.md`

---

## 🎉 部署完成後

### 通知使用者

```
✅ 新功能上線！

現在您可以：
1. 使用 Google 帳號快速登入
2. 在個人資料頁面綁定 Google 帳號
3. 一鍵切換登入方式

網址：https://your-app.vercel.app
```

### 後續優化

- [ ] 監控使用者反饋
- [ ] 收集分析數據
- [ ] 優化載入速度
- [ ] 新增更多 OAuth 提供者（Facebook, LINE）

---

**文件版本**: v1.0  
**最後更新**: 2026-01-04  
**部署目標**: GitHub + Vercel  
**新功能**: Google OAuth 登入 + 帳號綁定

