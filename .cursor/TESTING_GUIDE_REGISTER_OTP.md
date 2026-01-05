# 註冊與 OTP 功能測試指南

> **測試對象**: 註冊帳號發送驗證碼到信箱功能  
> **測試日期**: 2026-01-04  
> **測試環境**: 本地開發 / 生產環境

---

## 前置準備

### 1. 環境變數檢查

確保以下環境變數已正確設定（`.env.local` 或部署平台）：

```env
# ✅ 必要：Resend Email 服務
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ✅ 必要：Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ✅ 必要：JWT Session
JWT_SECRET=your_32_character_or_longer_secret

# ✅ 必要：Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**檢查方式**:
```bash
# 1. 檢查 .env.local 檔案是否存在
ls -la .env.local

# 2. 驗證必要環境變數
node -e "console.log(process.env.RESEND_API_KEY ? '✅' : '❌', 'RESEND_API_KEY')"
```

---

### 2. 取得 Resend API Key

如果尚未設定 Resend：

1. **註冊 Resend 帳號**
   - 前往 https://resend.com
   - 使用 Email 或 GitHub 註冊

2. **驗證域名**（用於生產環境）
   ```
   設定 → Domains → Add Domain
   → 添加 DNS 記錄（DKIM, SPF, DMARC）
   → 等待驗證完成（約 5-15 分鐘）
   ```

3. **建立 API Key**
   ```
   API Keys → Create API Key
   → 選擇權限：Full Access
   → 複製 Key（只顯示一次）
   ```

4. **測試用域名**（開發環境）
   - Resend 提供測試用 Email：`onboarding@resend.dev`
   - 可用於測試，但無法實際發送（僅在 Dashboard 看到）

---

### 3. 資料庫準備

確保 `otp_tokens` 和 `customers` 表已建立：

```sql
-- 檢查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('otp_tokens', 'customers');

-- 檢查 otp_tokens 表結構
\d otp_tokens;

-- 清空測試資料（可選）
TRUNCATE TABLE otp_tokens;
DELETE FROM customers WHERE email LIKE '%test%';
```

---

## 測試計畫

### 測試矩陣

| 測試項目 | 測試方法 | 預期結果 | 優先級 |
|---------|---------|---------|-------|
| **功能測試** | | | |
| 1. 成功註冊流程 | 手動測試 | 收到 Email + 驗證成功 | P0 🔴 |
| 2. Email 重複檢查 | 手動測試 | 顯示錯誤訊息 | P0 🔴 |
| 3. 電話重複檢查 | 手動測試 | 顯示錯誤訊息 | P0 🔴 |
| 4. OTP 驗證成功 | 手動測試 | 登入成功並重導向 | P0 🔴 |
| 5. OTP 驗證失敗 | 手動測試 | 顯示錯誤 + 輸入框變紅 | P1 🟡 |
| 6. 重新發送 OTP | 手動測試 | 收到新的驗證碼 | P1 🟡 |
| **安全測試** | | | |
| 7. Rate Limiting - IP | 工具測試 | 429 Too Many Requests | P0 🔴 |
| 8. Rate Limiting - Email | 工具測試 | 429 Too Many Requests | P0 🔴 |
| 9. OTP 過期檢查 | 時間測試 | 10 分鐘後無法驗證 | P1 🟡 |
| 10. OTP 重複使用 | 手動測試 | 第二次驗證失敗 | P1 🟡 |
| **UI/UX 測試** | | | |
| 11. OTP 輸入框互動 | 手動測試 | 自動跳轉 + 貼上 | P1 🟡 |
| 12. 倒數計時器 | 手動測試 | 120 秒倒數正確 | P2 🟢 |
| 13. 錯誤訊息顯示 | 手動測試 | 清晰且友善 | P1 🟡 |
| 14. Loading 狀態 | 手動測試 | 按鈕顯示 Loading | P2 🟢 |
| **Email 測試** | | | |
| 15. Email 模板渲染 | 郵件客戶端 | 格式正確 + 響應式 | P1 🟡 |
| 16. 垃圾信件檢查 | 郵件客戶端 | 不進垃圾信件 | P1 🟡 |
| 17. 多個郵件客戶端 | Gmail/Outlook | 顯示一致 | P2 🟢 |

---

## 詳細測試步驟

### 🧪 測試 1: 成功註冊流程（P0）

**前置條件**: 
- 已設定 `RESEND_API_KEY`
- Email 和電話未被使用

**步驟**:
1. 開啟瀏覽器到 `http://localhost:3000/register`
2. 填寫表單：
   ```
   Email: testuser001@example.com
   姓名: 測試用戶001
   電話: 0912345678
   ```
