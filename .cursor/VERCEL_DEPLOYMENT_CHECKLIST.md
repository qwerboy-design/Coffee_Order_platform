# Vercel 部署檢查清單

> **GitHub 推送**: ✅ 完成  
> **Commit**: 5417b7b  
> **日期**: 2026-01-04

---

## ✅ 已完成

- [x] Git 提交所有變更
- [x] 推送到 GitHub (master 分支)
- [x] 27 個檔案已更新
- [x] 5,612 行新增程式碼

---

## 🚀 接下來的步驟

### 步驟 1: 設定 Vercel 環境變數 ⭐⭐⭐ 重要

#### 1.1 前往 Vercel Dashboard

```
https://vercel.com/dashboard
```

1. 選擇您的專案（Coffee_Order_platform）
2. 點擊 **Settings**
3. 左側選單選擇 **Environment Variables**

#### 1.2 新增 Google OAuth 環境變數

**必須新增以下兩個變數**:

##### 變數 1: NEXT_PUBLIC_GOOGLE_CLIENT_ID

```
Name: NEXT_PUBLIC_GOOGLE_CLIENT_ID
Value: 812698310992-crs14l6dlcqo640b31ts7nskoof5biar.apps.googleusercontent.com
Environment: ✅ Production ✅ Preview ✅ Development
```

##### 變數 2: GOOGLE_CLIENT_SECRET

```
Name: GOOGLE_CLIENT_SECRET
Value: GOCSPX-ZKqKYAB5z_xHvSXUByWQNze
Environment: ✅ Production ✅ Preview ✅ Development
```

**畫面操作**:
```
1. 點擊 "Add New" 按鈕
2. 輸入 Name
3. 輸入 Value
4. 勾選所有 Environment (Production, Preview, Development)
5. 點擊 "Save"
6. 重複以上步驟新增第二個變數
```

---

### 步驟 2: Google Cloud Console 生產環境設定

#### 2.1 取得 Vercel 部署 URL

Vercel 會自動部署，完成後會顯示：
```
✅ Production: https://coffee-order-platform.vercel.app
```

（實際 URL 可能不同，請從 Vercel Dashboard 確認）

#### 2.2 更新 Google OAuth 設定

前往 [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)

**編輯您的 OAuth 2.0 Client ID**

**Authorized JavaScript origins** 新增:
```
http://localhost:3000                           (開發環境 - 已有)
https://coffee-order-platform.vercel.app        (生產環境 - 新增)
```

**Authorized redirect URIs** 新增:
```
http://localhost:3000                           (開發環境 - 已有)
http://localhost:3000/                          (開發環境 - 已有)
https://coffee-order-platform.vercel.app        (生產環境 - 新增)
https://coffee-order-platform.vercel.app/       (生產環境 - 新增)
```

**重要**:
- ⚠️ 生產環境使用 `https://`（不是 `http://`）
- ⚠️ 替換為您實際的 Vercel 域名
- ⚠️ 點擊 **SAVE** 儲存變更
- ⚠️ 等待 5-10 分鐘讓設定生效

---

### 步驟 3: Supabase 生產資料庫遷移

#### 3.1 前往 Supabase Dashboard

```
https://supabase.com/dashboard
```

1. 選擇您的專案
2. 左側選單選擇 **SQL Editor**

#### 3.2 執行遷移 SQL

複製並執行以下 SQL：

```sql
-- 新增 oauth_id 欄位到 customers 表
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_customers_oauth_id 
ON customers(oauth_id);

-- 新增註解
COMMENT ON COLUMN customers.oauth_id IS 'OAuth 提供者的用戶 ID（Google sub、Facebook id 等）';
```

#### 3.3 驗證遷移成功

執行驗證 SQL：

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customers' 
  AND column_name = 'oauth_id';
```

**預期結果**:
```
 column_name | data_type         | is_nullable
-------------+-------------------+-------------
 oauth_id    | character varying | YES
```

---

### 步驟 4: 監控 Vercel 部署

#### 4.1 檢查部署狀態

```
Vercel Dashboard → Your Project → Deployments
```

您應該看到最新的部署：

```
✅ master (5417b7b) - Production
   Building... → Deploying... → Ready
```

#### 4.2 查看建置日誌

如果部署失敗，點擊部署查看詳細日誌：

```
Building
- Installing dependencies
- Building application
- Optimizing production build

Deploying
- Uploading files
- Assigning to production

