# 帳號綁定功能使用指南

> **功能**: 既有用戶綁定/解綁 Google 帳號  
> **適用對象**: 已註冊的用戶  
> **最後更新**: 2026-01-04

---

## 📋 功能概述

允許既有用戶在個人資料頁面中：
1. **綁定 Google 帳號** - 綁定後可使用 Google 快速登入
2. **解綁 Google 帳號** - 需先設定密碼以確保仍可登入

---

## 🎯 使用場景

### 場景 1: OTP 註冊用戶綁定 Google

```
用戶使用 OTP 註冊
  ↓
登入後前往個人資料
  ↓
點擊「綁定 Google 帳號」
  ↓
選擇 Google 帳號授權
  ↓
綁定成功
  ↓
下次可使用 Google 快速登入
```

### 場景 2: 密碼註冊用戶綁定 Google

```
用戶使用 Email + 密碼註冊
  ↓
登入後前往個人資料
  ↓
點擊「綁定 Google 帳號」
  ↓
綁定成功
  ↓
可選擇使用密碼或 Google 登入
```

### 場景 3: 解綁 Google 帳號

```
用戶已綁定 Google 帳號
  ↓
前往個人資料
  ↓
檢查是否已設定密碼
  │
  ├─ 已設定密碼 ─→ 可以解綁
  │                ↓
  │              點擊「解除綁定」
  │                ↓
  │              確認對話框
  │                ↓
  │              解綁成功
  │
  └─ 未設定密碼 ─→ 顯示警告訊息
                   「請先設定密碼後再解綁」
```

---

## 🔧 技術實作

### API 端點

#### 1. GET /api/auth/me
取得當前登入用戶資料

**回應範例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "張三",
    "email": "user@example.com",
    "phone": "0912345678",
    "auth_provider": "otp",
    "oauth_id": null,
    "total_orders": 5,
    "total_spent": 2500,
    "has_password": false
  }
}
```

#### 2. POST /api/auth/link-google
綁定 Google 帳號

**請求**:
```json
{
  "idToken": "google_id_token_here"
}
```

**成功回應**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "googleEmail": "user@gmail.com"
  },
  "message": "成功綁定 Google 帳號"
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": "此 Google 帳號已綁定到其他用戶",
  "code": "DUPLICATE"
}
```

#### 3. POST /api/auth/unlink-google
解綁 Google 帳號

