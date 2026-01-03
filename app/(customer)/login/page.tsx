'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginEmailSchema, loginPasswordSchema } from '@/lib/validation/schemas';
import { z } from 'zod';
import { OTPInput } from '@/components/auth/OTPInput';
import { CountdownTimer } from '@/components/auth/CountdownTimer';

type LoginEmailFormData = z.infer<typeof loginEmailSchema>;
type LoginPasswordFormData = z.infer<typeof loginPasswordSchema>;

type LoginMethod = 'otp' | 'password';
type Step = 'email' | 'otp' | 'password';

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);

  const emailForm = useForm<LoginEmailFormData>({
    resolver: zodResolver(loginEmailSchema),
  });

  const passwordForm = useForm<LoginPasswordFormData>({
    resolver: zodResolver(loginPasswordSchema),
  });

  // 發送 OTP
  const handleSendOTP = async (data: LoginEmailFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setEmail(data.email);
        setStep('otp');
      } else {
        setError(result.error || '發送驗證碼失敗，請稍後再試');
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

  // 密碼登入
  const handlePasswordLogin = async (data: LoginPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // 登入成功，重新載入頁面以更新 Session
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || '登入失敗，請稍後再試');
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
        // 登入成功，重新載入頁面以更新 Session
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
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-800">
          登入
        </h1>

        {step === 'password' ? (
          <>
            {/* 登入方式切換 */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setStep('password');
                  setError(null);
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                  ${loginMethod === 'password'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                密碼登入
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setStep('email');
                  setError(null);
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                  ${loginMethod === 'otp'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                驗證碼登入
              </button>
            </div>

            {/* 密碼登入表單 */}
            <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-6">
              <div>
                <label htmlFor="password-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="password-email"
                  type="email"
                  {...passwordForm.register('email')}
                  className={`
                    w-full px-4 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-amber-500
                    ${passwordForm.formState.errors.email ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="請輸入您的 Email"
                  disabled={isLoading}
                />
                {passwordForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <input
                  id="password"
                  type="password"
                  {...passwordForm.register('password')}
                  className={`
                    w-full px-4 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-amber-500
                    ${passwordForm.formState.errors.password ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="請輸入您的密碼"
                  disabled={isLoading}
                />
                {passwordForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

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
                  bg-amber-600 text-white
                  hover:bg-amber-700
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                {isLoading ? '登入中...' : '登入'}
              </button>

              <div className="text-center text-sm text-gray-600">
                還沒有帳號？{' '}
                <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                  立即註冊
                </Link>
              </div>
            </form>
          </>
        ) : step === 'email' ? (
          <>
            {/* 登入方式切換 */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setStep('password');
                  setError(null);
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                  ${loginMethod === 'password'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                密碼登入
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setStep('email');
                  setError(null);
                }}
                className={`
                  flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                  ${loginMethod === 'otp'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                驗證碼登入
              </button>
            </div>

            {/* OTP Email 輸入表單 */}
            <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...emailForm.register('email')}
                  className={`
                    w-full px-4 py-3 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-amber-500
                    ${emailForm.formState.errors.email ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="請輸入您的 Email"
                  disabled={isLoading}
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

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
                  bg-amber-600 text-white
                  hover:bg-amber-700
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                {isLoading ? '發送中...' : '發送驗證碼'}
              </button>

              <div className="text-center text-sm text-gray-600">
                還沒有帳號？{' '}
                <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                  立即註冊
                </Link>
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
                bg-amber-600 text-white
                hover:bg-amber-700
                disabled:bg-gray-400 disabled:cursor-not-allowed
                transition-colors
              `}
            >
              {isLoading ? '驗證中...' : '登入'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtpValue('');
                setError(null);
                setOtpError(false);
              }}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              返回修改 Email
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMethod('password');
                setStep('password');
                setOtpValue('');
                setError(null);
                setOtpError(false);
              }}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              改用密碼登入
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

