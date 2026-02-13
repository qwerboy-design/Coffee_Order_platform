'use client';

import { useEffect, useState, useRef } from 'react';

interface LinkGoogleButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * 綁定 Google 帳號按鈕
 * 用於已登入用戶綁定 Google 帳號（非登入流程）
 */
export function LinkGoogleButton({ onSuccess, onError }: LinkGoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 處理 Google 綁定回調
  const handleGoogleLink = async (response: any) => {
    setIsLoading(true);

    try {
      const result = await fetch('/api/auth/link-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await result.json();

      if (data.success) {
        onSuccess?.();
      } else {
        onError?.(data.error || '綁定 Google 帳號失敗');
      }
    } catch (error) {
      console.error('Link Google error:', error);
      onError?.('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 載入 Google Identity Services
  useEffect(() => {
    if (window.google) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsScriptLoaded(true);
    };

    script.onerror = () => {
      onError?.('無法載入 Google 服務');
    };

    document.body.appendChild(script);

    return () => {
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
      onError?.('Google 設定錯誤');
      return;
    }

    try {
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleLink,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // @ts-ignore
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 240,
        locale: 'zh_TW',
      });
    } catch (error) {
      console.error('Google button initialization error:', error);
      onError?.('Google 初始化失敗');
    }
  }, [isScriptLoaded, onError]);

  return (
    <div className="relative">
      <div
        ref={buttonRef}
        className={`
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-coffee-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

