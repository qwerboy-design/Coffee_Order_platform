# 部署指南：GitHub + Vercel

本指南說明如何將咖啡豆訂單系統部署到 GitHub 和 Vercel。

## 📋 部署流程概覽

```
本地開發 → GitHub 倉庫 → Vercel 自動部署
```

## 🚀 步驟一：準備 GitHub 倉庫

### 1.1 初始化 Git（如果尚未初始化）

```bash
# 檢查是否已有 Git 倉庫
git status

# 如果沒有，初始化 Git
git init
```

### 1.2 建立 .gitignore（確認已存在）

確認 `.gitignore` 包含以下內容：

```
node_modules/
.next/
.env*.local
.env
.vercel
*.log
.DS_Store
```

### 1.3 提交所有檔案

```bash
# 檢查檔案狀態
git status

# 添加所有檔案
git add .

# 提交
git commit -m "Initial commit: Coffee Order Platform"
```

### 1.4 在 GitHub 建立新倉庫

1. **前往 GitHub**
   - 登入 [GitHub](https://github.com)
   - 點擊右上角「+」→「New repository」

2. **設定倉庫資訊**
   - **Repository name**: `Coffee_Order_platform`（或您喜歡的名稱）
   - **Description**: 咖啡豆訂單系統
   - **Visibility**: 
     - Public（公開，免費）
     - Private（私有，需要 GitHub Pro）
   - **不要**勾選「Initialize this repository with a README」（因為已有本地檔案）

3. **建立倉庫**
   - 點擊「Create repository」

### 1.5 連接本地倉庫到 GitHub

GitHub 會顯示指令，執行以下命令：

```bash
# 添加遠端倉庫（將 YOUR_USERNAME 替換為您的 GitHub 用戶名）
git remote add origin https://github.com/YOUR_USERNAME/Coffee_Order_platform.git

# 或使用 SSH（推薦）
git remote add origin git@github.com:YOUR_USERNAME/Coffee_Order_platform.git

# 推送代碼到 GitHub
git branch -M main
git push -u origin main
```

**如果遇到認證問題：**
- 使用 Personal Access Token（Settings → Developer settings → Personal access tokens）
- 或設定 SSH Key（Settings → SSH and GPG keys）

## 🎯 步驟二：部署到 Vercel

### 方法一：透過 Vercel Dashboard（推薦，最簡單）

#### 2.1 註冊 Vercel 帳號

1. 前往 [Vercel](https://vercel.com)
2. 點擊「Sign Up」
3. 選擇「Continue with GitHub」（使用 GitHub 帳號登入）

#### 2.2 匯入專案

1. **新增專案**
   - 登入 Vercel Dashboard
   - 點擊「Add New Project」

2. **選擇倉庫**
   - 在「Import Git Repository」中選擇您的 `Coffee_Order_platform` 倉庫
   - 如果看不到，點擊「Adjust GitHub App Permissions」授權

3. **設定專案**
   - **Project Name**: `coffee-order-platform`（或您喜歡的名稱）
   - **Framework Preset**: Next.js（應該自動偵測）
   - **Root Directory**: `./`（預設）
   - **Build Command**: `npm run build`（預設）
   - **Output Directory**: `.next`（預設）
   - **Install Command**: `npm install`（預設）

#### 2.3 設定環境變數

在「Environment Variables」區塊，添加以下變數：

**必填環境變數：**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# JWT Session
JWT_SECRET=your_32_character_secret_key_minimum

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Next.js
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**可選環境變數：**

```env
# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret
```

**重要提醒：**
- 每個環境變數都要分別添加（Production、Preview、Development）
- 或使用「Apply to all environments」一次設定
- `NEXT_PUBLIC_APP_URL` 在部署後會自動更新，但首次部署需要先設定一個值

#### 2.4 部署

1. 點擊「Deploy」
2. 等待構建完成（約 2-5 分鐘）
3. 部署成功後會獲得一個網址：`https://your-app.vercel.app`

#### 2.5 更新 Google OAuth 設定

部署完成後，需要更新 Google Cloud Console 的 OAuth 設定：

1. **前往 Google Cloud Console**
   - [Google Cloud Console](https://console.cloud.google.com)
   - 選擇您的專案

2. **更新 OAuth 憑證**
   - APIs & Services → Credentials
   - 點擊您的 OAuth 2.0 Client ID
   - 在「Authorized JavaScript origins」添加：
     ```
     https://your-app.vercel.app
     ```
   - 在「Authorized redirect URIs」添加：
     ```
     https://your-app.vercel.app
     https://your-app.vercel.app/api/auth/google
     ```
   - 點擊「Save」

3. **更新環境變數（如果需要）**
   - 如果使用不同的 Client ID/Secret，在 Vercel Dashboard 更新環境變數
   - 重新部署或等待自動部署

### 方法二：使用 Vercel CLI

#### 2.1 安裝 Vercel CLI

```bash
npm i -g vercel
```

#### 2.2 登入 Vercel

```bash
vercel login
```

會開啟瀏覽器進行認證。

#### 2.3 部署

```bash
# 在專案根目錄執行
vercel

# 首次部署會詢問：
# - Set up and deploy? Yes
# - Which scope? 選擇您的帳號
# - Link to existing project? No（首次部署）
# - Project name? coffee-order-platform
# - Directory? ./
# - Override settings? No
```

#### 2.4 設定環境變數

```bash
# 設定環境變數（逐一設定）
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 輸入值，選擇環境（Production/Preview/Development）

# 或使用檔案批次設定
vercel env pull .env.local
# 編輯 .env.local，然後
vercel env push
```

#### 2.5 生產環境部署

```bash
vercel --prod
```

## 🔄 步驟三：設定自動部署（GitHub Actions）

專案已包含 `.github/workflows/deploy-vercel.yml`，設定後可實現自動部署。

### 3.1 取得 Vercel 憑證

1. **取得 Vercel Token**
   - Vercel Dashboard → Settings → Tokens
   - 點擊「Create Token」
   - 名稱：`GitHub Actions Deploy`
   - 權限：Full Access
   - 複製 Token（只顯示一次）

2. **取得 Vercel Org ID 和 Project ID**
   - Vercel Dashboard → 選擇專案
   - Settings → General
   - 找到：
     - **Team ID**（即 Org ID）
     - **Project ID**

### 3.2 設定 GitHub Secrets

1. **前往 GitHub 倉庫**
   - 點擊「Settings」→「Secrets and variables」→「Actions」

2. **添加 Secrets**
   點擊「New repository secret」，添加以下 Secrets：

   ```
   VERCEL_TOKEN=vercel_xxxxxxxxxxxxxxxxxxxx
   VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxxxx
   VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxx
   ```

   **注意：** 其他環境變數（如 Supabase、Resend 等）不需要設定在 GitHub Secrets，因為它們已經在 Vercel Dashboard 中設定。

### 3.3 驗證自動部署

1. **推送代碼到 main 分支**
   ```bash
   git add .
   git commit -m "Test auto deployment"
   git push origin main
   ```

2. **檢查部署狀態**
   - GitHub → Actions 標籤頁
   - 應該會看到「Deploy to Vercel」工作流程執行
   - Vercel Dashboard 也會顯示新的部署

## 📝 步驟四：後續維護

### 4.1 更新代碼

```bash
# 1. 在本地修改代碼
# 2. 提交變更
git add .
git commit -m "Update: description of changes"
git push origin main

# 3. Vercel 會自動部署（如果已設定 GitHub Actions）
# 或手動觸發：Vercel Dashboard → Deployments → Redeploy
```

### 4.2 查看部署日誌

- **Vercel Dashboard**: Deployments → 選擇部署 → View Function Logs
- **GitHub Actions**: Actions 標籤頁 → 選擇工作流程 → 查看日誌

### 4.3 環境變數管理

- **新增環境變數**: Vercel Dashboard → Settings → Environment Variables
- **更新環境變數**: 編輯後，下次部署會自動套用
- **刪除環境變數**: 點擊變數旁的「...」→ Delete

### 4.4 自訂網域（可選）

1. **在 Vercel 添加網域**
   - Vercel Dashboard → Settings → Domains
   - 輸入您的網域（例如：`coffee.yourdomain.com`）
   - 按照指示設定 DNS 記錄

2. **設定 DNS**
   - 在您的 DNS 服務商添加 CNAME 記錄：
     ```
     類型：CNAME
     名稱：coffee（或 @）
     值：cname.vercel-dns.com
     ```

3. **等待生效**
   - DNS 傳播通常需要 5-30 分鐘
   - Vercel 會自動配置 SSL 憑證

## 🔍 疑難排解

### 問題 1：構建失敗

**錯誤訊息：**
```
Error: Environment variable RESEND_API_KEY is required
```

**解決方法：**
1. 確認 Vercel Dashboard 中已設定所有環境變數
2. 確認環境變數名稱正確（大小寫敏感）
3. 重新部署

### 問題 2：GitHub Actions 部署失敗

**錯誤訊息：**
```
Error: VERCEL_TOKEN is required
```

**解決方法：**
1. 確認 GitHub Secrets 中已設定 `VERCEL_TOKEN`
2. 確認 Token 有效（未過期）
3. 重新生成 Token 並更新 Secret

### 問題 3：Google OAuth 無法使用

**錯誤訊息：**
```
Error: redirect_uri_mismatch
```

**解決方法：**
1. 確認 Google Cloud Console 中的「Authorized redirect URIs」包含：
   - `https://your-app.vercel.app/api/auth/google`
2. 確認 Vercel 環境變數中的 `NEXT_PUBLIC_APP_URL` 正確
3. 等待 5-10 分鐘讓 Google 設定生效

### 問題 4：Email 無法發送

**可能原因：**
- Resend API Key 錯誤
- `RESEND_FROM_EMAIL` 未驗證
- Rate Limit 達到上限

**解決方法：**
1. 檢查 Vercel 環境變數
2. 檢查 Resend Dashboard → Logs
3. 確認網域已驗證

### 問題 5：資料庫連線失敗

**錯誤訊息：**
```
Error: Invalid API key
```

**解決方法：**
1. 確認 Supabase 環境變數正確
2. 確認 Supabase 專案未暫停
3. 檢查 Supabase Dashboard → Settings → API

## 📚 相關文件

- [README.md](../README.md) - 專案說明
- [SETUP.md](../SETUP.md) - 完整設定指南
- [LOCALHOST_OTP_GUIDE.md](./LOCALHOST_OTP_GUIDE.md) - Localhost OTP 使用指南
- [DATABASE.md](../DATABASE.md) - 資料庫結構說明

## 🎯 快速檢查清單

部署前確認：

- [ ] 所有環境變數已在 Vercel Dashboard 設定
- [ ] Google OAuth 已設定正確的 Redirect URIs
- [ ] Resend 網域已驗證
- [ ] Supabase 專案正常運行
- [ ] GitHub 倉庫已建立並推送代碼
- [ ] Vercel 專案已連接 GitHub 倉庫
- [ ] GitHub Actions Secrets 已設定（如使用自動部署）

部署後確認：

- [ ] 網站可以正常訪問
- [ ] 登入功能正常（OTP 和 Google）
- [ ] Email 可以正常發送
- [ ] 資料庫連線正常
- [ ] 訂單功能正常

---

**需要協助？** 請檢查：
- Vercel Dashboard → Deployments（查看部署狀態）
- GitHub Actions（查看自動部署日誌）
- 瀏覽器 Console（查看前端錯誤）
