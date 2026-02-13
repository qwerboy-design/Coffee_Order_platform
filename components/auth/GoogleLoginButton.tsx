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
 * 檢測是否為移動設備
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * 檢測是否在 WebView 中
 */
function isWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  // 檢測常見的 WebView 標識
  return (
    ua.includes('wv') || // Android WebView
    ua.includes('line') || // LINE 內建瀏覽器
    ua.includes('fbav') || // Facebook 內建瀏覽器
    ua.includes('fban') || // Facebook 內建瀏覽器
    ua.includes('instagram') || // Instagram 內建瀏覽器
    (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('fxios')) // iOS WebView
  );
}

/**
 * Google 登入按鈕元件
 * 使用 Google Identity Services (GIS) 實作 OAuth 登入
 * 支援移動端和桌面端，並處理 WebView 環境
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
  const [isWebViewEnv, setIsWebViewEnv] = useState(false);
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
        // 檢查是否為 disallowed_useragent 錯誤
        const errorMessage = data.error || 'Google 登入失敗';
        if (errorMessage.includes('disallowed_useragent') || errorMessage.includes('403')) {
          onError?.(
            'Google 登入失敗：請使用標準瀏覽器（Chrome、Safari）開啟此頁面，不要使用應用程式內建瀏覽器。'
          );
        } else {
          onError?.(errorMessage);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      onError?.('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 檢測環境
  useEffect(() => {
    setIsWebViewEnv(isWebView());
  }, []);

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
      // 針對移動端和 WebView 環境進行優化配置
      const initConfig = {
        client_id: clientId,
        callback: handleGoogleLogin,
        auto_select: false,
        cancel_on_tap_outside: true,
        // 支援 ITP (Intelligent Tracking Prevention)
        itp_support: true,
      };

      // @ts-ignore
      window.google.accounts.id.initialize(initConfig);

      // 渲染 Google 登入按鈕
      const buttonConfig: any = {
        theme: 'outline',
        size: isMobileDevice() ? 'large' : 'large',
        type: 'standard',
        text: text,
        shape: 'rectangular',
        logo_alignment: 'left',
        width: width || (isMobileDevice() ? undefined : (buttonRef.current?.offsetWidth || 400)),
        locale: 'zh_TW',
      };

      // @ts-ignore
      window.google.accounts.id.renderButton(buttonRef.current, buttonConfig);
    } catch (error) {
      console.error('Google button initialization error:', error);
      onError?.('Google 登入初始化失敗');
    }
  }, [isScriptLoaded, text, width, onError]);

  return (
    <div className="relative">
      {/* WebView 環境提示 */}
      {isWebViewEnv && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 檢測到您正在使用應用程式內建瀏覽器。為確保 Google 登入正常運作，建議您：
          </p>
          <ol className="mt-2 ml-4 text-sm text-yellow-700 list-decimal space-y-1">
            <li>點擊右上角的「...」或「更多選項」</li>
            <li>選擇「在瀏覽器中開啟」或「用瀏覽器開啟」</li>
            <li>使用 Chrome、Safari 等標準瀏覽器進行登入</li>
          </ol>
        </div>
      )}

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
            <div className="w-5 h-5 border-2 border-coffee-600 border-t-transparent rounded-full animate-spin" />
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

