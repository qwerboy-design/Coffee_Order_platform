import { randomInt } from 'crypto';

/**
 * 安全的 OTP 生成器
 * 使用 crypto.randomInt 而非 Math.random() 以確保加密安全性
 * @returns 6 位數隨機驗證碼
 */
export function generateOTP(): string {
  // 產生 100000 到 999999 之間的隨機整數（6 位數）
  return randomInt(100000, 999999).toString();
}