3. 點擊「註冊並發送驗證碼」
4. 等待 API 回應（約 1-3 秒）
5. 檢查頁面是否切換到 OTP 輸入畫面
6. 開啟 Email 收件匣（包含垃圾信件）
7. 找到「您的登入驗證碼」信件
8. 複製 6 位數驗證碼
9. 在頁面上輸入驗證碼
10. 點擊「完成註冊」
11. 檢查是否自動登入並重導向首頁

**預期結果**:
- ✅ 表單驗證通過
- ✅ API 回應 200 OK
- ✅ 收到 Email（1-5 秒內）
- ✅ Email 顯示正確驗證碼
- ✅ 驗證碼可成功驗證
- ✅ 自動登入並重導向

**失敗處理**:
```bash
# 如果未收到 Email，檢查：
1. RESEND_API_KEY 是否正確
2. RESEND_FROM_EMAIL 是否已驗證
3. 查看 Resend Dashboard 的 Logs
4. 檢查 Next.js 終端機日誌

# 檢查 Supabase
SELECT * FROM customers WHERE email = 'testuser001@example.com';
SELECT * FROM otp_tokens WHERE email = 'testuser001@example.com' ORDER BY created_at DESC LIMIT 1;
```

---

### 🧪 測試 2: Email 重複檢查（P0）

**前置條件**: 
- 已有一個註冊用戶（email: `existing@example.com`）

**步驟**:
1. 開啟 `http://localhost:3000/register`
2. 填寫表單：
   ```
   Email: existing@example.com  (已存在)
   姓名: 新用戶
   電話: 0923456789
   ```
3. 點擊「註冊並發送驗證碼」

**預期結果**:
- ✅ API 回應 `409 Conflict`
- ✅ 顯示錯誤訊息：「此 Email 已被註冊」
- ✅ 不發送 Email
- ✅ 不建立新用戶

**驗證**:
```bash
# 檢查資料庫
SELECT COUNT(*) FROM customers WHERE email = 'existing@example.com';
# 應該只有 1 筆（原有用戶）
```

---

### 🧪 測試 3: 電話重複檢查（P0）

**前置條件**: 
- 已有一個註冊用戶（phone: `0912345678`）

**步驟**:
1. 開啟 `http://localhost:3000/register`
2. 填寫表單：
   ```
   Email: newuser@example.com
   姓名: 新用戶
   電話: 0912345678  (已存在)
   ```
3. 點擊「註冊並發送驗證碼」

**預期結果**:
- ✅ API 回應 `409 Conflict`
- ✅ 顯示錯誤訊息：「此電話號碼已被使用」
- ✅ 不發送 Email
- ✅ 不建立新用戶

---

### 🧪 測試 7: Rate Limiting - IP 限制（P0）

**測試工具**: `curl` 或 Postman

**步驟**:
```bash
# 快速發送 6 次請求（超過限制 5 次/分鐘）
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"name\":\"測試$i\",\"phone\":\"091234567$i\"}" \
    -w "\n" &
done
wait
```

**預期結果**:
- ✅ 前 5 次請求成功（200 或 409）
- ✅ 第 6 次請求回應 `429 Too Many Requests`
- ✅ 錯誤訊息：「請求過於頻繁，請稍後再試」

**驗證**:
```bash
# 檢查 Rate Limiting 記錄（如果使用 Redis）
# 或查看終端機日誌
```

---

### 🧪 測試 8: Rate Limiting - Email 限制（P0）

**步驟**:
```bash
# 2 分鐘內重複發送同一 Email 的 OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 立即再發送一次
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**預期結果**:
- ✅ 第一次請求成功
- ✅ 第二次請求回應 `429 Too Many Requests`
- ✅ 錯誤訊息：「驗證碼發送過於頻繁，請稍後再試」

---

### 🧪 測試 9: OTP 過期檢查（P1）

**前置條件**: 需要修改 OTP 過期時間以快速測試

**臨時修改** (`lib/supabase/otp.ts`):
```typescript
// 原本：10 分鐘
const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

