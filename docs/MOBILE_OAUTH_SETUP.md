# 移動端 Google OAuth 設定指南

## 問題說明

當在手機上使用 Google OAuth 認證時，可能會遇到以下錯誤：
- **403: disallowed_useragent** - 表示 Google 認為用戶代理（User-Agent）不符合安全瀏覽器政策

這通常發生在以下情況：
1. 使用應用程式內建瀏覽器（WebView），如 LINE、Facebook、Instagram 等
2. Google Cloud Console 的 OAuth 設定未正確配置移動端支援
3. 使用不符合 Google 安全要求的瀏覽器

## 解決方案

### 方案一：在 Google Cloud Console 中設定移動端支援（推薦）

#### 1. 檢查 OAuth 同意畫面設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 選擇您的專案
3. 導航至 **APIs & Services** → **OAuth consent screen**
4. 確認以下設定：
   - **User Type**: 選擇 **External**（外部用戶）
   - **App name**: 您的應用名稱
   - **User support email**: 您的支援 Email
   - **Developer contact information**: 您的聯絡 Email

#### 2. 設定 OAuth 憑證（重要）

1. 導航至 **APIs & Services** → **Credentials**
2. 找到您的 OAuth 2.0 Client ID，點擊編輯（鉛筆圖示）
3. 在 **Authorized JavaScript origins** 中添加：
   ```
   https://your-domain.com
   https://www.your-domain.com
   http://localhost:3000  (僅開發環境)
   ```
   **重要**：確保包含 `https://` 協議，且不包含尾隨斜線 `/`

4. 在 **Authorized redirect URIs** 中添加：
   ```
   https://your-domain.com
   https://your-domain.com/api/auth/google
   http://localhost:3000  (僅開發環境)
   http://localhost:3000/api/auth/google  (僅開發環境)
   ```

#### 3. 檢查應用程式類型

確保您的 OAuth Client ID 類型為 **Web application**，而不是 **Android** 或 **iOS**。

如果您需要同時支援 Web 和移動應用，需要建立**多個** OAuth Client ID：
- 一個 **Web application** 類型（用於網站）
- 一個 **Android** 類型（用於 Android 應用）
- 一個 **iOS** 類型（用於 iOS 應用）

### 方案二：使用標準瀏覽器（用戶端解決方案）

如果用戶在應用程式內建瀏覽器中遇到問題，建議他們：

1. **在 LINE 中**：
   - 點擊右上角的「...」或「更多選項」
   - 選擇「在瀏覽器中開啟」或「用瀏覽器開啟」
   - 使用 Chrome 或 Safari 開啟

2. **在 Facebook 中**：
   - 點擊右上角的「...」
   - 選擇「在瀏覽器中開啟」
   - 使用標準瀏覽器開啟

3. **在 Instagram 中**：
   - 點擊右上角的「...」
   - 選擇「在瀏覽器中開啟」
   - 使用標準瀏覽器開啟

### 方案三：程式碼層面的改進

我們已經在 `GoogleLoginButton` 組件中添加了以下改進：

1. **WebView 檢測**：自動檢測是否在 WebView 環境中
2. **用戶提示**：當檢測到 WebView 時，顯示提示訊息引導用戶使用標準瀏覽器
3. **錯誤處理**：當遇到 `disallowed_useragent` 錯誤時，提供明確的錯誤訊息

## 測試步驟

### 1. 桌面瀏覽器測試
- ✅ 在 Chrome、Firefox、Safari、Edge 中測試
- ✅ 確認 Google 登入按鈕正常顯示
- ✅ 確認登入流程正常運作

### 2. 移動瀏覽器測試
- ✅ 在手機的 Chrome（Android）或 Safari（iOS）中測試
- ✅ 確認 Google 登入按鈕正常顯示
- ✅ 確認登入流程正常運作

### 3. WebView 環境測試
- ⚠️ 在 LINE、Facebook、Instagram 等應用內建瀏覽器中測試
- ⚠️ 確認顯示 WebView 提示訊息
- ⚠️ 確認引導用戶使用標準瀏覽器

## 常見問題

### Q1: 為什麼桌面瀏覽器正常，但手機瀏覽器失敗？

**A**: 可能是以下原因：
1. Google Cloud Console 中的 **Authorized JavaScript origins** 未包含移動端網域
2. 移動端使用的是 HTTP 而非 HTTPS（Google 要求 HTTPS）
3. 移動端瀏覽器的 User-Agent 被 Google 判定為不安全

**解決方案**：
- 確保所有環境都使用 HTTPS
- 在 Google Cloud Console 中添加正確的網域
- 等待 5-10 分鐘讓設定生效

### Q2: 如何確認是否在 WebView 中？

**A**: 檢查瀏覽器的 User-Agent：
- Android WebView: 包含 `wv` 字串
- LINE: 包含 `line` 字串
- Facebook: 包含 `fbav` 或 `fban` 字串
- Instagram: 包含 `instagram` 字串

我們的程式碼已經自動檢測這些環境。

### Q3: 設定更改後多久生效？

**A**: Google Cloud Console 的設定更改通常需要 **5-10 分鐘** 才會生效。如果更改後立即測試失敗，請等待一段時間後再試。

### Q4: 可以強制用戶使用標準瀏覽器嗎？

**A**: 無法強制，但可以：
1. 檢測 WebView 環境並顯示提示
2. 提供「在瀏覽器中開啟」的連結
3. 在錯誤訊息中明確說明需要使用標準瀏覽器

## 技術細節

### Google Identity Services (GIS) 要求

Google Identity Services 要求：
1. **安全瀏覽器**：必須是符合 Google 安全標準的瀏覽器
2. **HTTPS**：生產環境必須使用 HTTPS
3. **正確的 User-Agent**：瀏覽器的 User-Agent 必須符合 Google 的要求

### WebView 限制

WebView 環境的限制：
1. **安全性較低**：Google 認為 WebView 的安全性不如標準瀏覽器
2. **功能受限**：某些 OAuth 功能在 WebView 中可能無法正常運作
3. **政策限制**：Google 的政策不允許在 WebView 中進行 OAuth 認證

## 參考資源

- [Google Identity Services 文件](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 設定指南](https://developers.google.com/identity/protocols/oauth2)
- [WebView 限制說明](https://developers.google.com/identity/protocols/oauth2/policies)

## 更新記錄

- **2025-01-XX**: 初始版本，添加移動端 OAuth 設定指南

