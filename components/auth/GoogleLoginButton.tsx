'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
  onSuccess?: () => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width?: number;
}

/**
 * Google 登入按鈕元件
 * 使用 Google Identity Services (GIS) 實作 OAuth 登入
 */
export function GoogleLoginButton({
  onError,
  onSuccess,
  text = 'continue_with',
  width,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 處理 Google 登入回調
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
        onSuccess?.();
        // 登入成功，重新載入頁面以更新 Session
        router.push('/');
        router.refresh();
      } else {
        onError?.(data.error || 'Google 登入失敗');
      }
    } catch (error) {
      console.error('Google login error:', error);
      onError?.('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 載入 Google Identity Services
  useEffect(() => {
    // 檢查是否已載入
    if (window.google) {
      setIsScriptLoaded(true);
      return;
    }

    // 載入 Google Identity Services 腳本
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsScriptLoaded(true);
    };

    script.onerror = () => {
      onError?.('無法載入 Google 登入服務');
    };

    document.body.appendChild(script);

    return () => {
      // 清理腳本（如果需要）
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onError]);

  // 初始化並渲染 Google 按鈕
  useEffect(() => {
    if (!isScriptLoaded || !window.google || !buttonRef.current) {
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
      onError?.('Google 登入設定錯誤');
      return;
    }

    try {
      // 初始化 Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // 渲染 Google 登入按鈕
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: text,
        shape: 'rectangular',
        logo_alignment: 'left',
        width: width || buttonRef.current.offsetWidth || 400,
        locale: 'zh_TW',
      });
    } catch (error) {
      console.error('Google button initialization error:', error);
      onError?.('Google 登入初始化失敗');
    }
  }, [isScriptLoaded, text, width, onError]);

  return (
    <div className="relative">
      <div 
        ref={buttonRef} 
        id="google-login-button"
        className={`
          w-full
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">登入中...</span>
          </div>
        </div>
      )}
      {!isScriptLoaded && !isLoading && (
        <div className="w-full py-3 px-4 border border-gray-300 rounded-lg text-center text-gray-500 text-sm">
          載入 Google 登入中...
        </div>
      )}
    </div>
  );
}

