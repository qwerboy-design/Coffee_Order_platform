'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { registerWithPasswordSchema } from '@/lib/validation/schemas';
import { z } from 'zod';
import { getPasswordStrength } from '@/lib/auth/password-strength';

type RegisterPasswordFormData = z.infer<typeof registerWithPasswordSchema>;

export default function RegisterPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const form = useForm<RegisterPasswordFormData>({
    resolver: zodResolver(registerWithPasswordSchema),
  });

  const password = form.watch('password');

  // 監控密碼變化，計算強度
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    }
  }, [password]);

  const handleRegister = async (data: RegisterPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // 註冊成功，自動登入並跳轉
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || '註冊失敗，請稍後再試');
      }
    } catch (err) {
      setError('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak': return '弱';
      case 'medium': return '中';
      case 'strong': return '強';
      default: return '';
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-800">
          註冊
        </h1>

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
                focus:outline-none focus:ring-2 focus:ring-amber-500
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
                focus:outline-none focus:ring-2 focus:ring-amber-500
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
                focus:outline-none focus:ring-2 focus:ring-amber-500
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
                focus:outline-none focus:ring-2 focus:ring-amber-500
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
                      className={`h-full transition-all ${getStrengthColor(passwordStrength)}`}
                      style={{
                        width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    密碼強度：{getStrengthText(passwordStrength)}
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
                focus:outline-none focus:ring-2 focus:ring-amber-500
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
            {isLoading ? '註冊中...' : '註冊'}
          </button>

          <div className="text-center space-y-2">
            <div className="text-sm text-gray-600">
              已經有帳號？{' '}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                立即登入
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              或{' '}
              <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                使用 OTP 驗證碼註冊
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


