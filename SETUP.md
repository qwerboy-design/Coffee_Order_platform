# 系統設定指南

本文件說明如何設定咖啡豆訂單系統的完整環境。

> **相關文件：**
> - [README.md](README.md) - 專案說明和快速開始
> - [DATABASE.md](DATABASE.md) - 詳細的資料庫結構說明

## 一、Supabase 設定

### 1. 建立專案

1. 前往 [Supabase](https://supabase.com) 並登入
2. 點擊「New Project」建立新專案
3. 設定專案名稱和密碼
4. 選擇區域（建議選擇香港或日本以獲得較低延遲）
5. 等待專案建立完成

### 2. 取得 API 金鑰

在專案 Dashboard 的「Settings」→「API」中取得：

- **Project URL**: `https://your-project.supabase.co`
- **Anon/Public Key**: 用於前端 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **Service Role Key**: 用於後端 `SUPABASE_SERVICE_ROLE_KEY`

### 3. 執行資料庫遷移

在 SQL Editor 中按順序執行以下遷移文件：

1. `supabase/migrations/001_create_enums.sql` - 建立 ENUM 類型
2. `supabase/migrations/002_create_tables.sql` - 建立資料表
3. `supabase/migrations/003_create_triggers_and_functions.sql` - 建立觸發器和函數
4. `supabase/migrations/004_create_rls_policies.sql` - 建立 RLS 政策
5. `supabase/migrations/005_add_oauth_id.sql` - 添加 OAuth ID 欄位（支援 Google 登入）

### 4. 設定環境變數

在專案根目錄建立 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend Email
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# JWT Session
JWT_SECRET=your_32_character_or_longer_secret

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# N8N（可選）
N8N_WEBHOOK_URL=https://your-n8n.com/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 二、N8N 自動化設定

### 1. 訂單建立 Webhook

當新訂單建立時，系統會呼叫 N8N Webhook 進行通知。

**Webhook URL**: `/order-created`

**Payload 格式**:
```json
{
  "order_id": "ORD-20251228-0001",
  "customer_name": "張三",
  "customer_phone": "0912345678",
  "customer_email": "customer@example.com",
  "pickup_method": "自取",
  "payment_method": "現金",
       "total_amount": 1500,
       "final_amount": 1500,
       "order_items": [
         {
           "product_name": "耶加雪菲",
           "quantity": 2,
           "unit_price": 500,
      "grind_option": "細研磨（手沖）"
    }
  ],
  "notes": "備註內容"
}
```

### 2. 訂單狀態更新 Webhook

當訂單狀態變更時，系統會呼叫此 Webhook。

**Webhook URL**: `/order-status-updated`

**Payload 格式**:
```json
{
  "order_id": "ORD-20251228-0001",
  "new_status": "confirmed",
  "old_status": "pending",
  "updated_by": "admin",
  "updated_at": "2025-12-28T10:00:00.000Z"
}
```

## 三、Email 服務設定（Resend）

> **📖 完整詳細的 Resend 設定指南**: 請參考 [RESEND_EMAIL_SETUP.md](.cursor/RESEND_EMAIL_SETUP.md)

### 快速設定步驟

1. **註冊 Resend 帳號**
   - 前往 [Resend](https://resend.com) 並註冊
   - 建議使用 GitHub 帳號快速登入

2. **添加網域**
   - 在 Resend Dashboard 選擇「Domains」
   - 點擊「Add Domain」並輸入您的網域（例如：`yourdomain.com`）

3. **設定 DNS 記錄**
   
   在您的 DNS 服務商（Cloudflare、GoDaddy、Namecheap 等）添加以下記錄：
   
   **SPF 記錄**：
   ```
   類型：TXT
   名稱：@
   值：v=spf1 include:resend.com ~all
   ```
   
   **DKIM 記錄**：
   ```
   類型：TXT
   名稱：resend._domainkey
   值：（Resend 會提供完整的值）
   ```
   
   **DMARC 記錄**：
   ```
   類型：TXT
   名稱：_dmarc
   值：v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

4. **驗證網域**
   - 等待 DNS 生效（5-30 分鐘）
   - 在 Resend Dashboard 點擊「Verify」
   - 確認所有記錄都顯示為 ✅ Verified

5. **創建 API Key**
   - 在 Resend Dashboard 選擇「API Keys」
   - 點擊「Create API Key」
   - 選擇權限（生產環境建議用 Sending Access）
   - 複製 API Key（格式：`re_xxxxx...`）

6. **設定環境變數**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

7. **測試發送**
   ```bash
   node scripts/test-email.js
   ```

### 重要提醒

- ⚠️ DNS 記錄設定後，需要等待 5-30 分鐘生效
- ⚠️ 發送 Email 必須使用已驗證的網域
- ⚠️ 免費方案限制：3,000 封/月，100 封/日
- ⚠️ API Key 只顯示一次，請立即複製保存

### DNS 檢查工具

- [MXToolbox](https://mxtoolbox.com) - 檢查 SPF、DKIM 記錄
- [DNSChecker](https://dnschecker.org) - 檢查 DNS 全球傳播狀態

## 四、Google OAuth 設定

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案或選擇現有專案
3. 啟用「Google+ API」或「Google Identity Services」

### 2. 設定 OAuth 同意畫面

1. 在左側選單選擇「APIs & Services」→「OAuth consent screen」
2. 選擇「External」（外部）
3. 填寫應用程式資訊：
   - **App name**: 咖啡豆訂單系統
   - **User support email**: 您的 Email
   - **Developer contact information**: 您的 Email
4. 點擊「Save and Continue」
5. 在「Scopes」頁面，點擊「Add or Remove Scopes」
6. 選擇以下 Scopes：
   - `email`
   - `profile`
   - `openid`
7. 點擊「Save and Continue」

### 3. 建立 OAuth 憑證

1. 在左側選單選擇「Credentials」
2. 點擊「Create Credentials」→「OAuth client ID」
3. 選擇「Web application」
4. 設定：
   - **Name**: Coffee Order Platform
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`（開發環境）
     - `https://your-app.vercel.app`（生產環境）
   - **Authorized redirect URIs**:
     - `http://localhost:3000`（開發環境）
     - `https://your-app.vercel.app`（生產環境）
5. 點擊「Create」
6. 複製「Client ID」和「Client Secret」到 `.env.local`：
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### 4. 測試 Google 登入

1. 啟動開發伺服器：`npm run dev`
2. 開啟 [http://localhost:3000/login](http://localhost:3000/login)
3. 點擊「使用 Google 登入」按鈕
4. 選擇 Google 帳號並授權
5. 成功登入後會自動建立帳號並跳轉到首頁

**重要提醒：**
- 修改 Google Cloud Console 設定後，可能需要等待 5-10 分鐘才會生效
- 確保「Authorized JavaScript origins」和「Authorized redirect URIs」正確設定
- 本機開發使用 `http://localhost:3000`（不需要 `/` 結尾）
- 生產環境使用完整的 Vercel URL
- **移動端設定**：確保生產環境的網域已添加到 Authorized JavaScript origins（包含 `https://` 協議）
- **WebView 問題**：如果用戶在應用程式內建瀏覽器（LINE、Facebook 等）中遇到 `403: disallowed_useragent` 錯誤，請引導他們使用標準瀏覽器（Chrome、Safari）

### 5. 移動端 OAuth 設定（重要）

如果您的應用需要在手機上使用 Google 登入，請確保：

1. **Authorized JavaScript origins** 包含：
   - 生產環境網域：`https://your-domain.com`
   - 開發環境：`http://localhost:3000`

2. **Authorized redirect URIs** 包含：
   - 生產環境：`https://your-domain.com` 和 `https://your-domain.com/api/auth/google`
   - 開發環境：`http://localhost:3000` 和 `http://localhost:3000/api/auth/google`

3. **WebView 限制**：
   - Google OAuth 不支援在應用程式內建瀏覽器（WebView）中使用
   - 如果用戶在 LINE、Facebook、Instagram 等應用中開啟，會看到提示訊息
   - 建議用戶使用標準瀏覽器（Chrome、Safari）進行登入

**詳細說明請參考**：[移動端 OAuth 設定指南](docs/MOBILE_OAUTH_SETUP.md)

## 五、本地開發

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

### 3. 開啟瀏覽器

訪問 [http://localhost:3000](http://localhost:3000)

## 六、Vercel 部署

### 1. 連接 GitHub

1. 將專案推送到 GitHub
2. 登入 Vercel 並導入專案

### 2. 設定環境變數

在 Vercel Dashboard 的「Settings」→「Environment Variables」中添加所有必要的環境變數（包含 Google OAuth 相關變數）。

**重要：** 生產環境的 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 必須在 Google Cloud Console 中添加對應的 Authorized JavaScript origins 和 Authorized redirect URIs。

### 3. 部署

推送到 `main` 或 `master` 分支即可自動部署。

## 七、常見問題

### Q: Supabase 連線失敗？

1. 確認 `NEXT_PUBLIC_SUPABASE_URL` 格式正確
2. 確認 `SUPABASE_SERVICE_ROLE_KEY` 有正確的權限
3. 確認資料庫遷移已正確執行

### Q: Email 發送失敗？

1. 確認 `RESEND_API_KEY` 正確
2. 確認發送者域名已驗證
3. 檢查 Resend Dashboard 的錯誤日誌

### Q: JWT 驗證失敗？

1. 確認 `JWT_SECRET` 至少 32 字元
2. 確認所有環境的 `JWT_SECRET` 一致
3. JWT 由node.js語法需自行產生

### Q: Google 登入出現「錯誤 401: invalid_client」？

1. 確認 Google Cloud Console 的「Authorized redirect URIs」已正確設定
2. 確認 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 正確
3. 等待 5-10 分鐘讓 Google Cloud Console 設定生效

### Q: Google 登入出現黑畫面或「origin is not allowed」錯誤？

1. 確認 Google Cloud Console 的「Authorized JavaScript origins」已正確設定
2. 本機開發使用 `http://localhost:3000`（不需要 `/` 結尾）
3. 生產環境使用完整的 Vercel URL（例如 `https://your-app.vercel.app`）
4. 等待 5-10 分鐘讓設定生效

### Q: OTP 驗證碼沒收到？

1. 確認 `RESEND_API_KEY` 正確且有效
2. 確認 `RESEND_FROM_EMAIL` 的域名已在 Resend 驗證
3. 檢查 Email 的垃圾郵件資料夾
4. 檢查 Resend Dashboard 的發送記錄

## 八、支援

如有問題，請參考：

- [README.md](README.md) - 專案概覽
- [DATABASE.md](DATABASE.md) - 資料庫結構
- [Supabase 文檔](https://supabase.com/docs)
- [Next.js 文檔](https://nextjs.org/docs)
