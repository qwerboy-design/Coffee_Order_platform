# 修復「用戶不存在」錯誤

## 🐛 問題描述

**症狀**: 註冊後收到 OTP 驗證碼，但輸入驗證碼時顯示「用戶不存在，請重新註冊」

**根本原因**: 
1. 客戶記錄建立失敗，但 OTP 仍然成功發送
2. 導致驗證時找不到對應的客戶記錄

---

## ✅ 已實施的修復

### 1. 改進註冊 API 錯誤處理 (`app/api/auth/register/route.ts`)

**修改前**:
```typescript
// 4. 建立客戶記錄
const customer = await createOrUpdateCustomer({
  email,
  name,
  phone,
});

// 5. 建立並發送 OTP
try {
  // ... OTP 發送邏輯
} catch (error) {
  // 即使客戶建立失敗，仍可能發送 OTP
}
```

**修改後**:
```typescript
// 4. 建立客戶記錄
let customer;
try {
  customer = await createOrUpdateCustomer({
    email,
    name,
    phone,
  });
  console.log('Customer created successfully:', {
    id: customer.id,
    email: customer.email,
    name: customer.name
  });
} catch (error) {
  console.error('Error creating customer:', error);
  return NextResponse.json(
    createErrorResponse(
      AuthErrorCode.INTERNAL_ERROR,
      '建立客戶記錄失敗，請稍後再試'
    ),
    { status: 500 }
  );
}

// 5. 建立並發送 OTP（只有客戶建立成功後才執行）
try {
  // ... OTP 發送邏輯
} catch (error) {
  // 客戶已建立，但 OTP 發送失敗
}
```

**改進點**:
- ✅ 明確分離客戶建立和 OTP 發送的錯誤處理
- ✅ 如果客戶建立失敗，立即返回錯誤，不發送 OTP
- ✅ 添加詳細的日誌記錄，方便追蹤問題

---

### 2. 增強驗證 API 日誌 (`app/api/auth/verify-otp/route.ts`)

**修改後**:
```typescript
// 2. 驗證 OTP
console.log('Verifying OTP:', { email, otp_code });
const verifyResult = await verifyOTPToken(email, otp_code);

if (!verifyResult.success) {
  console.log('OTP verification failed:', verifyResult.error);
  // ... 錯誤處理
}

console.log('OTP verified successfully');

// 3. 取得客戶資料
console.log('Finding customer by email:', email);
const customer = await findCustomerByEmail(email);

if (!customer) {
  console.error('Customer not found after OTP verification:', { email });
  
  // 這是一個嚴重的錯誤：OTP 驗證通過但找不到客戶
  return NextResponse.json(
    createErrorResponse(
      AuthErrorCode.UNAUTHORIZED, 
      '用戶不存在，請重新註冊'
    ),
    { status: 404 }
  );
}

console.log('Customer found:', {
  id: customer.id,
  email: customer.email,
  name: customer.name
});
```

**改進點**:
- ✅ 添加詳細的日誌記錄每個步驟
- ✅ 明確標記「用戶不存在」為嚴重錯誤
- ✅ 記錄可能的原因，方便診斷

---

## 🔍 診斷工具

### 工具 1: 完整流程測試 (推薦)

```powershell
# 需要先啟動開發伺服器
npm run dev

# 在另一個終端執行
node scripts/test-full-flow.js
```

**功能**:
1. 自動註冊新用戶
2. 檢查資料庫中的客戶記錄
3. 檢查資料庫中的 OTP 記錄
4. 自動驗證 OTP
5. 顯示詳細的診斷報告

**輸出範例**:
```
==============================================
  完整註冊驗證流程測試
==============================================

測試資料：
  Email: test1767594888916@example.com
  姓名: 測試用戶1767594888916
  電話: 0994888916

[1/4] 測試註冊 API...
✅ 註冊成功
  客戶 ID: 021d0441-eeb3-4b05-960e-2428cc1bfb0e
  Email: test1767594888916@example.com

[2/4] 檢查資料庫中的客戶記錄...
✅ 找到客戶記錄
  ID: 021d0441-eeb3-4b05-960e-2428cc1bfb0e
  姓名: 測試用戶1767594888916
  Email: test1767594888916@example.com
  電話: 0994888916

[3/4] 檢查資料庫中的 OTP 記錄...
✅ 找到 OTP 記錄
  驗證碼: 123456
  Email: test1767594888916@example.com
  狀態: 有效

[4/4] 測試 OTP 驗證...
✅ OTP 驗證成功
```

---

### 工具 2: 用戶狀態檢查

```powershell
node scripts/check-user-status.js
```

**功能**:
- 查詢用戶的完整狀態
- 查看所有 OTP 記錄
- 清理測試資料（可選）

---

### 工具 3: 診斷註冊流程

```powershell
node scripts/diagnose-registration.js
```

**功能**:
- 檢查 Supabase 連線
- 查詢現有的客戶和 OTP 記錄
- 發送測試郵件

---

## 🧪 測試步驟

### 步驟 1: 清理舊資料（如果需要）

```powershell
node scripts/check-user-status.js
```

選擇選項 3 刪除所有記錄，重新開始測試。

---

### 步驟 2: 啟動開發伺服器

```powershell
npm run dev
```

確認伺服器啟動成功，顯示：
```
✓ Ready in Xms
○ Local:   http://localhost:3000
```

---

### 步驟 3: 執行完整流程測試

```powershell
# 在另一個終端執行
node scripts/test-full-flow.js
```

**預期結果**:
- ✅ 註冊 API: 成功
- ✅ 客戶記錄: 存在
- ✅ OTP 記錄: 存在
- ✅ OTP 驗證: 成功

