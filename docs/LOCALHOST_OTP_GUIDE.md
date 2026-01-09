# Localhost OTP 驗證碼使用指南

本指南說明如何在本地開發環境（localhost）中使用 OTP 驗證碼功能。

## 📋 前置需求

1. **Resend 帳號**：用於發送 Email
2. **環境變數設定**：配置 Resend API Key
3. **開發伺服器**：Next.js 開發伺服器運行中

## 🔧 設定步驟

### 1. 註冊 Resend 帳號

1. 前往 [Resend](https://resend.com) 註冊帳號
2. 建議使用 GitHub 帳號快速登入

### 2. 取得 Resend API Key

1. 登入 Resend Dashboard
2. 前往 **API Keys** 頁面
3. 點擊 **Create API Key**
4. 選擇權限（開發環境可使用 **Full Access**）
5. 複製 API Key（格式：`re_xxxxx...`）

### 3. 設定環境變數

在專案根目錄建立或編輯 `.env.local` 檔案：

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# 其他必要的環境變數
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_32_character_secret_key
```

**重要提醒：**
- `RESEND_FROM_EMAIL` 必須是已驗證的網域 Email
- 如果沒有自己的網域，可以使用 Resend 提供的測試網域（例如：`onboarding@resend.dev`）

### 4. 驗證網域（可選，建議）

如果您有自己的網域，建議設定 DNS 記錄以提升 Email 送達率：

1. 在 Resend Dashboard 選擇 **Domains**
2. 點擊 **Add Domain** 並輸入您的網域
3. 按照指示設定 DNS 記錄（SPF、DKIM、DMARC）
4. 等待驗證完成（通常 5-30 分鐘）

詳細設定請參考 [SETUP.md](../SETUP.md#三email-服務設定resend)

## 🚀 使用方式

### 方式一：透過網頁介面

1. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

2. **開啟登入頁面**
   - 瀏覽器開啟 `http://localhost:3000/login`

3. **輸入 Email 並發送 OTP**
   - 輸入您的 Email 地址
   - 點擊「發送驗證碼」
   - 系統會發送 OTP 到您的 Email

4. **檢查 Email**
   - 開啟您的 Email 收件匣
   - 查看來自 `RESEND_FROM_EMAIL` 的信件
   - **注意**：驗證碼可能被歸類到垃圾郵件，請一併檢查

5. **輸入驗證碼**
   - 在登入頁面輸入收到的 6 位數驗證碼
   - 完成登入

### 方式二：使用測試腳本

專案提供了測試腳本，可以更方便地測試 OTP 功能：

```bash
node scripts/test-otp-verification.js
```

**腳本功能：**
1. **發送新的 OTP**：發送驗證碼到指定 Email
2. **查看現有的 OTP**：從資料庫查詢最新的 OTP（用於測試，無需等待 Email）
3. **驗證 OTP**：測試驗證碼是否正確
4. **完整測試**：自動執行發送、查詢、驗證的完整流程

**使用範例：**
```bash
# 1. 確保開發伺服器已啟動
npm run dev

# 2. 在另一個終端執行測試腳本
node scripts/test-otp-verification.js

# 3. 按照提示操作
# - 輸入 Email（預設：qwerboy@gmail.com）
# - 選擇操作選項（1-4）
```

## 📧 檢查 Email 的注意事項

### 1. 檢查垃圾郵件資料夾

OTP 驗證碼 Email 可能被歸類為垃圾郵件，請務必檢查：
- Gmail：**垃圾郵件**資料夾
- Outlook：**垃圾郵件**資料夾
- 其他郵件服務：**垃圾郵件**或**促銷郵件**資料夾

### 2. 使用測試腳本查詢 OTP

如果 Email 延遲或找不到，可以使用測試腳本直接從資料庫查詢：

```bash
node scripts/test-otp-verification.js
# 選擇選項 2：查看現有的 OTP
```

這會直接顯示資料庫中最新未使用的 OTP，無需等待 Email。

### 3. Email 送達時間

- **正常情況**：1-5 秒內送達
- **網路延遲**：最多 30 秒
- **如果超過 1 分鐘未收到**：請檢查：
  - Resend API Key 是否正確
  - `RESEND_FROM_EMAIL` 是否已驗證
  - 檢查 Resend Dashboard 的 **Logs** 頁面查看發送狀態

## 🔍 疑難排解

### 問題 1：Email 未收到

**可能原因：**
- Email 被歸類為垃圾郵件
- Resend API Key 未設定或錯誤
- `RESEND_FROM_EMAIL` 未驗證

**解決方法：**
1. 檢查垃圾郵件資料夾
2. 確認 `.env.local` 中的環境變數正確
3. 使用測試腳本查詢資料庫中的 OTP
4. 檢查 Resend Dashboard 的 Logs 頁面

### 問題 2：OTP 驗證失敗

**可能原因：**
- OTP 已過期（10 分鐘有效期）
- OTP 已使用
- 輸入錯誤

**解決方法：**
1. 重新發送新的 OTP
2. 確認輸入的驗證碼正確（6 位數）
3. 檢查系統時間是否正確

### 問題 3：Rate Limit 錯誤

**可能原因：**
- 發送請求過於頻繁

**解決方法：**
- 等待一段時間後再試
- 免費方案限制：100 封/日

### 問題 4：開發伺服器錯誤

**錯誤訊息：**
```
環境變數驗證失敗：RESEND_API_KEY is required
```

**解決方法：**
1. 確認 `.env.local` 檔案存在
2. 確認環境變數名稱正確（大小寫敏感）
3. 重新啟動開發伺服器：
   ```bash
   # 停止伺服器（Ctrl+C）
   npm run dev
   ```

## 📝 測試 Email 範本

您也可以使用專案提供的 Email 範本測試腳本：

```bash
node scripts/test-otp-email-template.js
```

這會顯示 OTP Email 的 HTML 預覽，方便檢查 Email 格式。

## 🎯 最佳實踐

1. **開發環境建議**：
   - 使用測試腳本查詢 OTP，避免等待 Email
   - 設定自己的網域以提升送達率

2. **測試 Email**：
   - 使用真實的 Email 地址測試
   - 檢查垃圾郵件資料夾
   - 確認 Email 格式正確

3. **安全性**：
   - 不要將 `.env.local` 提交到 Git
   - 定期更換 API Key
   - 生產環境使用已驗證的網域

## 📚 相關文件

- [SETUP.md](../SETUP.md) - 完整設定指南
- [DATABASE.md](../DATABASE.md) - 資料庫結構說明
- [scripts/test-otp-verification.js](../scripts/test-otp-verification.js) - OTP 測試腳本

## 💡 快速參考

```bash
# 1. 啟動開發伺服器
npm run dev

# 2. 測試 OTP 功能
node scripts/test-otp-verification.js

# 3. 查看 Email 範本
node scripts/test-otp-email-template.js
```

---

**需要協助？** 請檢查：
- Resend Dashboard → Logs（查看發送記錄）
- 瀏覽器 Console（查看前端錯誤）
- 終端機輸出（查看後端錯誤）
