# Resend Email 服務設定指南

完整的 Resend Email 服務設定教學，用於發送 OTP 驗證碼和系統通知郵件。

## 目錄

- [一、註冊 Resend 帳號](#一註冊-resend-帳號)
- [二、添加並驗證網域](#二添加並驗證網域)
- [三、DNS 設定](#三dns-設定)
- [四、創建 API Key](#四創建-api-key)
- [五、環境變數設定](#五環境變數設定)
- [六、測試發送](#六測試發送)
- [七、常見問題](#七常見問題)

---

## 一、註冊 Resend 帳號

### 1. 前往 Resend 官網

訪問 [https://resend.com](https://resend.com) 並點擊「Sign Up」。

### 2. 註冊方式

可以選擇以下任一方式註冊：
- **GitHub 帳號**登入（推薦，最快速）
- **Email 註冊**

### 3. 驗證 Email

如果使用 Email 註冊，需要驗證您的 Email 地址。

### 4. 完成註冊

註冊完成後，會進入 Resend Dashboard。

---

## 二、添加並驗證網域

### 1. 進入 Domains 頁面

在 Resend Dashboard 左側選單中，點擊「**Domains**」。

### 2. 添加網域

1. 點擊右上角的「**Add Domain**」按鈕
2. 輸入您的網域名稱（例如：`yourdomain.com`）
   - **不要**包含 `www.`
   - **不要**包含 `http://` 或 `https://`
   - 只輸入純網域，例如：`example.com`
3. 點擊「**Add**」

### 3. 網域類型

Resend 會詢問您要如何使用這個網域：

- **Sending Domain**（發送網域）：用於發送 Email（選這個）
- **Receiving Domain**（接收網域）：用於接收 Email（暫時不需要）

選擇「**Sending Domain**」。

---

## 三、DNS 設定

添加網域後，Resend 會提供需要設定的 DNS 記錄。這些記錄用於驗證您擁有該網域，並確保郵件能夠順利發送。

### DNS 記錄類型

Resend 會要求您添加以下 3 種 DNS 記錄：

#### 1. SPF 記錄（TXT）

**作用**：驗證郵件發送者身份

```
類型：TXT
名稱：@ 或您的網域名稱
值：v=spf1 include:resend.com ~all
TTL：3600（或預設值）
```

#### 2. DKIM 記錄（TXT）

**作用**：郵件簽名驗證，防止偽造

```
類型：TXT
名稱：resend._domainkey（Resend 會提供完整的名稱）
值：（Resend 會提供一串長字串）
TTL：3600（或預設值）
```

**範例**：
```
名稱：resend._domainkey.yourdomain.com
值：k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...（很長的字串）
```

#### 3. DMARC 記錄（TXT）

**作用**：設定郵件政策，提高信譽

```
類型：TXT
名稱：_dmarc
值：v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
TTL：3600（或預設值）
```

### 如何添加 DNS 記錄

DNS 記錄的添加方式取決於您的網域註冊商或 DNS 服務提供商。以下是常見平台的設定方式：

#### Cloudflare（推薦）

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇您的網域
3. 點擊「**DNS**」→「**Records**」
4. 點擊「**Add record**」
5. 依序添加 SPF、DKIM、DMARC 記錄
6. 確保「Proxy status」設為 **DNS only**（灰色雲朵圖示）

#### GoDaddy

1. 登入 GoDaddy 帳號
2. 前往「**My Products**」→「**Domains**」
3. 點擊您的網域旁的「**DNS**」
4. 點擊「**Add**」添加 TXT 記錄
5. 依序添加 SPF、DKIM、DMARC 記錄

#### Namecheap

1. 登入 Namecheap 帳號
2. 前往「**Domain List**」
3. 點擊網域旁的「**Manage**」
4. 選擇「**Advanced DNS**」標籤
5. 點擊「**Add New Record**」
6. 依序添加 SPF、DKIM、DMARC 記錄

#### Google Domains

1. 登入 Google Domains
2. 選擇您的網域
3. 前往「**DNS**」設定
4. 滾動到「**Custom resource records**」
5. 依序添加 SPF、DKIM、DMARC 記錄

### DNS 設定範例

假設您的網域是 `example.com`，完整的 DNS 設定如下：

| 類型 | 名稱 | 值 | TTL |
|------|------|-----|-----|
| TXT | @ 或 example.com | `v=spf1 include:resend.com ~all` | 3600 |
| TXT | resend._domainkey | `k=rsa; p=MIGfMA0GC...`（Resend 提供） | 3600 |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:dmarc@example.com` | 3600 |

### 等待 DNS 生效

- DNS 記錄通常需要 **5-30 分鐘**生效
- 最多可能需要 **24-48 小時**完全傳播

### 檢查 DNS 記錄

**方法 1：使用自動檢查腳本**

專案包含 DNS 檢查腳本：

```bash
node scripts/check-dns-records.js yourdomain.com
```

輸出範例：

```
🔍 檢查網域: yourdomain.com

1️⃣ 檢查 SPF 記錄...
   ✅ SPF 記錄已設定

2️⃣ 檢查 DKIM 記錄...
   ✅ DKIM 記錄已設定

3️⃣ 檢查 DMARC 記錄...
   ✅ DMARC 記錄已設定
```

**方法 2：使用線上工具**

- [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) - 最全面的 DNS 檢查工具
- [DNSChecker](https://dnschecker.org/) - 檢查全球 DNS 傳播狀態
- [WhatMyDNS](https://www.whatsmydns.net/) - 檢查不同地區的 DNS 記錄

---

## 四、驗證網域

### 1. 回到 Resend Dashboard

在 DNS 記錄添加完成並等待生效後，回到 Resend 的「Domains」頁面。

### 2. 驗證網域

1. 找到您添加的網域
2. 點擊「**Verify**」按鈕
3. Resend 會檢查 DNS 記錄是否正確

### 3. 驗證狀態

驗證成功後，您會看到以下狀態：

- ✅ **SPF**: Verified
- ✅ **DKIM**: Verified
- ✅ **DMARC**: Verified

### 4. 驗證失敗？

如果驗證失敗，請檢查：

1. DNS 記錄是否正確輸入（注意空格、標點符號）
2. DNS 是否已生效（等待更長時間）
3. DNS 記錄的「名稱」欄位是否正確（有些 DNS 提供商會自動添加網域後綴）
4. 使用 DNS 檢查工具確認記錄是否可見

---

## 四、創建 API Key

### 1. 進入 API Keys 頁面

在 Resend Dashboard 左側選單中，點擊「**API Keys**」。

### 2. 創建新的 API Key

1. 點擊右上角的「**Create API Key**」按鈕
2. 設定 API Key 資訊：
   - **Name**: 為您的 API Key 命名（例如：`Production Key`、`Development Key`）
   - **Permission**: 選擇權限
     - **Full Access**：完全權限（推薦用於開發環境）
     - **Sending Access**：僅發送郵件權限（推薦用於生產環境）
   - **Domain**: 選擇剛才驗證的網域
3. 點擊「**Create**」

### 3. 複製 API Key

**⚠️ 重要提醒：**
- API Key 只會顯示一次，請立即複製並妥善保存
- 格式：`re_xxxxxxxxxxxxxxxxxxxxxxxxxx`
- 如果遺失，需要重新創建

### 4. 保存到環境變數

將 API Key 保存到 `.env.local` 文件：

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**注意**：
- `RESEND_FROM_EMAIL` 必須使用您已驗證的網域
- 可以使用任何前綴，例如：
  - `noreply@yourdomain.com`
  - `hello@yourdomain.com`
  - `support@yourdomain.com`
  - `otp@yourdomain.com`

---

## 五、環境變數設定

### 本地開發環境

在專案根目錄的 `.env.local` 文件中添加：

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Vercel 生產環境

1. 登入 [Vercel Dashboard](https://vercel.com)
2. 選擇您的專案
3. 前往「**Settings**」→「**Environment Variables**」
4. 添加以下環境變數：

| Name | Value | Environment |
|------|-------|-------------|
| `RESEND_API_KEY` | `re_xxxxx...` | Production, Preview, Development |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | Production, Preview, Development |

5. 點擊「**Save**」
6. **重新部署**專案以使環境變數生效

---

## 六、測試發送

### 方法 1：使用測試腳本

專案已包含測試腳本 `scripts/test-email.js`：

```bash
# 確保已安裝依賴
npm install

# 執行測試
node scripts/test-email.js
```

成功的輸出：

```
✅ Resend API Key 已設定
✅ Email 發送地址已設定: noreply@yourdomain.com
✅ Resend 套件已安裝

📧 正在發送測試郵件到 your-email@example.com...

✅ 郵件發送成功！
📬 郵件 ID: 550e8400-e29b-41d4-a716-446655440000
```

### 方法 2：測試註冊流程

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 開啟瀏覽器訪問：
   ```
   http://localhost:3000/register
   ```

3. 輸入您的 Email 並點擊「發送驗證碼」

4. 檢查您的 Email 收件匣（也檢查垃圾郵件資料夾）

5. 應該會收到類似以下的郵件：

```
主旨：您的驗證碼

您的驗證碼是：123456

此驗證碼將在 10 分鐘後過期。

如果您沒有要求此驗證碼，請忽略此郵件。
```

### 方法 3：使用 Resend Dashboard

1. 前往 Resend Dashboard 的「**Emails**」頁面
2. 查看最近發送的郵件
3. 確認郵件狀態：
   - ✅ **Delivered**：成功送達
   - ⏳ **Sending**：發送中
   - ❌ **Bounced**：退信
   - ❌ **Complained**：被標記為垃圾郵件

---

## 七、發送限制

### 免費方案

Resend 免費方案限制：

- **每月**: 3,000 封郵件
- **每日**: 100 封郵件
- **速率限制**: 10 封/秒

### 付費方案

如需更高的發送量，可以升級到付費方案：

- **Pro**: $20/月，起始 50,000 封/月
- **Enterprise**: 自訂價格，無限量

---

## 八、郵件模板優化

### 目前的 OTP 郵件模板

位於 `lib/email/resend.ts`：

```typescript
export async function sendOTPEmail(email: string, otpCode: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>您的驗證碼</h2>
      <p>您的驗證碼是：</p>
      <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${otpCode}</h1>
      <p>此驗證碼將在 <strong>10 分鐘</strong>後過期。</p>
      <p style="color: #666; font-size: 14px;">如果您沒有要求此驗證碼，請忽略此郵件。</p>
    </div>
  `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '您的驗證碼',
    html,
  });
}
```

### 優化建議

1. **添加品牌 Logo**：
   ```html
   <img src="https://yourdomain.com/logo.png" alt="Logo" width="150">
   ```

2. **使用 React Email**（進階）：
   - 安裝：`npm install @react-email/components`
   - 使用 React 組件創建郵件模板
   - 更好的維護性和重用性

3. **添加追蹤**：
   - 使用 Resend 的 `tags` 功能追蹤郵件類型
   - 監控開信率和點擊率

---

## 九、常見問題

### Q: DNS 記錄設定後多久會生效？

**A:** 通常 5-30 分鐘，最多可能需要 24-48 小時。可以使用 [MXToolbox](https://mxtoolbox.com) 檢查 DNS 記錄是否已生效。

### Q: 郵件進入垃圾郵件資料夾？

**A:** 確保以下設定正確：
1. ✅ SPF、DKIM、DMARC 記錄都已驗證
2. ✅ 使用已驗證的網域發送
3. ✅ 郵件內容不要包含過多促銷詞彙
4. ✅ 發送量不要太大（避免被視為垃圾郵件）

### Q: 郵件發送失敗，錯誤「API key is invalid」？

**A:** 檢查以下項目：
1. `RESEND_API_KEY` 是否正確複製（包含 `re_` 前綴）
2. API Key 是否已過期或被刪除
3. 是否有額外的空格或換行
4. 環境變數是否正確載入（使用 `node scripts/test-email.js` 測試）

### Q: 郵件發送失敗，錯誤「Domain not verified」？

**A:** 
1. 確認網域已在 Resend Dashboard 驗證
2. 確認 `RESEND_FROM_EMAIL` 使用的是已驗證的網域
3. 等待 DNS 記錄完全生效

### Q: 可以使用子網域發送郵件嗎？

**A:** 可以！例如：
- 主網域：`yourdomain.com`
- 子網域：`mail.yourdomain.com`

只需要在 Resend 添加子網域，並設定對應的 DNS 記錄即可。

### Q: 如何追蹤郵件發送狀態？

**A:** 
1. 前往 Resend Dashboard 的「Emails」頁面
2. 查看郵件詳細資訊（送達、開信、點擊等）
3. 使用 Webhooks 接收即時通知（進階功能）

### Q: 免費方案的 3,000 封郵件夠用嗎？

**A:** 取決於使用情況：
- **OTP 驗證碼**：每次登入/註冊 1 封
- **訂單通知**：每筆訂單 1-2 封

估算：
- 如果每天有 50 位用戶登入，每月 = 50 × 30 = 1,500 封
- 如果每天有 20 筆訂單，每月 = 20 × 30 = 600 封
- 總計：2,100 封/月（在免費額度內）

### Q: Resend vs SendGrid vs AWS SES？

**A:** 

| 特性 | Resend | SendGrid | AWS SES |
|------|--------|----------|---------|
| 免費額度 | 3,000/月 | 100/日 | 62,000/月 |
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 文檔品質 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 價格 | 💰 | 💰💰 | 💰 |
| React Email | ✅ | ❌ | ❌ |

**推薦**：新專案使用 Resend，免費額度足夠，API 簡單易用。

---

## 十、進階功能

### 1. 使用 Webhooks

監聽郵件事件（送達、開信、點擊等）：

```typescript
// app/api/webhooks/resend/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  
  switch (event.type) {
    case 'email.delivered':
      console.log('郵件已送達:', event.data);
      break;
    case 'email.bounced':
      console.log('郵件退信:', event.data);
      break;
  }
  
  return Response.json({ received: true });
}
```

### 2. 批次發送

發送大量郵件：

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.batch.send([
  {
    from: 'noreply@yourdomain.com',
    to: 'user1@example.com',
    subject: '通知',
    html: '<p>內容</p>',
  },
  {
    from: 'noreply@yourdomain.com',
    to: 'user2@example.com',
    subject: '通知',
    html: '<p>內容</p>',
  },
]);
```

### 3. 使用標籤 (Tags)

追蹤不同類型的郵件：

```typescript
await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: email,
  subject: '您的驗證碼',
  html: '<p>驗證碼：123456</p>',
  tags: [
    { name: 'type', value: 'otp' },
    { name: 'category', value: 'auth' },
  ],
});
```

---

## 十一、參考資源

- **Resend 官方文檔**: https://resend.com/docs
- **Resend API 參考**: https://resend.com/docs/api-reference
- **React Email**: https://react.email
- **DNS 檢查工具**: https://mxtoolbox.com
- **郵件測試工具**: https://www.mail-tester.com

---

## 十二、檢查清單

設定完成前，請確認以下項目：

- [ ] 已註冊 Resend 帳號
- [ ] 已添加網域到 Resend
- [ ] 已設定 SPF、DKIM、DMARC DNS 記錄
- [ ] DNS 記錄已驗證（Resend Dashboard 顯示綠色勾選）
- [ ] 已創建 API Key
- [ ] 已設定環境變數（本地 + Vercel）
- [ ] 已測試發送郵件（使用 `test-email.js` 或註冊流程）
- [ ] 郵件能成功送達收件匣（不在垃圾郵件中）
- [ ] 已設定 `RESEND_FROM_EMAIL` 使用已驗證的網域

---

**🎉 設定完成！**

現在您的系統已經可以透過 Resend 發送 OTP 驗證碼和系統通知郵件了！