**如果失敗**:
1. 查看開發伺服器控制台的錯誤訊息
2. 檢查測試腳本輸出的診斷資訊
3. 根據錯誤訊息進行修復

---

### 步驟 4: 手動測試（瀏覽器）

1. **開啟註冊頁面**
   ```
   http://localhost:3000/register
   ```

2. **填寫註冊表單**
   - Email: 您的真實 Email（例如 qwerboy@gmail.com）
   - 姓名: 任意
   - 電話: 10 碼手機號碼

3. **提交表單**
   - 觀察瀏覽器控制台（F12）
   - 觀察開發伺服器終端的日誌

4. **檢查 Email**
   - 查看收件匣和垃圾郵件
   - 發件人可能是 `onboarding@resend.dev`

5. **輸入驗證碼**
   - 使用 Email 中收到的 6 位數驗證碼
   - 或從資料庫查詢（使用診斷工具）

6. **觀察結果**
   - 成功：跳轉到首頁
   - 失敗：查看錯誤訊息和控制台日誌

---

## 📝 日誌檢查

### 開發伺服器控制台應該顯示：

**註冊時**:
```
Customer created successfully: {
  id: '021d0441-eeb3-4b05-960e-2428cc1bfb0e',
  email: 'test@example.com',
  name: '測試用戶'
}
Creating OTP for customer: {
  customerId: '021d0441-eeb3-4b05-960e-2428cc1bfb0e',
  email: 'test@example.com',
  otpCode: '123456'
}
OTP sent successfully: {
  customerId: '021d0441-eeb3-4b05-960e-2428cc1bfb0e',
  email: 'test@example.com'
}
```

**驗證時**:
```
Verifying OTP: { email: 'test@example.com', otp_code: '123456' }
OTP verified successfully
Finding customer by email: test@example.com
Customer found: {
  id: '021d0441-eeb3-4b05-960e-2428cc1bfb0e',
  email: 'test@example.com',
  name: '測試用戶'
}
```

### 如果看到錯誤：

**錯誤 1**: `Error creating customer:`
- **原因**: Supabase 連線問題或權限問題
- **解決**: 檢查環境變數和 Supabase 設定

**錯誤 2**: `Customer not found after OTP verification:`
- **原因**: 客戶記錄未成功建立
- **解決**: 查看上方的 `Customer created successfully` 日誌是否存在

**錯誤 3**: `OTP verification failed:`
- **原因**: OTP 無效、已使用或已過期
- **解決**: 重新發送 OTP 或檢查資料庫記錄

---

## 🔧 可能的問題與解決方案

### 問題 1: 客戶記錄建立失敗

**症狀**:
- 註冊 API 返回 500 錯誤
- 控制台顯示 `Error creating customer:`

**可能原因**:
1. Supabase 連線問題
2. `SUPABASE_SERVICE_ROLE_KEY` 錯誤
3. 資料庫表權限問題
4. 資料驗證失敗（例如 email 格式）

**解決方案**:
```powershell
# 1. 檢查環境變數
cat .env.local | Select-String "SUPABASE"

# 2. 測試 Supabase 連線
node scripts/diagnose-registration.js

# 3. 檢查 Supabase Dashboard
# 登入 https://supabase.com/dashboard
# 查看 Table Editor > customers
# 確認表結構和權限
```

---

### 問題 2: Email 大小寫不一致

**症狀**:
- 註冊成功
- OTP 發送成功
- 驗證時顯示「用戶不存在」
- 資料庫中確實有客戶記錄

**可能原因**:
- 註冊時使用 `Test@Example.com`
- 驗證時使用 `test@example.com`
- 資料庫查詢未正確轉換大小寫

**解決方案**:
已在修復中處理，所有 email 都會轉換為小寫：
```typescript
email: data.email.toLowerCase()
```

---

### 問題 3: OTP 已使用或過期

**症狀**:
- 驗證時顯示「驗證碼無效或已過期」

**解決方案**:
```powershell
# 查看 OTP 狀態
node scripts/check-user-status.js

# 重新發送 OTP（如果用戶已存在）
# 使用登入頁面的「發送驗證碼」功能
```

---

## 📊 資料庫檢查

### 使用 Supabase SQL Editor

```sql
-- 1. 查看客戶記錄
SELECT id, name, email, phone, created_at, email_verified
FROM customers
WHERE email = 'test@example.com';

-- 2. 查看 OTP 記錄
SELECT otp_code, is_used, expires_at, created_at
FROM otp_tokens
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 5;

-- 3. 檢查是否有孤立的 OTP（有 OTP 但沒有客戶）
SELECT o.email, o.otp_code, o.created_at
FROM otp_tokens o
LEFT JOIN customers c ON o.email = c.email
WHERE c.id IS NULL
ORDER BY o.created_at DESC;
```

---

## 🎯 成功標準

測試成功的標準：

- [x] 註冊 API 返回 200 狀態碼
- [x] 資料庫中存在客戶記錄
- [x] 資料庫中存在對應的 OTP 記錄
- [x] Email 收到驗證碼（或可從資料庫查詢）
- [x] 輸入驗證碼後成功登入
- [x] 不再顯示「用戶不存在」錯誤

---

## 📞 需要協助？

如果問題仍未解決，請提供：

1. **完整流程測試輸出**
   ```powershell
   node scripts/test-full-flow.js > test-result.txt 2>&1
   ```

2. **開發伺服器控制台日誌**
   - 複製完整的錯誤訊息和堆疊追蹤

3. **瀏覽器控制台日誌**
   - 開啟 DevTools (F12)
   - 複製 Console 和 Network 標籤的內容

4. **資料庫狀態**
   ```powershell
   node scripts/check-user-status.js > db-status.txt
   ```

---

**最後更新**: 2026-01-05
**版本**: 1.0.0

