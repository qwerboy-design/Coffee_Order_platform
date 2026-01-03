import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import { AuthError, AuthErrorCode } from '@/lib/errors';
import { randomUUID } from 'crypto';

const SESSION_COOKIE_NAME = 'session';

/**
 * JWT Payload 型別
 */
export interface SessionPayload {
  userId: string;
  sessionId: string;
  email: string;
  ipAddress?: string;
  iat?: number;
  exp?: number;
  [key: string]: string | number | undefined; // 添加索引簽名以符合 JWTPayload
}

/**
 * 建立 Session
 * @param userId 用戶 ID
 * @param email 用戶 Email
 * @param ipAddress 用戶 IP（可選）
 * @returns JWT Token
 */
export async function createSession(
  userId: string,
  email: string,
  ipAddress?: string
): Promise<string> {
  const sessionId = randomUUID();
  const secret = new TextEncoder().encode(config.jwt.secret);

  const token = await new SignJWT({
    userId,
    sessionId,
    email,
    ...(ipAddress && { ipAddress }),
  } as SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + config.jwt.maxAge)
    .sign(secret);

  // 設定 Cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.jwt.maxAge,
    path: '/',
  });

  return token;
}

/**
 * 取得 Session
 * @returns Session Payload 或 null
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(config.jwt.secret);
    const { payload } = await jwtVerify<SessionPayload>(token, secret);

    return payload;
  } catch (error) {
    // Token 無效或已過期
    return null;
  }
}

/**
 * 刪除 Session
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * 驗證 Session（用於 API Route）
 * @throws AuthError 如果 Session 無效
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    throw new AuthError(
      '未授權，請先登入',
      AuthErrorCode.UNAUTHORIZED,
      401
    );
  }

  // 檢查是否過期（額外檢查，JWT 本身已有 exp）
  if (session.exp && session.exp < Math.floor(Date.now() / 1000)) {
    throw new AuthError(
      'Session 已過期，請重新登入',
      AuthErrorCode.SESSION_EXPIRED,
      401
    );
  }

  return session;
}



