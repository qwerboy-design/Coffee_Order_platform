/**
 * Rate Limiting 實作
 * 開發環境使用記憶體版本，生產環境建議使用 Redis（Upstash）或 Vercel KV
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 記憶體儲存（開發環境）
const store = new Map<string, RateLimitEntry>();

// Rate Limit 配置
const RATE_LIMITS = {
  // 單一 IP：每分鐘最多 5 次 OTP 請求
  IP_OTP_REQUEST: { max: 5, window: 60 * 1000 }, // 60 秒

  // 單一 Email：每 2 分鐘最多 1 次 OTP
  EMAIL_OTP_REQUEST: { max: 1, window: 2 * 60 * 1000 }, // 120 秒

  // 單一 IP 的 OTP 驗證：每分鐘最多 10 次嘗試
  IP_OTP_VERIFY: { max: 10, window: 60 * 1000 }, // 60 秒
} as const;

/**
 * 取得客戶端 IP
 */
export function getClientIP(request: Request): string {
  // 從 headers 取得 IP（考慮 proxy）
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // 開發環境 fallback
  return '127.0.0.1';
}

/**
 * 檢查 Rate Limit
 * @param key 限制鍵值（IP 或 Email）
 * @param type 限制類型
 * @returns 是否超過限制
 */
export function checkRateLimit(
  key: string,
  type: keyof typeof RATE_LIMITS
): { allowed: boolean; resetAt: number; remaining: number } {
  const limit = RATE_LIMITS[type];
  const storeKey = `${type}:${key}`;
  const now = Date.now();

  // 取得現有記錄
  const entry = store.get(storeKey);

  if (!entry || now > entry.resetAt) {
    // 沒有記錄或已過期，建立新記錄
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + limit.window,
    };
    store.set(storeKey, newEntry);
    return {
      allowed: true,
      resetAt: newEntry.resetAt,
      remaining: limit.max - 1,
    };
  }

  // 檢查是否超過限制
  if (entry.count >= limit.max) {
    return {
      allowed: false,
      resetAt: entry.resetAt,
      remaining: 0,
    };
  }

  // 增加計數
  entry.count += 1;
  store.set(storeKey, entry);

  return {
    allowed: true,
    resetAt: entry.resetAt,
    remaining: limit.max - entry.count,
  };
}

/**
 * 定期清理過期記錄（每 5 分鐘）
 */
if (typeof window === 'undefined') {
  // 只在伺服器端執行
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000); // 5 分鐘
}

/**
 * 檢查 IP Rate Limit
 */
export function checkIPRateLimit(
  ip: string,
  type: 'IP_OTP_REQUEST' | 'IP_OTP_VERIFY'
) {
  return checkRateLimit(ip, type);
}

/**
 * 檢查 Email Rate Limit
 */
export function checkEmailRateLimit(email: string) {
  return checkRateLimit(email.toLowerCase(), 'EMAIL_OTP_REQUEST');
}





