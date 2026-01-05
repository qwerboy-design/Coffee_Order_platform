# 環境變數設定指南

> **用途**: 設定咖啡豆訂單系統所需的環境變數  
> **適用範圍**: 本地開發 / Vercel 部署 / 其他雲端平台

---

## 快速開始

### 1. 建立 .env.local 檔案

在專案根目錄建立 `.env.local` 檔案：

```bash
# 在專案根目錄執行
touch .env.local
```

### 2. 複製以下內容到 .env.local

```env
# ============================================
# Supabase 設定
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# Email 服務設定 (Resend)
# ============================================
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ============================================
# JWT Session 設定
# ============================================
JWT_SECRET=your_32_character_or_longer_secret_key_here

# ============================================
# N8N 自動化設定（可選）
# ============================================
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret_here

# ============================================
# Next.js 設定
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 詳細設定說明

### 1. Supabase 設定

**取得方式**:
1. 前往 [Supabase](https://supabase.com)
2. 登入並選擇專案
3. 前往 `Settings` → `API`
4. 複製以下資訊：

```env
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Project API keys → anon public
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Project API keys → service_role (⚠️ 保密！)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**注意事項**:
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` 具有完整權限，請勿洩漏
- ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 可公開（前端使用）

---

### 2. Resend Email 服務設定

**取得方式**:

#### Step 1: 註冊 Resend
1. 前往 [Resend](https://resend.com)
2. 使用 Email 或 GitHub 註冊

#### Step 2: 驗證域名（生產環境）
1. 前往 `Domains` → `Add Domain`
2. 輸入您的域名（例如：`yourdomain.com`）
3. 添加以下 DNS 記錄：

```
類型: TXT
名稱: @
值: resend-verify=xxxxxxxxxxxxx

類型: TXT
名稱: _dmarc
值: v=DMARC1; p=none; ...

類型: TXT
名稱: resend._domainkey
值: v=DKIM1; k=rsa; p=...
```

4. 等待驗證完成（約 5-15 分鐘）

#### Step 3: 建立 API Key
1. 前往 `API Keys` → `Create API Key`
2. 選擇權限：`Full Access`
3. 複製 API Key（⚠️ 只顯示一次）

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**開發環境測試**:
```env
# 使用 Resend 提供的測試 Email（不會實際發送）
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**注意事項**:
- ⚠️ 發送者 Email 必須是已驗證的域名
- ✅ 開發環境可使用 `onboarding@resend.dev` 測試
- ✅ 免費方案：每月 3,000 封 Email

---

### 3. JWT Secret 設定

**生成方式**:

```bash
# 方法 1: 使用 OpenSSL（推薦）
openssl rand -base64 32

# 方法 2: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 3: 線上生成器
# https://generate-secret.vercel.app/32
```

**範例輸出**:
```
Kx7+9vZ2mN4pQ8wR3tY6uA5bC1dE0fG2hI3jK4lM5nO6=
```

**設定**:
```env
JWT_SECRET=Kx7+9vZ2mN4pQ8wR3tY6uA5bC1dE0fG2hI3jK4lM5nO6=
```

**注意事項**:
- ⚠️ 必須至少 32 字元
- ⚠️ 生產環境請使用強隨機密鑰
- ⚠️ 請勿與他人分享

---

### 4. N8N 自動化設定（可選）

如果您使用 N8N 進行訂單自動化通知：

```env
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/order-created
N8N_WEBHOOK_SECRET=your_webhook_secret_here
```

**取得方式**:
1. 在 N8N 中建立 Webhook 節點
2. 複製 Webhook URL
3. 設定 Webhook Secret（自訂）

**注意**: 如果不使用 N8N，可以省略這些設定。

---

### 5. Next.js 設定

```env
# 本地開發
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# 生產環境（Vercel）
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## Vercel 部署設定

### 方法 1: 透過 Vercel Dashboard

1. 前往 Vercel Dashboard
2. 選擇專案 → `Settings` → `Environment Variables`
3. 逐一添加以下變數：

| 變數名稱 | 值 | 環境 |
|---------|---|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `eyJhbG...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production, Preview, Development |
| `RESEND_API_KEY` | `re_xxx...` | Production, Preview, Development |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | Production, Preview, Development |
| `JWT_SECRET` | `Kx7+9v...` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

4. 點擊 `Save`
5. 重新部署專案

---

### 方法 2: 使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 設定環境變數
vercel env add RESEND_API_KEY production
# 輸入值後按 Enter

