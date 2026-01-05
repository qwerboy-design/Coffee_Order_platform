#!/usr/bin/env node

/**
 * Email 發送測試腳本
 * 測試 Resend API 和 OTP 發送功能
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('==============================================');
console.log('  Email 發送功能測試');
console.log('==============================================\n');

// 1. 檢查環境變數
console.log('[1/4] 檢查環境變數...');
const envVars = {
  'RESEND_API_KEY': process.env.RESEND_API_KEY,
  'RESEND_FROM_EMAIL': process.env.RESEND_FROM_EMAIL,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'JWT_SECRET': process.env.JWT_SECRET,
};

let allEnvSet = true;
for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    console.log(`  ✅ ${key}: 已設定`);
  } else {
    console.log(`  ❌ ${key}: 未設定`);
    allEnvSet = false;
  }
}

if (!allEnvSet) {
  console.log('\n❌ 部分環境變數未設定，請檢查 .env.local 檔案');
  process.exit(1);
}

console.log('\n✅ 所有環境變數檢查通過\n');

// 2. 測試 Resend API 連線
console.log('[2/4] 測試 Resend API 連線...');

const testResendAPI = () => {
  return new Promise((resolve, reject) => {
    // 在測試模式下，Resend 只允許發送到註冊帳號的 Email
    // 如果需要測試其他 Email，請先在 resend.com/domains 驗證網域
    const payload = {
      from: process.env.RESEND_FROM_EMAIL,
      to: ['qwerboy@gmail.com'],  // 使用註冊帳號的 Email
      subject: '測試 - 咖啡豆訂單系統',
      html: '<p>這是一封測試信件，用於驗證 Resend API 連線。</p>'
    };
    
    const data = JSON.stringify(payload);

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
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
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('  ✅ Resend API 連線成功');
          console.log(`  回應: ${responseData}`);
          resolve(JSON.parse(responseData));
        } else {
          console.log(`  ❌ Resend API 回應錯誤 (${res.statusCode})`);
          console.log(`  錯誤: ${responseData}`);
          reject(new Error(`API Error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('  ❌ Resend API 連線失敗');
      console.log(`  錯誤: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// 3. 測試註冊 API
const testRegisterAPI = () => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const testData = JSON.stringify({
      email: `test${timestamp}@example.com`,
      name: `測試用戶${timestamp}`,
      phone: `09${String(timestamp).slice(-8)}`
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
      }
    };

    console.log('\n[3/4] 測試註冊 API...');
    console.log(`  測試 Email: test${timestamp}@example.com`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('  ✅ 註冊 API 回應成功');
          console.log(`  回應: ${responseData}`);
          resolve(JSON.parse(responseData));
        } else {
          console.log(`  ❌ 註冊 API 回應錯誤 (${res.statusCode})`);
          console.log(`  錯誤: ${responseData}`);
          reject(new Error(`API Error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('  ⚠️  註冊 API 連線失敗（開發伺服器可能未啟動）');
      console.log(`  錯誤: ${error.message}`);
      console.log('\n  提示: 請先執行 "npm run dev" 啟動開發伺服器');
      resolve(null);
    });

    req.write(testData);
    req.end();
  });
};

// 執行測試
(async () => {
  try {
    // 測試 Resend API
    await testResendAPI();
    
    console.log('\n✅ Resend API 測試通過\n');
    
    // 測試註冊 API（可選，需要開發伺服器運行）
    await testRegisterAPI();
    
    console.log('\n==============================================');
    console.log('  ✅ 所有測試完成');
    console.log('==============================================\n');
    
    console.log('下一步：');
    console.log('  1. 啟動開發伺服器：npm run dev');
    console.log('  2. 開啟註冊頁面：http://localhost:3000/register');
    console.log('  3. 填寫表單並提交');
    console.log('  4. 檢查 Email 收件匣（包含垃圾信件）\n');
    
  } catch (error) {
    console.log('\n❌ 測試失敗');
    console.log(`錯誤: ${error.message}\n`);
    process.exit(1);
  }
})();

