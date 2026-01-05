# Google OAuth 登入功能實作計畫

> **實作日期**: 2026-01-04  
> **功能**: 透過 Google 帳號認證登入  
> **狀態**: 進行中

---

## 架構設計

### 選擇方案：使用 Google Identity Services (GIS)

採用 **Google Identity Services** 而非 NextAuth.js 的原因：
1. 更輕量（不需額外安裝大型依賴）
2. 更現代化（Google 最新推薦方式）
3. 與現有 JWT Session 系統整合簡單
4. 支援 One Tap 登入（更好的 UX）

---

## 實作流程

```
┌─────────────┐
│  用戶點擊   │
│ Google 登入 │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Google OAuth 2.0 │
│  彈出視窗授權    │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ 取得 Google ID Token │
│ (包含 email, name)   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────┐
│ 呼叫後端 API              │
│ POST /api/auth/google     │
│ { idToken }               │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 驗證 Google ID Token     │
│ (使用 Google API)        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 檢查 Email 是否已註冊    │
└──────┬───────────────────┘
       │
       ├─ 已註冊 ─┐
       │          ▼
       │   ┌─────────────────┐
       │   │ 更新 last_login │
       │   └─────────┬───────┘
       │             │
       └─ 未註冊 ─┐ │
                  ▼ ▼
         ┌──────────────────┐
         │ 建立新客戶記錄   │
         │ auth_provider:   │
         │ 'google'         │
         └─────────┬────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ 建立 JWT Session │
         └─────────┬────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ 回傳 Session     │
         │ 自動登入完成     │
         └──────────────────┘
```

---

## 需要新增的欄位

資料庫已支援基本 OAuth 欄位，但需要新增：

```sql
-- 新增 oauth_id 欄位到 customers 表
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_customers_oauth_id 
ON customers(oauth_id);

-- 新增註解
COMMENT ON COLUMN customers.oauth_id IS 'OAuth 提供者的用戶 ID（Google sub、Facebook id 等）';
```

---

## 環境變數設定

### Google Cloud Console 設定

1. **前往 Google Cloud Console**
   ```
   https://console.cloud.google.com
   ```

2. **建立專案或選擇現有專案**

3. **啟用 Google+ API**
   - APIs & Services → Enable APIs and Services
   - 搜尋 "Google+ API"
   - 點擊 Enable

4. **建立 OAuth 2.0 憑證**
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: 咖啡豆訂單系統
   
5. **設定授權重新導向 URI**
   ```
   本地開發：
   http://localhost:3000
   http://localhost:3000/login
   
   生產環境：
   https://your-domain.com
   https://your-domain.com/login
   ```

6. **取得憑證**
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxx`

### .env.local 設定

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

---

## 檔案結構

```
lib/auth/
├── google-oauth.ts          # Google OAuth 核心邏輯
└── utils.ts                 # 既有的認證工具（擴充）

app/api/auth/
├── google/
│   └── route.ts             # Google OAuth API endpoint
└── [existing files]

components/auth/
├── GoogleLoginButton.tsx    # Google 登入按鈕元件
└── [existing files]

app/(customer)/
├── login/
│   └── page.tsx             # 更新：加入 Google 按鈕
└── register/
    └── page.tsx             # 更新：加入 Google 按鈕
```

---

## 核心程式碼

### 1. Google OAuth 按鈕元件

```typescript
// components/auth/GoogleLoginButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
}

