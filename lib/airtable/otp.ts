import base, { TABLES } from './client';
import { generateOTP } from '@/lib/auth/otp-generator';

/**
 * OTP Token 介面
 */
export interface OTPToken {
  id: string;
  email: string;
  otp_code: string;
  expires_at: string;
  attempts: number;
  is_used: boolean;
  last_sent_at?: string;
  resend_count: number;
  created_at: string;
}

/**
 * 建立 OTP Token
 * @param email 目標 Email
 * @returns OTP Token 記錄
 */
export async function createOTPToken(email: string): Promise<OTPToken> {
  const otpCode = generateOTP();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 分鐘後過期

  try {
    const record = await base(TABLES.OTP_TOKENS).create({
      email: email.toLowerCase(),
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      is_used: false,
      last_sent_at: now.toISOString(),
      resend_count: 0,
    });

    return {
      id: record.id,
      email: record.get('email') as string,
      otp_code: record.get('otp_code') as string,
      expires_at: record.get('expires_at') as string,
      attempts: (record.get('attempts') as number) || 0,
      is_used: (record.get('is_used') as boolean) || false,
      last_sent_at: record.get('last_sent_at') as string | undefined,
      resend_count: (record.get('resend_count') as number) || 0,
      created_at: record.get('created_at') as string,
    };
  } catch (error) {
    console.error('Error creating OTP token:', error);
    throw new Error('無法建立驗證碼，請稍後再試');
  }
}

/**
 * 驗證 OTP Token
 * @param email 目標 Email
 * @param code OTP 驗證碼
 * @returns 驗證是否成功
 */
export async function verifyOTPToken(
  email: string,
  code: string
): Promise<{ success: boolean; token?: OTPToken; error?: string }> {
  try {
    // 查詢最新的未使用 OTP
    const records = await base(TABLES.OTP_TOKENS)
      .select({
        filterByFormula: `AND({email} = "${email.toLowerCase()}", {is_used} = FALSE())`,
        sort: [{ field: 'created_at', direction: 'desc' }],
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return {
        success: false,
        error: '找不到有效的驗證碼，請重新發送',
      };
    }

    const record = records[0];
    const token: OTPToken = {
      id: record.id,
      email: record.get('email') as string,
      otp_code: record.get('otp_code') as string,
      expires_at: record.get('expires_at') as string,
      attempts: (record.get('attempts') as number) || 0,
      is_used: (record.get('is_used') as boolean) || false,
      last_sent_at: record.get('last_sent_at') as string | undefined,
      resend_count: (record.get('resend_count') as number) || 0,
      created_at: record.get('created_at') as string,
    };

    // 檢查是否已使用
    if (token.is_used) {
      return {
        success: false,
        error: '此驗證碼已使用，請重新發送',
      };
    }

    // 檢查是否過期
    const expiresAt = new Date(token.expires_at);
    if (expiresAt < new Date()) {
      return {
        success: false,
        error: '驗證碼已過期，請重新發送',
      };
    }

    // 檢查嘗試次數
    if (token.attempts >= 3) {
      return {
        success: false,
        error: '驗證次數過多，請重新發送驗證碼',
      };
    }

    // 驗證碼比對
    if (token.otp_code !== code) {
      // 增加嘗試次數
      await base(TABLES.OTP_TOKENS).update(record.id, {
        attempts: token.attempts + 1,
      });

      return {
        success: false,
        error: '驗證碼錯誤',
      };
    }

    // 標記為已使用
    await base(TABLES.OTP_TOKENS).update(record.id, {
      is_used: true,
    });

    return {
      success: true,
      token,
    };
  } catch (error) {
    console.error('Error verifying OTP token:', error);
    return {
      success: false,
      error: '驗證失敗，請稍後再試',
    };
  }
}

/**
 * 檢查 Email 是否有有效的 OTP（用於重送限制）
 * @param email 目標 Email
 * @returns 是否有有效的 OTP
 */
export async function hasValidOTP(email: string): Promise<boolean> {
  try {
    const records = await base(TABLES.OTP_TOKENS)
      .select({
        filterByFormula: `AND({email} = "${email.toLowerCase()}", {is_used} = FALSE())`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return false;
    }

    const record = records[0];
    const expiresAt = new Date(record.get('expires_at') as string);
    return expiresAt > new Date();
  } catch (error) {
    console.error('Error checking valid OTP:', error);
    return false;
  }
}

/**
 * 清理過期 OTP（可選，用於定期清理）
 * 注意：Airtable 沒有直接刪除多筆的功能，此函數僅為範例
 * 實際應用中可以使用 Airtable Scripting 或外部腳本來清理
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  // 此功能在 Airtable 中較難實現
  // 建議使用 Airtable Scripting 或定期手動清理
  // 或者讓過期的 OTP 自然失效（透過驗證時檢查過期時間）
}



