#!/usr/bin/env node

/**
 * 測試 OTP Email 模板
 * 直接發送 OTP 驗證碼 Email（使用實際的模板）
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('==============================================');
console.log('  OTP Email 模板測試');
console.log('==============================================\n');

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const toEmail = 'qwerboy@gmail.com'; // 您的 Gmail

// 生成測試用 OTP
const testOTP = '123456';

console.log('測試資訊：');
console.log(`  發送者: ${fromEmail}`);
console.log(`  收件者: ${toEmail}`);
console.log(`  測試 OTP: ${testOTP}\n`);

// 使用實際的 OTP Email 模板
const emailHTML = `
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
          ${testOTP}
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
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
        這是一封測試信件，用於驗證 Email 發送功能是否正常。
      </p>
      
      <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
        <strong>測試項目：</strong><br>
        ✅ Email 模板格式<br>
        ✅ 驗證碼顯示<br>
        ✅ 響應式設計<br>
        ✅ 安全警告訊息
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
      <p>此為系統自動發送的信件，請勿回覆。</p>
      <p>測試時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
    </div>
  </body>
</html>
`;

console.log('[測試] 發送 OTP Email...\n');

const data = JSON.stringify({
  from: fromEmail,
  to: toEmail,
  subject: '【測試】您的登入驗證碼 - 咖啡豆訂單系統',
  html: emailHTML
});

const options = {
  hostname: 'api.resend.com',
  port: 443,
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`狀態碼: ${res.statusCode}\n`);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      const response = JSON.parse(responseData);
      console.log('==============================================');
      console.log('✅ Email 發送成功！');
      console.log('==============================================\n');
      console.log(`Email ID: ${response.id}\n`);
      
      console.log('請檢查您的 Gmail 收件匣：');
      console.log(`  收件人: ${toEmail}`);
      console.log('  標題: 【測試】您的登入驗證碼 - 咖啡豆訂單系統\n');
      
      console.log('檢查項目：');
      console.log('  ✅ Email 是否收到（檢查垃圾信件夾）');
      console.log('  ✅ 標題和內容是否正確');
      console.log('  ✅ 驗證碼（123456）是否清晰顯示');
      console.log('  ✅ 漸層標題是否顯示正常');
      console.log('  ✅ 黃色警告區塊是否顯示');
      console.log('  ✅ 手機版排版是否正常\n');
      
      console.log('==============================================');
      console.log('🎉 OTP Email 功能測試完成！');
      console.log('==============================================\n');
      
    } else {
      console.log('❌ Email 發送失敗\n');
      console.log(`錯誤回應: ${responseData}\n`);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ 網路錯誤\n');
  console.log(`錯誤: ${error.message}\n`);
});

req.write(data);
req.end();

