import { Resend } from 'resend';
import { config } from '@/lib/config';

const resend = new Resend(config.resend.apiKey);

/**
 * 發送 OTP 驗證碼 Email
 * @param to 收件人 Email
 * @param otpCode 6 位數驗證碼
 */
export async function sendOTPEmail(to: string, otpCode: string): Promise<void> {
  try {
    await resend.emails.send({
      from: config.resend.fromEmail,
      to,
      subject: '您的登入驗證碼',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>登入驗證碼</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">☕ 咖啡豆訂單系統</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">您的登入驗證碼</h2>
              
              <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
                您的驗證碼為：
              </p>
              
              <div style="background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #f59e0b; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otpCode}
                </span>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                此驗證碼將於 <strong>10 分鐘</strong> 後過期。
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>⚠️ 安全提示：</strong><br>
                  如果您沒有要求此驗證碼，請忽略此信件。請勿將驗證碼分享給他人。
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              <p>此為系統自動發送的信件，請勿回覆。</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('無法發送驗證碼 Email，請稍後再試');
  }
}








