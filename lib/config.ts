import { z } from 'zod';

/**
 * 環境變數驗證 Schema
 * 使用 Zod 確保所有必要的環境變數都存在且格式正確
 */
const envSchema = z.object({
  // Resend Email Service
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email'),

  // JWT Secret（至少 32 字元）
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Next.js
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * 驗證環境變數
 * 構建時允許環境變數為空，運行時再檢查
 */
const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  (process.env.NODE_ENV === 'production' && !process.env.VERCEL);

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (isBuildTime) {
    // 構建時使用預設值
    env = {
      RESEND_API_KEY: 'build-time-placeholder',
      RESEND_FROM_EMAIL: 'noreply@example.com',
      JWT_SECRET: 'build-time-placeholder-32-chars-minimum',
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: undefined,
    } as z.infer<typeof envSchema>;
  } else {
    // 運行時必須驗證通過
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`環境變數驗證失敗：\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

/**
 * 配置物件
 * 提供類型安全的配置訪問
 */
export const config = {
  resend: {
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.RESEND_FROM_EMAIL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    // Session 有效期：7 天
    maxAge: 7 * 24 * 60 * 60, // 秒
  },
  nodeEnv: env.NODE_ENV,
  appUrl: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
} as const;