✅ Ready
```

#### 4.3 部署完成時間

通常需要：
- **建置時間**: 1-3 分鐘
- **部署時間**: 30 秒 - 1 分鐘
- **總時間**: 2-4 分鐘

---

### 步驟 5: 生產環境測試

#### 5.1 等待部署完成

確認 Vercel 顯示：
```
✅ Visit Preview: https://coffee-order-platform.vercel.app
```

#### 5.2 等待 Google 設定生效

如果您剛更新 Google OAuth 設定：
- **最短**: 5 分鐘
- **通常**: 5-10 分鐘
- **建議**: 等待 10 分鐘後測試

#### 5.3 測試清單

**基本功能**:
```
✅ 開啟 https://coffee-order-platform.vercel.app
✅ 頁面正常載入
✅ 沒有 404 或 500 錯誤
```

**Google 登入**:
```
✅ 前往 /login 頁面
✅ Google 按鈕顯示
✅ 點擊 Google 按鈕
✅ 彈出授權視窗（不是黑畫面）
✅ 選擇帳號後成功登入
✅ 重導向回首頁
✅ Header 顯示用戶名稱
```

**個人資料頁面**:
```
✅ 點擊用戶選單
✅ 點擊「個人資料」
✅ 頁面顯示基本資料
✅ 顯示綁定狀態
✅ 顯示訂單統計
```

**帳號綁定**:
```
✅ 使用 OTP 註冊新帳號
✅ 前往個人資料頁面
✅ 點擊「綁定 Google」
✅ 授權成功
✅ 狀態顯示「已綁定」
```

---

## 📋 部署檢查清單

### Vercel 設定
- [ ] 已新增 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] 已新增 `GOOGLE_CLIENT_SECRET`
- [ ] 環境變數套用到所有環境
- [ ] 部署狀態顯示 Ready

### Google Cloud Console
- [ ] JavaScript origins 包含生產域名
- [ ] Redirect URIs 包含生產域名
- [ ] 已儲存變更
- [ ] 已等待 5-10 分鐘

### Supabase
- [ ] 已執行資料庫遷移
- [ ] oauth_id 欄位已建立
- [ ] 索引已建立
- [ ] 驗證查詢成功

### 功能測試
- [ ] 生產環境可訪問
- [ ] Google 登入正常運作
- [ ] 帳號綁定功能正常
- [ ] 個人資料頁面顯示正確
- [ ] 沒有 Console 錯誤

---

## 🐛 常見問題

### Q1: Vercel 部署失敗

**檢查**:
1. Vercel Dashboard → Deployments → 點擊失敗的部署
2. 查看 Build Logs
3. 常見錯誤：
   - TypeScript 錯誤
   - 缺少環境變數
   - 依賴安裝失敗

**解決**:
```bash
# 本地測試 build
npm run build

# 如果成功，問題可能是環境變數
# 確認 Vercel 環境變數是否正確設定
```

### Q2: 生產環境 Google 登入失敗

**錯誤**: origin not allowed 或 invalid_client

**解決**:
1. 確認 Google Cloud Console 的 JavaScript origins 包含 **https://your-domain.vercel.app**
2. 確認使用 `https://`（不是 `http://`）
3. 確認域名完全正確（沒有多餘的斜線或路徑）
4. 等待 10 分鐘讓 Google 設定生效
5. 清除瀏覽器快取後重試

### Q3: 環境變數未生效

**症狀**: 
- Google 按鈕不顯示
- Console 顯示 "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set"

**解決**:
1. Vercel Dashboard → Settings → Environment Variables
2. 確認變數名稱正確（含 `NEXT_PUBLIC_` 前綴）
3. 確認已勾選 Production 環境
4. 點擊專案名稱 → Deployments → Redeploy（觸發重新部署）

### Q4: 資料庫遷移錯誤

**錯誤**: column "oauth_id" already exists

**這是正常的！** 表示欄位已存在，可以忽略此錯誤。

---

## 📊 部署成功指標

### Vercel
```
✅ Status: Ready
✅ Build time: < 3 minutes
✅ No build errors
✅ Domain: Active
```

### 網站功能
```
✅ https://your-domain.vercel.app 可訪問
✅ 所有頁面正常載入
✅ Google 登入運作正常
✅ API 端點回應正常
```

### 效能
```
✅ 首次載入: < 3 秒
✅ 頁面切換: < 1 秒
✅ API 回應: < 500ms
✅ Lighthouse Score: > 90
```

---

## 🎉 部署完成後

### 通知團隊/使用者

```
🚀 新功能上線！

現在您可以使用 Google 帳號快速登入咖啡豆訂單系統！

新功能：
✅ Google 一鍵登入
✅ 帳號綁定管理
✅ 個人資料頁面
✅ 訂單統計

網址：https://your-domain.vercel.app
```

### 監控與優化

```
1. Vercel Analytics - 監控流量和效能
2. Supabase Logs - 監控資料庫查詢
3. Google Cloud Console - 監控 OAuth 使用量
4. 收集使用者反饋
5. 持續優化體驗
```

---

## 📞 需要協助？

如果遇到問題：

1. **查看日誌**:
   - Vercel Build Logs
   - Browser Console (F12)
   - Supabase Logs

2. **檢查設定**:
   - Vercel 環境變數
   - Google OAuth 設定
   - Supabase 資料庫

3. **參考文件**:
   - `.cursor/DEPLOYMENT_GUIDE.md`
   - `.cursor/GOOGLE_OAUTH_SETUP_GUIDE.md`
   - `.cursor/GOOGLE_OAUTH_ERROR_401_FIX.md`

---

**檢查清單版本**: v1.0  
**最後更新**: 2026-01-04  
**GitHub Commit**: 5417b7b  
**部署狀態**: 🟡 等待 Vercel 環境變數設定

