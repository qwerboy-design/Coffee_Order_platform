# 帳號綁定功能測試報告

> **測試日期**: 2026-01-04  
> **測試範圍**: Google OAuth 登入 + 帳號綁定/解綁功能  
> **測試環境**: 開發環境 (localhost:3000)

---

## 📋 測試前準備

### 1. 安裝依賴
```bash
npm install google-auth-library
```

### 2. 執行資料庫遷移
在 Supabase SQL Editor 執行：
```sql
-- supabase/migrations/005_add_oauth_id.sql
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_customers_oauth_id 
ON customers(oauth_id);
```

### 3. 設定環境變數
在 `.env.local` 中設定：
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=您的_Client_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-您的_Client_Secret
```

### 4. 啟動開發伺服器
```bash
npm run dev
```

---

## 🧪 測試案例

### 測試案例 1: Google OAuth 登入（新用戶）

**目的**: 驗證新用戶可以使用 Google 帳號註冊並登入

**步驟**:
1. 開啟 `http://localhost:3000/login`
2. 點擊「使用 Google 登入」按鈕
3. 選擇一個未註冊過的 Google 帳號
4. 授權應用程式

**預期結果**:
- [ ] 自動重導向回首頁
- [ ] Header 顯示用戶名稱
- [ ] 用戶選單可以展開
- [ ] 可以查看「個人資料」

**驗證資料庫**:
```sql
SELECT id, name, email, phone, auth_provider, oauth_id, created_at
FROM customers
WHERE email = '您的Google Email'
ORDER BY created_at DESC
LIMIT 1;
```

**預期資料**:
```
auth_provider: google
phone: (空字串)
oauth_id: (Google sub ID)
```

---

### 測試案例 2: Google OAuth 登入（既有用戶）

**目的**: 驗證既有用戶使用 Google 登入不會建立重複帳號

**步驟**:
1. 登出
2. 再次使用相同的 Google 帳號登入

**預期結果**:
- [ ] 直接登入
- [ ] 資料庫中沒有重複記錄

**驗證**:
```sql
SELECT email, COUNT(*) as count
FROM customers
WHERE email = '您的Google Email'
GROUP BY email;
```

**預期**: `count = 1`

---

### 測試案例 3: OTP 註冊後綁定 Google

**目的**: 驗證 OTP 註冊的用戶可以綁定 Google 帳號

**步驟**:
1. 登出所有帳號
2. 使用 OTP 註冊一個新帳號（例如：`test-bind@example.com`）
3. 完成 OTP 驗證並登入
4. 點擊 Header 的用戶選單 → 「個人資料」
5. 在「帳號綁定」區塊點擊 Google 按鈕
6. 選擇一個 Google 帳號授權

**預期結果**:
- [ ] 顯示「成功綁定 Google 帳號」訊息
- [ ] 按鈕變為「解除綁定」
- [ ] 狀態顯示「已綁定」

**驗證**:
```sql
SELECT id, email, auth_provider, oauth_id
FROM customers
WHERE email = 'test-bind@example.com';
```

**預期**: `oauth_id` 不為空

**繼續測試**:
7. 登出
8. 使用 Google 登入（選擇剛才綁定的 Google 帳號）

**預期結果**:
- [ ] 成功登入
- [ ] 登入到 `test-bind@example.com` 帳號

---

### 測試案例 4: 防止重複綁定（不同用戶綁定同一個 Google 帳號）

**目的**: 驗證一個 Google 帳號不能綁定到多個用戶

**步驟**:
1. 用戶 A 綁定 Google 帳號 X（參考測試案例 3）
2. 登出
3. 使用 OTP 註冊用戶 B
4. 用戶 B 嘗試綁定相同的 Google 帳號 X

**預期結果**:
- [ ] 顯示錯誤訊息：「此 Google 帳號已綁定到其他用戶」
- [ ] 未建立綁定
- [ ] 按鈕仍為「綁定 Google」

---

### 測試案例 5: 防止用戶重複綁定

**目的**: 驗證一個用戶不能重複綁定 Google 帳號

**步驟**:
1. 用戶已綁定 Google 帳號
2. 再次點擊綁定按鈕

**預期結果**:
- [ ] 顯示錯誤訊息：「您已綁定 Google 帳號，請先解綁後再重新綁定」
- [ ] 未建立重複綁定

---

### 測試案例 6: 解綁 Google 帳號（未設定密碼）

**目的**: 驗證未設定密碼的用戶無法解綁 Google 帳號

**步驟**:
1. 使用 Google 帳號註冊（auth_provider = google，無密碼）
2. 前往個人資料頁面
3. 嘗試點擊「解除綁定」