export function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (response: any) => {
    setIsLoading(true);
    
    try {
      const result = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await result.json();

      if (data.success) {
        router.push('/');
        router.refresh();
      } else {
        onError?.(data.error || 'Google 登入失敗');
      }
    } catch (error) {
      onError?.('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 載入 Google Identity Services
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      window.google?.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          locale: 'zh_TW',
        }
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <div id="google-login-button" />
      {isLoading && <p>登入中...</p>}
    </div>
  );
}
```

---

### 2. Google OAuth API Route

```typescript
// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { findCustomerByEmail, createOrUpdateCustomer, updateLastLogin } from '@/lib/supabase/customers';
import { createSession } from '@/lib/auth/session';
import { getClientIP } from '@/lib/rate-limit';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    // 1. 驗證 Google ID Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid Google token' },
        { status: 400 }
      );
    }

    const { sub, email, name, email_verified } = payload;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email not provided by Google' },
        { status: 400 }
      );
    }

    // 2. 檢查客戶是否已存在
    let customer = await findCustomerByEmail(email);

    if (customer) {
      // 更新最後登入時間
      await updateLastLogin(customer.id);
    } else {
      // 建立新客戶
      customer = await createOrUpdateCustomer({
        email,
        name: name || email.split('@')[0],
        phone: '', // Google OAuth 不提供電話
        auth_provider: 'google',
      });

      // 可選：儲存 oauth_id
      // await updateCustomerOAuthId(customer.id, sub);
    }

    // 3. 建立 Session
    const clientIP = getClientIP(request);
    await createSession(customer.id, customer.email, clientIP);

    // 4. 回傳成功
    return NextResponse.json({
      success: true,
      data: {
        userId: customer.id,
        email: customer.email,
        name: customer.name,
      },
      message: 'Google 登入成功',
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { success: false, error: '登入失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
```

---

## 安全性考量

### 1. Token 驗證
- ✅ 使用 Google 官方 Library 驗證 ID Token
- ✅ 檢查 audience（Client ID）
- ✅ 檢查 issuer（來自 Google）
- ✅ 檢查 expiration

### 2. 帳號關聯
- ✅ Email 作為唯一識別（避免重複帳號）
- ✅ 自動關聯已存在的 Email 帳號
- ✅ 首次 Google 登入自動建立新帳號

### 3. Session 管理
- ✅ 使用既有的 JWT Session 機制
- ✅ Session 有效期：7 天
- ✅ 記錄最後登入時間

---

## UX 設計

### 登入頁面佈局

```
┌────────────────────────────────┐
│        咖啡豆訂單系統           │
│                                │
│  ┌──────────────────────────┐ │
│  │  使用 Google 登入         │ │
│  │  [G] Continue with Google│ │
│  └──────────────────────────┘ │
│                                │
│  ─────── 或 ───────            │
│                                │
│  Email: [________________]     │
│  密碼:   [________________]     │
│  [         登入         ]      │
│                                │
│  還沒有帳號？立即註冊           │
└────────────────────────────────┘
```

### 註冊頁面佈局

```
┌────────────────────────────────┐
│        註冊新帳號              │
│                                │
│  ┌──────────────────────────┐ │
│  │  使用 Google 註冊         │ │
│  │  [G] Sign up with Google │ │
│  └──────────────────────────┘ │
│                                │
│  ─────── 或 ───────            │
│                                │
│  Email: [________________]     │
│  姓名:   [________________]     │
│  電話:   [________________]     │
│  [    註冊並發送驗證碼    ]    │
│                                │
│  已有帳號？立即登入             │
└────────────────────────────────┘
```

---

## 測試計畫

### 1. 手動測試

**測試場景 1：新用戶 Google 登入**
- 使用未註冊的 Google 帳號登入
- 預期：自動建立新帳號並登入

**測試場景 2：既有用戶 Google 登入**
- 使用已註冊的 Email（OTP 註冊）
- 使用該 Email 的 Google 帳號登入
- 預期：直接登入既有帳號

**測試場景 3：登入後狀態**
- 檢查 Header 顯示用戶名稱
- 檢查可以正常下訂單
- 檢查 Session 持久化

---

### 2. API 測試

```bash
# 測試 Google OAuth API
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "google_id_token_here"}'
```

---

## 部署檢查清單

- [ ] Google Cloud Console 設定完成
- [ ] OAuth Client ID 已建立
- [ ] 授權重新導向 URI 已設定
- [ ] 環境變數已設定（本地和 Vercel）
- [ ] Google+ API 已啟用
- [ ] 測試登入流程正常
- [ ] 測試帳號關聯正常
- [ ] 測試 Session 持久化

---

## 已知限制與未來改進

### 當前限制

1. **電話號碼處理**
   - Google OAuth 不提供電話號碼
   - 首次 Google 登入的用戶電話為空
   - 需在個人資料頁面補充

2. **Email 驗證**
   - Google 已驗證的 Email 可信任
   - 可直接標記 `email_verified = true`

### 未來改進

1. **One Tap 登入**
   - 實作 Google One Tap（自動登入）
   - 提升用戶體驗

2. **多 OAuth 提供者**
   - Facebook Login
   - LINE Login
   - Apple Sign In

3. **帳號綁定**
   - 允許一個帳號綁定多個 OAuth
   - 個人資料頁面管理已綁定的帳號

---

## 相關文件

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

---

**實作狀態**: 進行中  
**預計完成時間**: 2026-01-04

