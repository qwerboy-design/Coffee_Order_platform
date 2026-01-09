#!/usr/bin/env node

/**
 * 註冊流程診斷腳本
 * 檢查註冊、OTP 和 Email 發送的完整流程
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');

console.log('==============================================');
console.log('  註冊流程診斷工具');
console.log('==============================================\n');

// 測試用的資料
const timestamp = Date.now();
const testData = {
  email: 'qwerboy@gmail.com',  // 使用已驗證的 Email
  name: `測試用戶${timestamp}`,
  phone: `09${String(timestamp).slice(-8)}`
};

console.log('測試資料：');
console.log(`  Email: ${testData.email}`);
console.log(`  姓名: ${testData.name}`);
console.log(`  電話: ${testData.phone}\n`);

// 檢查 Supabase 連線
async function checkSupabaseConnection() {
  return new Promise((resolve, reject) => {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    console.log('[1/5] 檢查 Supabase 連線...');
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('  ✅ Supabase 連線成功\n');
        resolve(true);
      } else {
        console.log(`  ❌ Supabase 連線失敗 (${res.statusCode})\n`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('  ❌ Supabase 連線失敗');
      console.log(`  錯誤: ${error.message}\n`);
      resolve(false);
    });

    req.end();
  });
}

// 檢查客戶資料
async function checkCustomerData(email) {
  return new Promise((resolve, reject) => {
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

    console.log('[2/5] 檢查客戶資料...');
    
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (data.length > 0) {
            console.log('  ✅ 找到客戶資料');
            console.log(`  客戶 ID: ${data[0].id}`);
            console.log(`  姓名: ${data[0].name}`);
            console.log(`  Email: ${data[0].email}`);
            console.log(`  電話: ${data[0].phone}\n`);
            resolve(data[0]);
          } else {
            console.log('  ⚠️  找不到客戶資料');
            console.log('  提示: 請確認註冊是否成功\n');
            resolve(null);
          }
        } catch (error) {
          console.log('  ❌ 解析回應失敗');
          console.log(`  錯誤: ${error.message}\n`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('  ❌ 查詢失敗');
      console.log(`  錯誤: ${error.message}\n`);
      resolve(null);
    });

    req.end();
  });
}

// 檢查 OTP 記錄
async function checkOTPRecords(email) {
  return new Promise((resolve, reject) => {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: `/rest/v1/otp_tokens?email=eq.${encodeURIComponent(email.toLowerCase())}&order=created_at.desc&limit=5`,
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('[3/5] 檢查 OTP 記錄...');
    
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (data.length > 0) {
            console.log(`  ✅ 找到 ${data.length} 筆 OTP 記錄\n`);
            console.log('  最近的 OTP 記錄：');
            data.slice(0, 3).forEach((otp, index) => {
              const isExpired = new Date(otp.expires_at) < new Date();
              const status = otp.is_used ? '已使用' : (isExpired ? '已過期' : '有效');
              console.log(`  ${index + 1}. 驗證碼: ${otp.otp_code}`);
              console.log(`     狀態: ${status}`);
              console.log(`     建立時間: ${new Date(otp.created_at).toLocaleString('zh-TW')}`);
              console.log(`     過期時間: ${new Date(otp.expires_at).toLocaleString('zh-TW')}`);
              console.log('');
            });
            resolve(data);
          } else {
            console.log('  ⚠️  找不到 OTP 記錄');
            console.log('  提示: OTP 可能未成功建立\n');
            resolve([]);
          }
        } catch (error) {
          console.log('  ❌ 解析回應失敗');
          console.log(`  錯誤: ${error.message}\n`);
          resolve([]);
        }
      });
    });

    req.on('error', (error) => {
      console.log('  ❌ 查詢失敗');
      console.log(`  錯誤: ${error.message}\n`);
      resolve([]);
    });

    req.end();
  });
}

// 測試 Resend Email
async function testResendEmail(email) {
  return new Promise((resolve, reject) => {
    const payload = {
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      subject: '診斷測試 - 咖啡豆訂單系統',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🔍 診斷測試郵件</h2>
          <p>這是一封由診斷腳本發送的測試郵件。</p>
          <p>如果您收到這封郵件，表示 Resend Email 功能正常運作。</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            發送時間: ${new Date().toLocaleString('zh-TW')}
          </p>
        </div>
      `
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

    console.log('[4/5] 測試 Resend Email 發送...');
    
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const result = JSON.parse(responseData);
          console.log('  ✅ 測試郵件發送成功');
          console.log(`  Email ID: ${result.id}`);
          console.log(`  收件人: ${email}`);
          console.log('  請檢查您的信箱（包含垃圾郵件）\n');
          resolve(true);
        } else {
          console.log(`  ❌ 發送失敗 (${res.statusCode})`);
          console.log(`  錯誤: ${responseData}\n`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('  ❌ 發送失敗');
      console.log(`  錯誤: ${error.message}\n`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// 診斷總結
function printSummary(results) {
  console.log('[5/5] 診斷總結\n');
  console.log('==============================================');
  console.log('  診斷結果');
  console.log('==============================================\n');

  if (results.customer && results.otpRecords.length > 0 && results.emailSent) {
    console.log('✅ 所有檢查通過');
    console.log('\n可能的問題：');
    console.log('  1. Email 進入垃圾郵件匣');
    console.log('  2. Resend 傳送延遲（通常 1-2 分鐘內送達）');
    console.log('  3. Email 地址輸入錯誤（大小寫敏感）');
  } else {
    console.log('⚠️  發現問題\n');
    
    if (!results.customer) {
      console.log('❌ 問題 1: 客戶資料未建立');
      console.log('   解決方案: 檢查註冊 API 是否正常運作');
      console.log('   提示: 啟動開發伺服器後訪問 http://localhost:3000/register\n');
    }
    
    if (results.otpRecords.length === 0) {
      console.log('❌ 問題 2: OTP 記錄未建立');
      console.log('   解決方案: 檢查 createOTPToken 函數是否正常');
      console.log('   提示: 查看伺服器控制台的錯誤訊息\n');
    }
    
    if (!results.emailSent) {
      console.log('❌ 問題 3: Email 發送失敗');
      console.log('   解決方案: 檢查 Resend API Key 和設定');
      console.log('   提示: 確認 RESEND_API_KEY 和 RESEND_FROM_EMAIL 正確\n');
    }
  }

  console.log('==============================================\n');
  console.log('建議的下一步：');
  console.log('  1. 啟動開發伺服器: npm run dev');
  console.log('  2. 開啟註冊頁面: http://localhost:3000/register');
  console.log('  3. 使用測試 Email 註冊: qwerboy@gmail.com');
  console.log('  4. 觀察瀏覽器控制台和終端機的錯誤訊息');
  console.log('  5. 檢查 Email 收件匣（包含垃圾郵件）\n');
}

// 執行診斷
(async () => {
  try {
    const results = {
      supabaseConnected: false,
      customer: null,
      otpRecords: [],
      emailSent: false
    };

    // 執行各項檢查
    results.supabaseConnected = await checkSupabaseConnection();
    results.customer = await checkCustomerData(testData.email);
    results.otpRecords = await checkOTPRecords(testData.email);
    results.emailSent = await testResendEmail(testData.email);

    // 顯示診斷總結
    printSummary(results);

  } catch (error) {
    console.error('\n❌ 診斷過程發生錯誤');
    console.error(`錯誤: ${error.message}\n`);
    process.exit(1);
  }
})();





