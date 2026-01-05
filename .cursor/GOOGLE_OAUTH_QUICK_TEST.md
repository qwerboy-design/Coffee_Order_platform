# Google OAuth 快速測試指南

> **用途**: 快速驗證 Google OAuth 功能是否正常運作  
> **測試時間**: 5-10 分鐘

---

## ✅ 前置檢查

```bash
# 1. 檢查環境變數
node -e "require('dotenv').config({ path: '.env.local' }); console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ 已設定' : '❌ 未設定'); console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ 已設定' : '❌ 未設定');"

# 2. 檢查套件是否安裝
npm list google-auth-library

# 3. 檢查資料庫遷移
# 在 Supabase SQL Editor 執行：
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'oauth_id';
```

---

## 🧪 測試步驟

### 測試 1: 介面檢查

1. 啟動開發伺服器
   ```bash
   npm run dev
   ```

2. 開啟登入頁面
   ```
   http://localhost:3000/login
   ```

3. **檢查項目**:
   - [ ] Google 按鈕顯示
   - [ ] 按鈕文字為「使用 Google 登入」
   - [ ] 按鈕有 Google Logo
   - [ ] 按鈕下方有「或」分隔線

---

### 測試 2: Google 登入流程（新用戶）

1. 點擊「使用 Google 登入」按鈕
2. 選擇一個**未註冊過**的 Google 帳號
3. 授權應用程式

**預期結果**:
- ✅ 自動重導向回首頁
- ✅ Header 顯示您的 Google 名稱
- ✅ 沒有錯誤訊息

**驗證資料庫**:
```sql
-- 在 Supabase SQL Editor 執行
SELECT id, name, email, phone, auth_provider, created_at
FROM customers
WHERE email = '您的Google Email'
ORDER BY created_at DESC
LIMIT 1;
```

**預期輸出**:
```
name: 您的Google名稱
email: your-google@gmail.com
phone: (空字串)
auth_provider: google
```

---

### 測試 3: Google 登入流程（既有用戶）

1. 登出目前帳號
2. 再次點擊「使用 Google 登入」
3. 選擇相同的 Google 帳號

**預期結果**:
- ✅ 直接登入（不建立新帳號）
- ✅ 資料庫中沒有重複記錄

**驗證資料庫**:
```sql
-- 檢查是否有重複帳號
SELECT email, COUNT(*) as count
FROM customers
WHERE email = '您的Google Email'
GROUP BY email;
```

**預期輸出**:
```
count: 1
```

---

### 測試 4: 註冊頁面 Google 按鈕

1. 開啟註冊頁面
   ```
   http://localhost:3000/register
   ```

2. **檢查項目**:
   - [ ] Google 按鈕顯示
   - [ ] 按鈕文字為「使用 Google 註冊」
   - [ ] 分隔線文字為「或使用 Email 註冊」

3. 點擊 Google 按鈕
4. 使用另一個 Google 帳號

**預期結果**:
- ✅ 成功註冊並登入
- ✅ 資料庫建立新記錄

---

### 測試 5: Session 持久化

1. 使用 Google 登入
2. 重新整理頁面 (F5)

**預期結果**:
- ✅ 仍保持登入狀態
- ✅ Header 仍顯示用戶名稱

3. 關閉瀏覽器
4. 重新開啟並訪問網站

**預期結果**:
- ✅ 在 Session 有效期內（7天）仍保持登入

---

### 測試 6: 帳號關聯（進階）

**情境**: OTP 註冊的帳號 + Google 登入

1. 使用 OTP 註冊一個帳號：`test@gmail.com`
2. 登出
3. 使用 `test@gmail.com` 的 Google 帳號登入

**預期結果**:
- ✅ 登入成功
- ✅ 使用同一個客戶記錄（不建立新帳號）
- ✅ `auth_provider` 可能保持為 `otp`（或更新為 `google`，取決於實作）

---

## 🐛 錯誤檢查

### 錯誤 1: 按鈕不顯示

**檢查 Console (F12)**:
```javascript
// 應該看到：
console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
// 如果是 undefined，表示環境變數未設定
```

**解決**:
```bash
# 確認 .env.local 中有：
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...

# 重新啟動開發伺服器
npm run dev
```

---

### 錯誤 2: "Error 400: redirect_uri_mismatch"

**原因**: Google Console 中的 Redirect URI 設定錯誤

**解決**:
1. 前往 Google Cloud Console
2. Credentials → 編輯 OAuth Client
3. 確認包含：`http://localhost:3000`
4. 儲存後等待 5-10 分鐘

---

### 錯誤 3: API 回傳錯誤

**檢查終端機輸出**:
```
Google OAuth error: Error: ...
```

**常見錯誤**:
- `Invalid token`: Client Secret 錯誤
- `Audience mismatch`: Client ID 不匹配

**檢查方式**:
```bash
# 檢查環境變數
cat .env.local | grep GOOGLE
```

---

## 📊 測試報告模板

```
日期: 2026-01-04
測試人員: [姓名]
環境: [本地 / Staging / Production]

測試結果：
- [ ] 介面檢查: ✅ / ❌
- [ ] 新用戶登入: ✅ / ❌
- [ ] 既有用戶登入: ✅ / ❌
- [ ] 註冊頁面: ✅ / ❌
- [ ] Session 持久化: ✅ / ❌
- [ ] 帳號關聯: ✅ / ❌

發現問題：
1. [描述問題]
2. [描述問題]

備註：
[其他觀察]
```

---

## ✅ 測試完成！

所有測試通過後，Google OAuth 功能即可投入使用！

**下一步**:
1. 在生產環境測試
2. 新增更多 OAuth 提供者
3. 實作個人資料編輯功能