// 測試用：30 秒
const expiresAt = new Date(Date.now() + 30 * 1000);
```

**步驟**:
1. 註冊新用戶並取得 OTP
2. **等待 31 秒**
3. 輸入 OTP 驗證碼
4. 點擊「完成註冊」

**預期結果**:
- ✅ API 回應 `400 Bad Request`
- ✅ 錯誤訊息：「驗證碼已過期，請重新發送」
- ✅ 驗證失敗

**注意**: 測試後記得還原為 10 分鐘！

---

### 🧪 測試 11: OTP 輸入框互動（P1）

**測試項目**:

1. **自動跳轉**:
   - 在第一個輸入框輸入數字
   - 應自動跳到第二個輸入框

2. **貼上功能**:
   - 複製驗證碼 `123456`
   - 在任一輸入框按 Ctrl+V
   - 應自動分散到 6 個輸入框

3. **鍵盤導航**:
   - 按 ← 鍵：移到前一個輸入框
   - 按 → 鍵：移到下一個輸入框

4. **Backspace 刪除**:
   - 在有值的輸入框按 Backspace：刪除當前值
   - 在空輸入框按 Backspace：刪除前一個輸入框的值並跳回

5. **錯誤狀態**:
   - 輸入錯誤驗證碼
   - 6 個輸入框應全部變紅色

**預期結果**:
- ✅ 所有互動功能正常
- ✅ 視覺反饋清晰
- ✅ 無卡頓或延遲

---

### 🧪 測試 15: Email 模板渲染（P1）

**測試環境**:
- Gmail (網頁版)
- Gmail (手機 App)
- Outlook (網頁版)
- Apple Mail (iOS)

**檢查項目**:

1. **標題區塊**:
   - ✅ 漸層背景顯示正常
   - ✅ "☕ 咖啡豆訂單系統" 置中且清晰

2. **驗證碼區塊**:
   - ✅ 驗證碼大字體顯示（36px）
   - ✅ 字母間距正確（letter-spacing: 8px）
   - ✅ 黃色邊框（#f59e0b）顯示

3. **警告區塊**:
   - ✅ 淺黃色背景（#fef3c7）
   - ✅ 左側黃色豎線顯示
   - ✅ 警告圖示（⚠️）顯示

4. **響應式設計**:
   - ✅ 手機上排版正常
   - ✅ 文字大小適中
   - ✅ 沒有橫向滾動

**失敗處理**:
```bash
# 如果 Email 顯示異常：
1. 檢查 HTML Email 語法（Litmus 測試）
2. 避免使用複雜的 CSS（某些客戶端不支援）
3. 使用 Inline CSS 而非 <style> 標籤
```

---

## 自動化測試腳本

### 快速健康檢查腳本

**檔案**: `scripts/test-register-otp.sh`

```bash
#!/bin/bash

echo "=== 註冊與 OTP 功能健康檢查 ==="
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 環境變數檢查
echo "1. 檢查環境變數..."
if [ -z "$RESEND_API_KEY" ]; then
  echo -e "${RED}❌ RESEND_API_KEY 未設定${NC}"
  exit 1
else
  echo -e "${GREEN}✅ RESEND_API_KEY 已設定${NC}"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_URL 未設定${NC}"
  exit 1
else
  echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL 已設定${NC}"
fi

# 2. 測試註冊 API
echo ""
echo "2. 測試註冊 API..."
RANDOM_EMAIL="test$(date +%s)@example.com"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"name\":\"測試用戶\",\"phone\":\"0987654321\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ 註冊 API 正常${NC}"
else
  echo -e "${RED}❌ 註冊 API 異常${NC}"
  echo "$RESPONSE"
  exit 1
fi

# 3. 測試 Rate Limiting
echo ""
echo "3. 測試 Rate Limiting..."
for i in {1..6}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i$(date +%s)@example.com\",\"name\":\"測試$i\",\"phone\":\"091234567$i\"}")
  
  if [ $i -eq 6 ] && [ "$STATUS" == "429" ]; then
    echo -e "${GREEN}✅ Rate Limiting 正常運作${NC}"
  fi
