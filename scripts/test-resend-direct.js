#!/usr/bin/env node

/**
 * 直接測試 Resend API
 * 使用 Resend 提供的測試 Email
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('==============================================');
console.log('  Resend API 直接測試');
console.log('==============================================\n');

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

console.log('設定資訊：');
console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
console.log(`  From Email: ${fromEmail}\n`);

// 檢查發送者域名
const domain = fromEmail.split('@')[1];
console.log(`檢查發送者域名: ${domain}`);

if (domain === 'gmail.com' || domain === 'yahoo.com' || domain === 'outlook.com') {
  console.log('⚠️  警告：使用公共 Email 服務域名');
  console.log('   Resend 要求發送者必須是已驗證的域名');
  console.log('\n建議：');
  console.log('   1. 使用 Resend 測試 Email: onboarding@resend.dev');
  console.log('   2. 或驗證您自己的域名\n');
  console.log('是否繼續測試？(使用測試 Email)\n');
}

// 測試 1: 使用原始 From Email
console.log('[測試 1] 使用設定的 From Email...');
testEmail(fromEmail, 'qwerboy@gmail.com')
  .then(() => {
    console.log('✅ 測試 1 成功\n');
  })
  .catch((error) => {
    console.log(`❌ 測試 1 失敗: ${error.message}\n`);
    
    // 測試 2: 使用 Resend 測試 Email
    console.log('[測試 2] 使用 Resend 測試 Email (onboarding@resend.dev)...');
    return testEmail('onboarding@resend.dev', 'qwerboy@gmail.com');
  })
  .then(() => {
    console.log('✅ 測試 2 成功\n');
    console.log('==============================================');
    console.log('建議更新 .env.local:');
    console.log('RESEND_FROM_EMAIL=onboarding@resend.dev');
    console.log('==============================================\n');
  })
  .catch((error) => {
    console.log(`❌ 測試 2 也失敗: ${error.message}\n`);
    console.log('==============================================');
    console.log('可能的問題：');
    console.log('1. API Key 無效或已過期');
    console.log('2. Resend 帳號有問題');
    console.log('3. 網路連線問題');
    console.log('\n請檢查 Resend Dashboard:');
    console.log('https://resend.com/api-keys');
    console.log('==============================================\n');
  });

function testEmail(from, to) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: from,
      to: to,
      subject: '測試 - 咖啡豆訂單系統 OTP 功能',
      html: `
        <h1>測試信件</h1>
        <p>這是一封測試信件，用於驗證 Resend Email 發送功能。</p>
        <p>發送時間: ${new Date().toLocaleString('zh-TW')}</p>
        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0;"><strong>測試驗證碼：</strong></p>
          <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">123456</p>
        </div>
      `
    });

    console.log(`  發送到: ${to}`);
    console.log(`  從: ${from}`);

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
        console.log(`  狀態碼: ${res.statusCode}`);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`  回應: ${responseData}`);
          const response = JSON.parse(responseData);
          console.log(`  Email ID: ${response.id}`);
          resolve(response);
        } else {
          console.log(`  錯誤回應: ${responseData}`);
          reject(new Error(`API Error ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Network Error: ${error.message}`));
    });

    req.write(data);
    req.end();
  });
}

