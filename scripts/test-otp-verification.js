#!/usr/bin/env node

/**
 * OTP 驗證測試腳本
 * 測試完整的 OTP 發送和驗證流程
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('==============================================');
console.log('  OTP 驗證測試工具');
console.log('==============================================\n');

// 從 Supabase 獲取最新的 OTP
async function getLatestOTP(email) {
  return new Promise((resolve, reject) => {
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
            
            console.log('✅ 找到最新的 OTP：');
            console.log(`  驗證碼: ${otp.otp_code}`);
            console.log(`  Email: ${otp.email}`);
            console.log(`  狀態: ${otp.is_used ? '已使用' : (isExpired ? '已過期' : '有效')}`);
            console.log(`  建立時間: ${new Date(otp.created_at).toLocaleString('zh-TW')}`);
            console.log(`  過期時間: ${new Date(otp.expires_at).toLocaleString('zh-TW')}\n`);
            
            resolve(otp);
          } else {
            console.log('⚠️  找不到未使用的 OTP\n');
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

// 發送 OTP
async function sendOTP(email) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ email });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/send-otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('📤 發送 OTP 請求...\n');

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`回應狀態: ${res.statusCode}`);
        console.log(`回應內容: ${responseData}\n`);
        
        if (res.statusCode === 200) {
          console.log('✅ OTP 發送成功\n');
          resolve(true);
        } else {
          console.log('❌ OTP 發送失敗\n');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 連線失敗（請確認開發伺服器已啟動）');
      console.log(`錯誤: ${error.message}\n`);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// 驗證 OTP
async function verifyOTP(email, otpCode) {
  return new Promise((resolve, reject) => {
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

    console.log('🔐 驗證 OTP...\n');

    const req = https.request(options, (res) => {
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
async function main() {
  try {
    // 1. 詢問 Email
    const email = await new Promise((resolve) => {
      rl.question('請輸入 Email (預設: qwerboy@gmail.com): ', (answer) => {
        resolve(answer.trim() || 'qwerboy@gmail.com');
      });
    });

    console.log(`\n使用 Email: ${email}\n`);
    console.log('==============================================\n');

    // 2. 選擇操作
    console.log('請選擇操作：');
    console.log('  1. 發送新的 OTP');
    console.log('  2. 查看現有的 OTP');
    console.log('  3. 驗證 OTP');
    console.log('  4. 完整測試（發送 + 驗證）\n');

    const choice = await new Promise((resolve) => {
      rl.question('請輸入選項 (1-4): ', (answer) => {
        resolve(answer.trim());
      });
    });

    console.log('\n==============================================\n');

    switch (choice) {
      case '1':
        // 發送 OTP
        await sendOTP(email);
        console.log('提示: 請檢查 Email 收件匣（包含垃圾郵件）');
        console.log('      或使用選項 2 查看資料庫中的 OTP');
        break;

      case '2':
        // 查看 OTP
        await getLatestOTP(email);
        break;

      case '3':
        // 驗證 OTP
        const otpCode = await new Promise((resolve) => {
          rl.question('請輸入 OTP 驗證碼: ', (answer) => {
            resolve(answer.trim());
          });
        });
        console.log('');
        await verifyOTP(email, otpCode);
        break;

      case '4':
        // 完整測試
        console.log('步驟 1: 發送 OTP\n');
        const sent = await sendOTP(email);
        
        if (sent) {
          console.log('等待 2 秒...\n');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('步驟 2: 查詢 OTP\n');
          const otp = await getLatestOTP(email);
          
          if (otp && !otp.is_used) {
            console.log('步驟 3: 驗證 OTP\n');
            await verifyOTP(email, otp.otp_code);
          } else {
            console.log('❌ 無法取得有效的 OTP');
          }
        }
        break;

      default:
        console.log('無效的選項');
    }

    console.log('\n==============================================');
    console.log('測試完成');
    console.log('==============================================\n');

  } catch (error) {
    console.error('\n❌ 測試過程發生錯誤');
    console.error(`錯誤: ${error.message}\n`);
  } finally {
    rl.close();
  }
}

// 執行
main();




