# Supabase 應用程式測試指南

## 測試日期
2026-01-03

## 測試環境
- 資料庫：Supabase PostgreSQL
- 開發服務器：http://localhost:3000

---

## 測試清單

### 1. 產品功能測試 ✅

**測試項目：**
- [ ] GET /api/products - 取得產品列表
- [ ] 產品頁面顯示正常
- [ ] 產品庫存顯示正確

**測試步驟：**
1. 訪問 http://localhost:3000
2. 查看產品列表是否顯示
3. 檢查產品資訊是否完整

---

### 2. 密碼註冊功能測試 ✅

**測試項目：**
- [ ] POST /api/auth/register-password - 密碼註冊
- [ ] 密碼強度指示器
- [ ] 自動登入
- [ ] 資料存入 Supabase

**測試步驟：**
1. 訪問 http://localhost:3000/register-password
2. 填寫註冊資訊：
   - Email: supabase_test@example.com
   - 姓名: Supabase 測試用戶
   - 手機: 0987654321
   - 密碼: Supabase123
3. 點擊註冊
4. 檢查是否成功登入

**預期結果：**
- ✅ 註冊成功
- ✅ 自動登入
- ✅ 跳轉到首頁
- ✅ Supabase customers 表有新記錄

---

### 3. 密碼登入功能測試 ✅

**測試項目：**
- [ ] POST /api/auth/login-password - 密碼登入
- [ ] Session 建立
- [ ] 登入狀態持久化

**測試步驟：**
1. 登出（如果已登入）
2. 訪問 http://localhost:3000/login
3. 切換到「密碼登入」
4. 輸入：
   - Email: supabase_test@example.com
   - 密碼: Supabase123
5. 點擊登入

**預期結果：**
- ✅ 登入成功
- ✅ Session 建立
- ✅ 跳轉到首頁
- ✅ Header 顯示用戶資訊

---

### 4. OTP 登入功能測試 ⚠️

**測試項目：**
- [ ] POST /api/auth/send-otp - 發送 OTP
- [ ] POST /api/auth/verify-otp - 驗證 OTP
- [ ] OTP 過期處理

**注意：**
- 需要有效的 RESEND_API_KEY
- 或者查看 Supabase otp_tokens 表取得驗證碼

**測試步驟：**
1. 訪問 http://localhost:3000/login
2. 切換到「驗證碼登入」
3. 輸入 Email
4. 檢查 Email 或 Supabase 表取得 OTP
5. 輸入驗證碼

---

### 5. 訂單建立功能測試 ✅

**測試項目：**
- [ ] POST /api/orders - 建立訂單
- [ ] 庫存扣減
- [ ] 客戶統計更新（Trigger）
- [ ] 訂單狀態記錄（Trigger）

**測試步驟：**
1. 確保已登入
2. 瀏覽產品並加入購物車
3. 前往結帳頁面
4. 填寫訂單資訊
5. 提交訂單

**預期結果：**
- ✅ 訂單建立成功
- ✅ 訂單編號格式：ORD-YYYYMMDD-XXXX
- ✅ Supabase orders 表有新記錄
- ✅ Supabase order_items 表有明細
- ✅ Supabase order_status_log 表有狀態記錄
- ✅ 產品庫存自動扣減
- ✅ 客戶統計自動更新

---

### 6. 資料完整性測試 ✅

**測試項目：**
- [ ] Foreign Key 約束
- [ ] Trigger 自動執行
- [ ] RLS 政策生效

**測試步驟：**
1. 在 Supabase Dashboard 查看資料表
2. 檢查各表之間的關聯
3. 驗證 Triggers 是否執行

**檢查清單：**
- [ ] orders.customer_id 正確關聯到 customers.id
- [ ] order_items.order_id 正確關聯到 orders.id
- [ ] order_items.product_id 正確關聯到 products.id
- [ ] order_status_log 自動建立
- [ ] customers.total_orders 自動更新
- [ ] customers.total_spent 自動更新

---

## 測試結果記錄

### 成功項目
- 

### 失敗項目
- 

### 需要修復的問題
- 

---

## 注意事項

1. **Supabase vs Airtable 差異：**
   - UUID vs Record ID
   - ENUM vs 中文字串
   - PostgreSQL Triggers vs 手動更新

2. **已知限制：**
   - getOrders() 尚未實作日期過濾
   - 需要在 Supabase 中手動添加測試產品資料

3. **RPC Functions：**
   - `generate_order_id()` - 生成訂單編號
   - `deduct_product_stock()` - 扣減庫存
   - 這些函數必須在 Supabase 中存在

---

## 快速測試腳本

```javascript
// 測試 Products API
fetch('http://localhost:3000/api/products')
  .then(r => r.json())
  .then(console.log);

// 測試註冊 API
fetch('http://localhost:3000/api/auth/register-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    name: '測試用戶',
    phone: '0900000000',
    password: 'Test1234',
    confirmPassword: 'Test1234'
  })
}).then(r => r.json()).then(console.log);
```

---

**測試完成後請更新此文檔！**