done

echo ""
echo "=== 健康檢查完成 ==="
```

**執行方式**:
```bash
chmod +x scripts/test-register-otp.sh
./scripts/test-register-otp.sh
```

---

## 問題排查指南

### 問題 1: 未收到 Email

**可能原因**:
1. `RESEND_API_KEY` 未設定或錯誤
2. `RESEND_FROM_EMAIL` 域名未驗證
3. Email 進入垃圾信件
4. Resend 服務異常

**排查步驟**:
```bash
# 1. 檢查環境變數
echo $RESEND_API_KEY
echo $RESEND_FROM_EMAIL

# 2. 檢查 Next.js 日誌
# 查看終端機輸出，搜尋 "Error sending OTP email"

# 3. 檢查 Resend Dashboard
# 前往 https://resend.com/emails
# 查看最近的 Email 發送記錄

# 4. 測試 Resend API
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'"$RESEND_FROM_EMAIL"'",
    "to": "your-email@example.com",
    "subject": "測試",
    "html": "<p>測試 Email</p>"
  }'

# 5. 檢查 Supabase OTP 記錄
# 確認 OTP 是否有建立到資料庫
```

---

### 問題 2: OTP 驗證失敗

**可能原因**:
1. OTP 已過期（> 10 分鐘）
2. OTP 已使用過
3. Email 大小寫不一致
4. 資料庫連線異常

**排查步驟**:
```sql
-- 檢查 OTP 記錄
SELECT 
  id,
  email,
  otp_code,
  expires_at,
  is_used,
  created_at,
  NOW() as current_time,
  (expires_at > NOW()) as is_valid
FROM otp_tokens
WHERE email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 5;

-- 檢查是否過期
SELECT 
  otp_code,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_ago,
  CASE 
    WHEN expires_at > NOW() THEN 'VALID'
    ELSE 'EXPIRED'
  END as status
FROM otp_tokens
WHERE email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

---

### 問題 3: Rate Limiting 過於嚴格

**症狀**: 正常使用也被限制

**臨時解決方案**:
```typescript
// 修改 lib/rate-limit.ts
const RATE_LIMITS = {
  // 放寬限制
  IP_OTP_REQUEST: { max: 10, window: 60 * 1000 },  // 原本 5 次
  EMAIL_OTP_REQUEST: { max: 2, window: 2 * 60 * 1000 },  // 原本 1 次
  IP_OTP_VERIFY: { max: 20, window: 60 * 1000 },  // 原本 10 次
};
```

**長期解決方案**:
- 使用 Redis 實作分散式 Rate Limiting
- 根據實際使用情況調整限制參數
- 實作白名單機制（測試用 IP）

---

## 測試報告模板

**測試日期**: 2026-01-04  
**測試人員**: [姓名]  
**測試環境**: [本地 / Staging / Production]

### 測試結果總覽

| 測試項目 | 狀態 | 備註 |
|---------|------|------|
| 成功註冊流程 | ✅ / ❌ | |
| Email 重複檢查 | ✅ / ❌ | |
| 電話重複檢查 | ✅ / ❌ | |
| OTP 驗證成功 | ✅ / ❌ | |
| OTP 驗證失敗 | ✅ / ❌ | |
| 重新發送 OTP | ✅ / ❌ | |
| Rate Limiting - IP | ✅ / ❌ | |
| Rate Limiting - Email | ✅ / ❌ | |
| OTP 過期檢查 | ✅ / ❌ | |
| OTP 重複使用 | ✅ / ❌ | |
| OTP 輸入框互動 | ✅ / ❌ | |
| 倒數計時器 | ✅ / ❌ | |
| Email 模板渲染 | ✅ / ❌ | |

### 發現問題

1. **問題描述**: [詳細描述]  
   **嚴重程度**: Critical / High / Medium / Low  
   **重現步驟**: [步驟]  
   **預期結果**: [描述]  
   **實際結果**: [描述]  
   **截圖**: [附圖]

### 測試結論

- [ ] 所有測試通過，可以上線
- [ ] 有 Critical/High 問題，需要修復後重測
- [ ] 有 Medium/Low 問題，可以上線但需追蹤

---

**簽核**:  
測試人員: __________  
審核人員: __________  
日期: __________