**成功回應**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com"
  },
  "message": "成功解綁 Google 帳號"
}
```

**錯誤回應**（未設定密碼）:
```json
{
  "success": false,
  "error": "請先設定密碼後再解綁 Google 帳號，以確保您能夠繼續登入",
  "code": "VALIDATION_ERROR"
}
```

---

## 🛡️ 安全機制

### 1. 防止重複綁定

- ✅ 檢查 Google 帳號是否已綁定其他用戶
- ✅ 檢查當前用戶是否已綁定 Google 帳號
- ✅ 明確的錯誤訊息

### 2. 防止無法登入

- ✅ 解綁前檢查是否已設定密碼
- ✅ 未設定密碼時不允許解綁
- ✅ 顯示警告訊息提示用戶先設定密碼

### 3. Session 驗證

- ✅ 所有 API 都需要 Session Cookie
- ✅ Session 過期時重導向到登入頁面

---

## 🎨 UI/UX 設計

### 個人資料頁面佈局

```
┌──────────────────────────────────┐
│ 個人資料                          │
├──────────────────────────────────┤
│                                  │
│ 基本資料                          │
│ ├─ 姓名: 張三                     │
│ ├─ Email: user@example.com       │
│ ├─ 電話: 0912345678              │
│ └─ 註冊方式: OTP 驗證碼           │
│                                  │
│ 帳號綁定                          │
│ ┌────────────────────────────┐  │
│ │ [G] Google 帳號             │  │
│ │     未綁定                  │  │
│ │     [綁定 Google 按鈕]      │  │
│ │                            │  │
│ │ 💡 綁定後可使用 Google 快速  │  │
│ │    登入                     │  │
│ └────────────────────────────┘  │
│                                  │
│ 訂單統計                          │
│ ┌─────┬─────┬─────┐            │
│ │總訂單│總消費│最近訂單│           │
│ │  5  │2500 │2026-01-04│        │
│ └─────┴─────┴─────┘            │
│                                  │
│            [登出]                │
└──────────────────────────────────┘
```

### 已綁定狀態

```
┌────────────────────────────┐
│ [G] Google 帳號             │
│     已綁定                  │
│     [解除綁定]              │
│                            │
│ ⚠️ 請先設定密碼後再解綁    │
│    (如果未設定密碼)         │
└────────────────────────────┘
```

---

## ✅ 測試流程

### 測試 1: 綁定 Google 帳號

1. 使用 OTP 註冊並登入
2. 前往 `/profile`
3. 點擊「綁定 Google」按鈕
4. 選擇 Google 帳號授權
5. 驗證：
   - [ ] 顯示「成功綁定」訊息
   - [ ] 按鈕變為「解除綁定」
   - [ ] 狀態顯示「已綁定」

6. 登出後使用 Google 登入
7. 驗證：
   - [ ] 可以成功登入
   - [ ] 登入到同一個帳號

---

### 測試 2: 防止重複綁定

1. 用戶 A 綁定 Google 帳號 X
2. 登出
3. 用戶 B 登入
4. 用戶 B 嘗試綁定相同的 Google 帳號 X
5. 驗證：
   - [ ] 顯示錯誤訊息：「此 Google 帳號已綁定到其他用戶」
   - [ ] 未建立重複綁定

---

### 測試 3: 解綁需要密碼保護

1. 使用 Google 註冊（無密碼）
2. 前往個人資料
3. 嘗試解綁 Google 帳號
4. 驗證：
   - [ ] 顯示警告訊息
   - [ ] 無法解綁
   - [ ] 提示先設定密碼

---

### 測試 4: 成功解綁

1. 使用 Email + 密碼註冊
2. 綁定 Google 帳號
3. 點擊「解除綁定」
4. 確認對話框
5. 驗證：
   - [ ] 成功解綁
   - [ ] 按鈕變回「綁定 Google」
   - [ ] 狀態顯示「未綁定」

6. 嘗試使用 Google 登入
7. 驗證：
   - [ ] 仍可登入（建立新綁定）

---

## 🔍 資料庫查詢

### 檢查用戶綁定狀態

```sql
SELECT 
  id,
  name,
  email,
  auth_provider,
  oauth_id,
  password_hash IS NOT NULL as has_password
FROM customers
WHERE email = 'user@example.com';
```

### 檢查 OAuth ID 是否重複

```sql
SELECT 
  id,
  name,
  email,
  oauth_id
FROM customers
WHERE oauth_id IS NOT NULL
GROUP BY oauth_id
HAVING COUNT(*) > 1;
```

### 統計綁定情況

```sql
SELECT 
  auth_provider,
  COUNT(*) as count,
  COUNT(oauth_id) as linked_count
FROM customers
GROUP BY auth_provider;
```

---

## 🐛 常見問題

### Q1: 綁定後原本的登入方式還能用嗎？

**A**: 可以！綁定 Google 只是新增一個登入方式，不會移除原本的登入方式。

---

### Q2: 為什麼不能解綁 Google 帳號？

**A**: 如果您是透過 Google 註冊的，需要先設定密碼，以確保解綁後仍能登入。

---

### Q3: 我可以綁定多個 Google 帳號嗎？

**A**: 目前每個用戶只能綁定一個 Google 帳號。如需更換，請先解綁再重新綁定。

---

### Q4: 我的 Google 帳號已綁定其他用戶怎麼辦？

**A**: 請先登入該用戶帳號並解綁，或使用其他 Google 帳號。

---

## 📚 相關文件

- [Google OAuth 實作計畫](.cursor/GOOGLE_OAUTH_IMPLEMENTATION.md)
- [Google OAuth 設定指南](.cursor/GOOGLE_OAUTH_SETUP_GUIDE.md)
- [Google OAuth 測試指南](.cursor/GOOGLE_OAUTH_QUICK_TEST.md)

---

**文件版本**: v1.0  
**最後更新**: 2026-01-04

