/**
 * 標準化錯誤處理
 * 定義認證相關錯誤類別和錯誤代碼
 */

/**
 * 認證錯誤代碼
 */
export enum AuthErrorCode {
  // OTP 相關錯誤
  INVALID_OTP = 'INVALID_OTP',
  EXPIRED_OTP = 'EXPIRED_OTP',
  MAX_ATTEMPTS_EXCEEDED = 'MAX_ATTEMPTS_EXCEEDED',
  OTP_ALREADY_USED = 'OTP_ALREADY_USED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 註冊相關錯誤
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',

  // Session 相關錯誤
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_SESSION = 'INVALID_SESSION',

  // 一般錯誤
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * 認證錯誤類別
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
    // 確保 instanceof 正確工作
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * 建立標準錯誤回應格式
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: AuthErrorCode;
}

/**
 * 建立成功回應格式
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * 從錯誤建立回應
 */
export function createErrorResponse(
  code: AuthErrorCode,
  customMessage?: string
): ErrorResponse {
  const messages: Record<AuthErrorCode, string> = {
    [AuthErrorCode.INVALID_OTP]: '驗證碼錯誤，請重新輸入',
    [AuthErrorCode.EXPIRED_OTP]: '驗證碼已過期，請重新發送',
    [AuthErrorCode.MAX_ATTEMPTS_EXCEEDED]: '驗證次數過多，請重新發送驗證碼',
    [AuthErrorCode.OTP_ALREADY_USED]: '此驗證碼已使用，請重新發送',
    [AuthErrorCode.RATE_LIMIT_EXCEEDED]: '請求過於頻繁，請稍後再試',
    [AuthErrorCode.EMAIL_ALREADY_EXISTS]: '此 Email 已被註冊',
    [AuthErrorCode.PHONE_ALREADY_EXISTS]: '此電話號碼已被使用',
    [AuthErrorCode.UNAUTHORIZED]: '未授權，請先登入',
    [AuthErrorCode.SESSION_EXPIRED]: 'Session 已過期，請重新登入',
    [AuthErrorCode.INVALID_SESSION]: '無效的 Session',
    [AuthErrorCode.VALIDATION_ERROR]: '資料驗證失敗',
    [AuthErrorCode.INTERNAL_ERROR]: '伺服器錯誤，請稍後再試',
  };

  return {
    success: false,
    error: customMessage || messages[code] || '發生錯誤',
    code,
  };
}

/**
 * 建立成功回應
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}



