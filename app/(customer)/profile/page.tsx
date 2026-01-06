'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LinkGoogleButton } from '@/components/auth/LinkGoogleButton';

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  auth_provider?: string;
  oauth_id?: string;
  password_hash?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // 載入用戶資料
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.data) {
        setProfile(data.data);
      } else {
        // 未登入，重導向到登入頁面
        router.push('/login');
      }
    } catch (err) {
      setError('無法載入個人資料');
    } finally {
      setIsLoading(false);
    }
  };

  // 綁定 Google 帳號成功
  const handleLinkSuccess = () => {
    setSuccessMessage('成功綁定 Google 帳號！');
    fetchProfile(); // 重新載入資料
  };

  // 綁定 Google 帳號失敗
  const handleLinkError = (errorMsg: string) => {
    setError(errorMsg);
    setSuccessMessage(null);
  };

  // 解綁 Google 帳號
  const handleUnlinkGoogle = async () => {
    if (!confirm('確定要解綁 Google 帳號嗎？解綁後您需要使用密碼登入。')) {
      return;
    }

    setIsUnlinking(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/unlink-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('成功解綁 Google 帳號');
        fetchProfile();
      } else {
        setError(data.error || '解綁失敗');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
    } finally {
      setIsUnlinking(false);
    }
  };

  // 登出
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4 pb-12">
      <h1 className="text-3xl font-bold text-coffee-800 mb-8">個人資料</h1>

      {/* 成功訊息 */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 基本資料 */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">基本資料</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="text-gray-600 w-32">姓名：</span>
            <span className="text-gray-800 font-medium">{profile.name}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-600 w-32">Email：</span>
            <span className="text-gray-800 font-medium">{profile.email}</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-600 w-32">電話：</span>
            <span className="text-gray-800 font-medium">
              {profile.phone || <span className="text-gray-400">尚未設定</span>}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-600 w-32">註冊方式：</span>
            <span className="text-gray-800 font-medium">
              {profile.auth_provider === 'google' && 'Google 帳號'}
              {profile.auth_provider === 'email' && 'Email + 密碼'}
              {profile.auth_provider === 'otp' && 'OTP 驗證碼'}
              {!profile.auth_provider && '未知'}
            </span>
          </div>
        </div>
      </div>

      {/* 帳號綁定 */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">帳號綁定</h2>
        
        <div className="space-y-6">
          {/* Google 帳號綁定 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-300">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Google 帳號</p>
                  <p className="text-sm text-gray-500">
                    {profile.oauth_id ? '已綁定' : '未綁定'}
                  </p>
                </div>
              </div>
              
              {profile.oauth_id ? (
                <button
                  onClick={handleUnlinkGoogle}
                  disabled={isUnlinking}
                  className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUnlinking ? '解綁中...' : '解除綁定'}
                </button>
              ) : (
                <div>
                  <LinkGoogleButton
                    onSuccess={handleLinkSuccess}
                    onError={handleLinkError}
                  />
                </div>
              )}
            </div>
            
            {!profile.oauth_id && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 綁定 Google 帳號後，您可以使用 Google 快速登入
                </p>
              </div>
            )}
            
            {profile.oauth_id && !profile.password_hash && (
              <div className="mt-4 p-4 bg-coffee-50 border border-coffee-200 rounded-lg">
                <p className="text-sm text-coffee-700">
                  ⚠️ 請先設定密碼後再解綁 Google 帳號，以確保您能夠繼續登入
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 訂單統計 */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">訂單統計</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-coffee-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">總訂單數</p>
            <p className="text-3xl font-bold text-coffee-600">{profile.total_orders}</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">總消費金額</p>
            <p className="text-3xl font-bold text-green-600">
              ${profile.total_spent.toLocaleString()}
            </p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">最近訂單</p>
            <p className="text-lg font-bold text-blue-600">
              {profile.last_order_date || '無'}
            </p>
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleLogout}
          className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          登出
        </button>
      </div>
    </div>
  );
}

