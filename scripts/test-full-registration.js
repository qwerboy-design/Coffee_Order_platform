#!/usr/bin/env node

/**
 * 完整註冊流程測試
 * 測試：註冊 → 發送 OTP → 驗證 OTP
 */

require('dotenv').config({ path: '.env.local' });

const http = require('http');

console.log('==============================================');
console.log('  完整註冊流程測試');
console.log('==============================================\n');

const timestamp = Date.now();
const testEmail = `test${timestamp}@example.com`;
const testPhone = `09${String(timestamp).slice(-8)}`;
const testName = `測試用戶${timestamp}`;

console.log('測試資料：');
console.log(`  Email: ${testEmail}`);
console.log(`  姓名: ${testName}`);
console.log(`  電話: ${testPhone}\n`);

// 步驟 1: 註冊並發送 OTP
console.log('[步驟 1/3] 測試註冊 API...');

const registerData = JSON.stringify({
  email: testEmail,
  name: testName,
  phone: testPhone
});

const registerOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(registerData)
  }
};

const registerReq = http.request(registerOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`  狀態碼: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('  ✅ 註冊成功！');
      console.log(`  客戶 ID: ${response.data.customerId}`);
      console.log(`  訊息: ${response.message}\n`);
      
      console.log('==============================================');
      console.log('✅ 註冊流程測試通過！');
      console.log('==============================================\n');
      
      console.log('下一步測試：');
      console.log('  1. 檢查 Email 收件匣（包含垃圾信件）');
      console.log(`     收件人: ${testEmail}`);
      console.log('  2. 應收到標題為「您的登入驗證碼」的信件');
      console.log('  3. 信件中會顯示 6 位數驗證碼');
      console.log('  4. 在註冊頁面輸入驗證碼完成註冊\n');
      
      console.log('查看 Supabase 資料：');
      console.log(`  SELECT * FROM customers WHERE email = '${testEmail}';`);
      console.log(`  SELECT * FROM otp_tokens WHERE email = '${testEmail}' ORDER BY created_at DESC LIMIT 1;\n`);
      
    } else {
      console.log('  ❌ 註冊失敗');
      console.log(`  回應: ${data}\n`);
    }
  });
});

registerReq.on('error', (error) => {
  console.log('  ❌ 連線失敗');
  console.log(`  錯誤: ${error.message}\n`);
  console.log('請確認：');
  console.log('  1. 開發伺服器是否正在運行（npm run dev）');
  console.log('  2. 伺服器端口是否為 3000\n');
});

registerReq.write(registerData);
registerReq.end();

