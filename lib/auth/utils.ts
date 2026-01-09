import { redirect } from 'next/navigation';
import { getSession, requireSession, type SessionPayload } from './session';
import bcrypt from 'bcryptjs';

/**
 * 取得當前登入用戶（用於 Server Component）
 * 如果未登入則返回 null
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  return await getSession();
}

/**
 * 要求認證（用於 Server Component）
 * 如果未登入則重定向到登入頁面
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * 要求認證（用於 API Route）
 * 如果未登入則拋出 AuthError
 */
export async function requireAuthAPI(): Promise<SessionPayload> {
  return await requireSession();
}

/**
 * 密碼加密
 * @param password 明文密碼
 * @returns bcrypt 雜湊值
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // cost factor: 12
  return bcrypt.hash(password, saltRounds);
}

/**
 * 驗證密碼
 * @param password 明文密碼
 * @param hash bcrypt 雜湊值
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// getPasswordStrength 已移至 lib/auth/password-strength.ts
// 以避免在客戶端組件中引入服務器端依賴