**預期結果**:
- [ ] 頁面顯示警告訊息：「⚠️ 請先設定密碼後再解綁 Google 帳號」
- [ ] 點擊「解除綁定」後顯示錯誤訊息
- [ ] 未解綁成功

---

### 測試案例 7: 解綁 Google 帳號（已設定密碼）

**目的**: 驗證已設定密碼的用戶可以解綁 Google 帳號

**前置**: 使用 Email + 密碼註冊，然後綁定 Google

**步驟**:
1. 登入已綁定 Google 的帳號（有密碼）
2. 前往個人資料頁面
3. 點擊「解除綁定」
4. 確認對話框

**預期結果**:
- [ ] 顯示「成功解綁 Google 帳號」訊息
- [ ] 按鈕變回「綁定 Google」
- [ ] 狀態顯示「未綁定」

**驗證**:
```sql
SELECT id, email, oauth_id
FROM customers
WHERE email = '您的Email';
```

**預期**: `oauth_id = NULL`

**繼續測試**:
5. 嘗試使用 Google 登入（使用剛才解綁的 Google 帳號）

**預期結果**:
- [ ] 仍可以登入（建立新的綁定）

---

### 測試案例 8: Session 持久化

**目的**: 驗證登入狀態在重新整理後仍保持

**步驟**:
1. 使用 Google 登入
2. 重新整理頁面 (F5)
3. 前往個人資料頁面
4. 重新整理頁面

**預期結果**:
- [ ] 所有頁面都保持登入狀態
- [ ] Header 持續顯示用戶名稱
- [ ] 個人資料正常顯示

---

### 測試案例 9: 個人資料頁面功能

**目的**: 驗證個人資料頁面顯示完整資訊

**步驟**:
1. 登入任意帳號
2. 前往 `/profile`

**預期結果**:
- [ ] 顯示基本資料（姓名、Email、電話、註冊方式）
- [ ] 顯示帳號綁定狀態
- [ ] 顯示訂單統計（總訂單、總消費、最近訂單）
- [ ] 登出按鈕可用

---

### 測試案例 10: 未登入訪問個人資料頁面

**目的**: 驗證未登入用戶無法訪問個人資料

**步驟**:
1. 登出所有帳號
2. 直接訪問 `http://localhost:3000/profile`

**預期結果**:
- [ ] 自動重導向到 `/login`

---

## 📊 測試結果總結

### 功能測試

| 測試案例 | 狀態 | 備註 |
|---------|------|------|
| 1. Google OAuth 登入（新用戶） | ⏳ | 待測試 |
| 2. Google OAuth 登入（既有用戶） | ⏳ | 待測試 |
| 3. OTP 註冊後綁定 Google | ⏳ | 待測試 |
| 4. 防止重複綁定（不同用戶） | ⏳ | 待測試 |
| 5. 防止用戶重複綁定 | ⏳ | 待測試 |
| 6. 解綁（未設定密碼） | ⏳ | 待測試 |
| 7. 解綁（已設定密碼） | ⏳ | 待測試 |
| 8. Session 持久化 | ⏳ | 待測試 |
| 9. 個人資料頁面功能 | ⏳ | 待測試 |
| 10. 未登入訪問限制 | ⏳ | 待測試 |

---

### 資料庫驗證

```sql
-- 檢查所有用戶的綁定狀態
SELECT 
  id,
  name,
  email,
  auth_provider,
  oauth_id IS NOT NULL as is_linked,
  password_hash IS NOT NULL as has_password,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;

-- 檢查是否有重複的 OAuth ID
SELECT 
  oauth_id,
  COUNT(*) as count
FROM customers
WHERE oauth_id IS NOT NULL
GROUP BY oauth_id
HAVING COUNT(*) > 1;

-- 統計綁定情況
SELECT 
  auth_provider,
  COUNT(*) as total_users,
  COUNT(oauth_id) as linked_users
FROM customers
GROUP BY auth_provider;
```

---

## 🐛 發現的問題

### 問題列表

| # | 問題描述 | 嚴重程度 | 狀態 |
|---|---------|---------|------|
| - | - | - | - |

---

## ✅ 測試完成檢查清單

- [ ] 所有測試案例通過
- [ ] 無重大 Bug
- [ ] 資料庫資料正確
- [ ] 錯誤訊息清晰
- [ ] UI/UX 流暢
- [ ] 安全性驗證通過

---

## 📝 測試結論

**測試狀態**: ⏳ 待測試  
**測試人員**: [姓名]  
**測試日期**: [日期]  

**總結**:
[請在實際測試後填寫]

**建議**:
[請在實際測試後填寫]

---

**文件版本**: v1.0  
**最後更新**: 2026-01-04