# 拉取環境變數到本地（可選）
vercel env pull .env.local
```

---

## 環境變數檢查清單

在啟動應用程式前，請確認以下項目：

- [ ] ✅ `NEXT_PUBLIC_SUPABASE_URL` 已設定且格式正確
- [ ] ✅ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` 已設定
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` 已設定
- [ ] ✅ `RESEND_API_KEY` 已設定且有效
- [ ] ✅ `RESEND_FROM_EMAIL` 已設定且域名已驗證
- [ ] ✅ `JWT_SECRET` 已設定且至少 32 字元
- [ ] ✅ `NEXT_PUBLIC_APP_URL` 已設定
- [ ] ✅ `.env.local` 已加入 `.gitignore`（避免提交）

---

## 驗證環境變數

### 方法 1: 使用內建驗證

系統會在啟動時自動驗證環境變數（`lib/config.ts`）：

```bash
npm run dev
```

如果有缺少的環境變數，會顯示詳細錯誤訊息：

```
環境變數驗證失敗：
RESEND_API_KEY: RESEND_API_KEY is required
JWT_SECRET: JWT_SECRET must be at least 32 characters

請在 .env.local 文件中設定所有必要的環境變數。
```

---

### 方法 2: 手動檢查

```bash
# 檢查環境變數是否載入
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.RESEND_API_KEY ? '✅ RESEND_API_KEY' : '❌ RESEND_API_KEY')"
```

---

### 方法 3: 使用驗證腳本

```bash
# 執行驗證腳本
chmod +x scripts/verify-register-otp.sh
./scripts/verify-register-otp.sh
```

---

## 常見問題

### Q1: 為什麼我的環境變數沒有載入？

**可能原因**:
1. 檔案名稱錯誤（應為 `.env.local`，不是 `.env`）
2. 檔案位置錯誤（應在專案根目錄）
3. 重啟開發伺服器（修改環境變數後需重啟）

**解決方式**:
```bash
# 檢查檔案是否存在
ls -la .env.local

# 重啟開發伺服器
# Ctrl+C 停止，然後重新執行
npm run dev
```

---

### Q2: Resend Email 發送失敗？

**可能原因**:
1. `RESEND_API_KEY` 錯誤或過期
2. `RESEND_FROM_EMAIL` 域名未驗證
3. Resend 服務異常

**檢查方式**:
```bash
# 測試 Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'"$RESEND_FROM_EMAIL"'",
    "to": "your-email@example.com",
    "subject": "測試",
    "html": "<p>測試 Email</p>"
  }'
```

---

### Q3: JWT_SECRET 長度不足？

**錯誤訊息**:
```
JWT_SECRET: JWT_SECRET must be at least 32 characters
```

**解決方式**:
```bash
# 生成新的 32 字元密鑰
openssl rand -base64 32

# 更新 .env.local
JWT_SECRET=新生成的密鑰
```

---

### Q4: Vercel 部署後環境變數無效？

**可能原因**:
1. 環境變數未在 Vercel Dashboard 設定
2. 環境變數設定後未重新部署

**解決方式**:
1. 檢查 Vercel Dashboard → Settings → Environment Variables
2. 確認所有必要變數都已設定
3. 重新部署專案（Deployments → Redeploy）

---

## 安全性建議

### ⚠️ 絕對不要做的事

1. ❌ 將 `.env.local` 提交到 Git
2. ❌ 在公開場合分享 `SUPABASE_SERVICE_ROLE_KEY`
3. ❌ 在公開場合分享 `RESEND_API_KEY`
4. ❌ 在公開場合分享 `JWT_SECRET`
5. ❌ 在前端程式碼中使用 Service Role Key

---

### ✅ 應該做的事

1. ✅ 將 `.env.local` 加入 `.gitignore`
2. ✅ 使用強隨機密鑰（`JWT_SECRET`）
3. ✅ 定期更換 API Keys
4. ✅ 在 Vercel 使用環境變數管理
5. ✅ 區分開發/生產環境的環境變數

---

## 相關文件

- [README.md](../README.md) - 專案說明
- [SETUP.md](../SETUP.md) - 系統設定指南
- [REGISTER_OTP_IMPLEMENTATION.md](./REGISTER_OTP_IMPLEMENTATION.md) - 註冊與 OTP 功能實作
- [TESTING_GUIDE_REGISTER_OTP.md](./TESTING_GUIDE_REGISTER_OTP.md) - 測試指南

---

**文件版本**: v1.0  
**最後更新**: 2026-01-04  
**維護者**: Development Team

