'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { registerSchema } from '@/lib/validation/schemas';
import { z } from 'zod';
import { OTPInput } from '@/components/auth/OTPInput';
import { CountdownTimer } from '@/components/auth/CountdownTimer';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { getPasswordStrength } from '@/lib/auth/password-strength';

type RegisterFormData = z.infer<typeof registerSchema>;

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [usePassword, setUsePassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = form.watch('password');

  // 監控密碼變化，計算強度
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    }
  }, [password]);

  // 註冊並發送 OTP 或使用密碼註冊
  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // 如果提供了密碼，直接完成註冊並登入
        if (data.password) {
          router.push('/');
          router.refresh();
        } else {
          // 否則使用 OTP 驗證流程
          setEmail(data.email);
          setStep('otp');
        }
      } else {
        setError(result.error || '註冊失敗，請稍後再試');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 重新發送 OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || '重新發送失敗，請稍後再試');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 驗證 OTP
  const handleVerifyOTP = async () => {
    if (otpValue.replace(/\s/g, '').length !== 6) {
      setOtpError(true);
      setError('請輸入完整的 6 位數驗證碼');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOtpError(false);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp_code: otpValue.replace(/\s/g, ''),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 註冊成功，重新載入頁面以更新 Session
        router.push('/');
        router.refresh();
      } else {
        setOtpError(true);
        setError(result.error || '驗證碼錯誤，請重新輸入');
        setOtpValue(''); // 清空輸入
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
      setOtpError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-coffee-800">
          註冊
        </h1>

        {step === 'form' ? (
          <>
            {/* Google 註冊按鈕 */}
            <div className="mb-6">
              <GoogleLoginButton
                onError={(error) => setError(error)}
                text="signup_with"
              />
            </div>

            {/* 分隔線 */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">或使用 Email 註冊</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

          <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                id="email"
                type="email"
                {...form.register('email')}
                className={`
                  w-full px-4 py-3 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-coffee-500
                  ${form.formState.errors.email ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="example@email.com"
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                姓名 *
              </label>
              <input
                id="name"
                type="text"
                {...form.register('name')}
                className={`
                  w-full px-4 py-3 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-coffee-500
                  ${form.formState.errors.name ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="請輸入您的姓名"
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                手機號碼 *
              </label>
              <input
                id="phone"
                type="tel"
                {...form.register('phone')}
                className={`
                  w-full px-4 py-3 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-coffee-500
                  ${form.formState.errors.phone ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder="0912345678"
                disabled={isLoading}
              />
              {form.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            {/* 密碼註冊選項 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="usePassword"
                checked={usePassword}
                onChange={(e) => {
                  setUsePassword(e.target.checked);
                  if (!e.target.checked) {
                    form.setValue('password', undefined);
                    form.setValue('confirmPassword', undefined);
                  }
                }}
                className="w-4 h-4 text-coffee-600 border-gray-300 rounded focus:ring-coffee-500"
              />
              <label htmlFor="usePassword" className="ml-2 text-sm text-gray-700">
                設定密碼（設定後可直接使用密碼登入，無需驗證碼）
              </label>
            </div>

            {usePassword && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    密碼 *
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...form.register('password')}
                    className={`
                      w-full px-4 py-3 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-coffee-500
                      ${form.formState.errors.password ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="至少 8 個字元，包含字母和數字"
                    disabled={isLoading}
                    onChange={(e) => {
                      form.register('password').onChange(e);
                      if (e.target.value) {
                        setPasswordStrength(getPasswordStrength(e.target.value));
                      }
                    }}
                  />
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                  {password && password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passwordStrength === 'weak' ? 'bg-red-500' :
                              passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{
                              width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          密碼強度：{passwordStrength === 'weak' ? '弱' : passwordStrength === 'medium' ? '中' : '強'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    確認密碼 *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...form.register('confirmPassword')}
                    className={`
                      w-full px-4 py-3 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-coffee-500
                      ${form.formState.errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="請再次輸入密碼"
                    disabled={isLoading}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3 px-4 rounded-lg font-medium
                bg-button-500 text-white
                hover:bg-button-600
                disabled:bg-gray-400 disabled:cursor-not-allowed
                transition-colors
              `}
            >
              {isLoading 
                ? '註冊中...' 
                : usePassword 
                  ? '註冊' 
                  : '註冊並發送驗證碼'}
            </button>

            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600">
                已經有帳號？{' '}
                <Link href="/login" className="text-coffee-600 hover:text-coffee-700 font-medium">
                  立即登入
                </Link>
              </div>
              {!usePassword && (
                <div className="text-sm text-gray-600">
                  或{' '}
                  <Link href="/register-password" className="text-coffee-600 hover:text-coffee-700 font-medium">
                    使用密碼註冊
                  </Link>
                </div>
              )}
            </div>
          </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                驗證碼已發送到
              </p>
              <p className="font-semibold text-gray-800">{email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                請輸入 6 位數驗證碼
              </label>
              <OTPInput
                value={otpValue}
                onChange={setOtpValue}
                disabled={isLoading}
                error={otpError}
              />
              {error && (
                <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
              )}
            </div>

            <div className="flex justify-center">
              <CountdownTimer
                onResend={handleResendOTP}
                resendLabel="重新發送驗證碼"
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otpValue.replace(/\s/g, '').length !== 6}
              className={`
                w-full py-3 px-4 rounded-lg font-medium
                bg-button-500 text-white
                hover:bg-button-600
                disabled:bg-gray-400 disabled:cursor-not-allowed
                transition-colors
              `}
            >
              {isLoading ? '驗證中...' : '完成註冊'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtpValue('');
                setError(null);
                setOtpError(false);
              }}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              返回修改資料
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

