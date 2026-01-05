#!/usr/bin/env node

/**
 * 完整流程測試腳本
 * 測試註冊 -> OTP 發送 -> OTP 驗證的完整流程
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const http = require('http');

console.log('==============================================');
console.log('  完整註冊驗證流程測試');
console.log('==============================================\n');

const timestamp = Date.now();
const testData = {
  email: `test${timestamp}@example.com`,
  name: `測試用戶${timestamp}`,
  phone: `09${String(timestamp).slice(-8)}`
};

console.log('測試資料：');
console.log(`  Email: ${testData.email}`);
console.log(`  姓名: ${testData.name}`);
console.log(`  電話: ${testData.phone}\n`);

// 步驟 1: 註冊
async function testRegister() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(testData);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('[1/4] 測試註冊 API...\n');

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`回應狀態: ${res.statusCode}`);
        console.log(`回應內容: ${responseData}\n`);
        
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200) {
            console.log('✅ 註冊成功');
            console.log(`  客戶 ID: ${result.data.customerId}`);
            console.log(`  Email: ${result.data.email}\n`);
            resolve(result.data);
          } else {
            console.log('❌ 註冊失敗\n');
            resolve(null);
          }
        } catch (error) {
          console.log('❌ 解析回應失敗\n');
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 連線失敗（請確認開發伺服器已啟動）');
      console.log(`錯誤: ${error.message}\n`);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

// 步驟 2: 查詢客戶記錄
async function checkCustomerInDB(email) {
  return new Promise((resolve) => {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: `/rest/v1/customers?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('[2/4] 檢查資料庫中的客戶記錄...\n');

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (data.length > 0) {
            const customer = data[0];
            console.log('✅ 找到客戶記錄');
            console.log(`  ID: ${customer.id}`);
            console.log(`  姓名: ${customer.name}`);
            console.log(`  Email: ${customer.email}`);
            console.log(`  電話: ${customer.phone}\n`);
            resolve(customer);
          } else {
            console.log('❌ 找不到客戶記錄');
            console.log('  這是問題的根源！客戶記錄未成功建立。\n');
            resolve(null);
          }
        } catch (error) {
          console.log('❌ 解析回應失敗');
          console.log(`錯誤: ${error.message}\n`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 查詢失敗');
      console.log(`錯誤: ${error.message}\n`);
      resolve(null);
    });

    req.end();
  });
}

// 步驟 3: 查詢 OTP 記錄
async function checkOTPInDB(email) {
  return new Promise((resolve) => {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: `/rest/v1/otp_tokens?email=eq.${encodeURIComponent(email.toLowerCase())}&is_used=eq.false&order=created_at.desc&limit=1`,
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('[3/4] 檢查資料庫中的 OTP 記錄...\n');

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (data.length > 0) {
            const otp = data[0];
            const isExpired = new Date(otp.expires_at) < new Date();
            console.log('✅ 找到 OTP 記錄');
            console.log(`  驗證碼: ${otp.otp_code}`);
            console.log(`  Email: ${otp.email}`);
            console.log(`  狀態: ${otp.is_used ? '已使用' : (isExpired ? '已過期' : '有效')}\n`);
            resolve(otp);
          } else {
            console.log('❌ 找不到 OTP 記錄\n');
            resolve(null);
          }
        } catch (error) {
          console.log('❌ 解析回應失敗');
          console.log(`錯誤: ${error.message}\n`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 查詢失敗');
      console.log(`錯誤: ${error.message}\n`);
      resolve(null);
    });

    req.end();
  });
}

// 步驟 4: 驗證 OTP
async function testVerifyOTP(email, otpCode) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ 
      email: email,
      otp_code: otpCode 
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/verify-otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('[4/4] 測試 OTP 驗證...\n');

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`回應狀態: ${res.statusCode}`);
        console.log(`回應內容: ${responseData}\n`);
        
        if (res.statusCode === 200) {
          console.log('✅ OTP 驗證成功\n');
          resolve(true);
        } else {
          console.log('❌ OTP 驗證失敗\n');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 連線失敗');
      console.log(`錯誤: ${error.message}\n`);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// 主流程
(async () => {
  try {
    console.log('開始測試...\n');
    console.log('==============================================\n');

    // 1. 註冊
    const registerResult = await testRegister();
    if (!registerResult) {
      console.log('❌ 註冊失敗，無法繼續測試');
      console.log('\n提示: 請確認開發伺服器已啟動 (npm run dev)\n');
      process.exit(1);
    }

    // 等待 1 秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 檢查客戶記錄
    const customer = await checkCustomerInDB(testData.email);
    
    // 3. 檢查 OTP 記錄
    const otp = await checkOTPInDB(testData.email);

    // 4. 如果都存在，測試驗證
    if (customer && otp && !otp.is_used) {
      await testVerifyOTP(testData.email, otp.otp_code);
    } else {
      console.log('⚠️  無法進行 OTP 驗證測試\n');
      
      if (!customer) {
        console.log('原因: 客戶記錄不存在');
        console.log('這就是「用戶不存在」錯誤的根本原因！\n');
      }
      
      if (!otp) {
        console.log('原因: OTP 記錄不存在\n');
      }
      
      if (otp && otp.is_used) {
        console.log('原因: OTP 已使用\n');
      }
    }

    console.log('==============================================');
    console.log('  測試總結');
    console.log('==============================================\n');

    console.log('檢查項目：');
    console.log(`  註冊 API: ${registerResult ? '✅' : '❌'}`);
    console.log(`  客戶記錄: ${customer ? '✅' : '❌'}`);
    console.log(`  OTP 記錄: ${otp ? '✅' : '❌'}`);
    
    if (!customer && otp) {
      console.log('\n⚠️  發現問題：');
      console.log('  OTP 記錄存在但客戶記錄不存在！');
      console.log('  這表示 createOrUpdateCustomer 函數可能失敗了。\n');
      console.log('解決方案：');
      console.log('  1. 檢查 Supabase 資料庫連線');
      console.log('  2. 檢查 customers 表的權限設定');
      console.log('  3. 查看開發伺服器控制台的錯誤訊息');
    } else if (customer && otp) {
      console.log('\n✅ 所有記錄正常建立');
      console.log('   如果仍然出現「用戶不存在」錯誤，');
      console.log('   可能是 Email 大小寫不一致的問題。\n');
    }

    console.log('\n==============================================\n');

  } catch (error) {
    console.error('\n❌ 測試過程發生錯誤');
    console.error(`錯誤: ${error.message}\n`);
    process.exit(1);
  }
})();

