import { supabaseAdmin, TABLES } from './client';

export interface OTPToken {
  id: string;
  email: string;
  otp_code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

/**
 * 建立 OTP Token
 */
export async function createOTPToken(email: string, otpCode: string): Promise<OTPToken> {
  try {
    // OTP 有效期：10 分鐘
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from(TABLES.OTP_TOKENS)
      .insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      otp_code: data.otp_code,
      expires_at: data.expires_at,
      is_used: data.is_used,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error creating OTP token:', error);
    throw new Error('建立 OTP Token 失敗');
  }
}

/**
 * 驗證 OTP Code
 */
export async function verifyOTPCode(
  email: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.OTP_TOKENS)
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otpCode)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: '驗證碼無效或已過期' };
      }
      throw error;
    }

    // 檢查是否過期
    if (new Date(data.expires_at) < new Date()) {
      return { success: false, error: '驗證碼已過期' };
    }

    // 檢查是否已使用
    if (data.is_used) {
      return { success: false, error: '驗證碼已使用' };
    }

    // 標記為已使用
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.OTP_TOKENS)
      .update({ is_used: true })
      .eq('id', data.id);

    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
      return { success: false, error: '驗證失敗，請重試' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP code:', error);
    return { success: false, error: '驗證失敗，請重試' };
  }
}

/**
 * 清理過期的 OTP Tokens
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.OTP_TOKENS)
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw error;

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
}

/**
 * 檢查 Email 是否有最近的 OTP（用於 Rate Limiting）
 */
export async function hasRecentOTP(email: string, withinMinutes: number = 1): Promise<boolean> {
  try {
    const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);

    const { data, error } = await supabaseAdmin
      .from(TABLES.OTP_TOKENS)
      .select('id')
      .eq('email', email.toLowerCase())
      .gt('created_at', cutoffTime.toISOString())
      .limit(1);

    if (error) throw error;

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking recent OTP:', error);
    return false;
  }
}


