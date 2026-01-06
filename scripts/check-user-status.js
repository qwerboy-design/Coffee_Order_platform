#!/usr/bin/env node

/**
 * 檢查用戶狀態腳本
 * 查詢用戶在資料庫中的完整狀態
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('==============================================');
console.log('  用戶狀態檢查工具');
console.log('==============================================\n');

// 查詢客戶資料
async function checkCustomer(email) {
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

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          resolve(data.length > 0 ? data[0] : null);
        } catch (error) {
          console.log('❌ 解析回應失敗:', error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 查詢失敗:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// 查詢 OTP 記錄
async function checkOTPs(email) {
  return new Promise((resolve) => {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: `/rest/v1/otp_tokens?email=eq.${encodeURIComponent(email.toLowerCase())}&order=created_at.desc&limit=10`,
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
          resolve(data);
        } catch (error) {
          console.log('❌ 解析回應失敗:', error.message);
          resolve([]);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ 查詢失敗:', error.message);
      resolve([]);
    });

    req.end();
  });
}

// 刪除客戶記錄
async function deleteCustomer(customerId) {
  return new Promise((resolve) => {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: `/rest/v1/customers?id=eq.${customerId}`,
      method: 'DELETE',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 204) {
        console.log('✅ 客戶記錄已刪除\n');
        resolve(true);
      } else {
        console.log(`❌ 刪除失敗 (${res.statusCode})\n`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('❌ 刪除失敗:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// 刪除 OTP 記錄
async function deleteOTPs(email) {
  return new Promise((resolve) => {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const options = {
      hostname: supabaseUrl.hostname,
      port: 443,
      path: `/rest/v1/otp_tokens?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      method: 'DELETE',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 204) {
        console.log('✅ OTP 記錄已刪除\n');
        resolve(true);
      } else {
        console.log(`❌ 刪除失敗 (${res.statusCode})\n`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('❌ 刪除失敗:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// 顯示用戶狀態
function displayCustomerStatus(customer) {
  if (!customer) {
    console.log('❌ 找不到客戶記錄\n');
    return;
  }

  console.log('✅ 客戶資料：');
  console.log(`  ID: ${customer.id}`);
  console.log(`  姓名: ${customer.name}`);
  console.log(`  Email: ${customer.email}`);
  console.log(`  電話: ${customer.phone}`);
  console.log(`  認證方式: ${customer.auth_provider || 'otp'}`);
  console.log(`  Email 已驗證: ${customer.email_verified ? '是' : '否'}`);
  console.log(`  建立時間: ${new Date(customer.created_at).toLocaleString('zh-TW')}`);
  
  if (customer.last_login_at) {
    console.log(`  最後登入: ${new Date(customer.last_login_at).toLocaleString('zh-TW')}`);
  }
  
  console.log('');
}

// 顯示 OTP 狀態
function displayOTPStatus(otps) {
  if (otps.length === 0) {
    console.log('⚠️  找不到 OTP 記錄\n');
    return;
  }

  console.log(`✅ 找到 ${otps.length} 筆 OTP 記錄：\n`);
  
  otps.forEach((otp, index) => {
    const isExpired = new Date(otp.expires_at) < new Date();
    const status = otp.is_used ? '✓ 已使用' : (isExpired ? '✗ 已過期' : '● 有效');
    
    console.log(`${index + 1}. 驗證碼: ${otp.otp_code}`);
    console.log(`   狀態: ${status}`);
    console.log(`   建立時間: ${new Date(otp.created_at).toLocaleString('zh-TW')}`);
    console.log(`   過期時間: ${new Date(otp.expires_at).toLocaleString('zh-TW')}`);
    console.log('');
  });
}

// 主流程
async function main() {
  try {
    // 1. 詢問 Email
    const email = await new Promise((resolve) => {
      rl.question('請輸入要檢查的 Email (預設: qwerboy@gmail.com): ', (answer) => {
        resolve(answer.trim() || 'qwerboy@gmail.com');
      });
    });

    console.log(`\n檢查 Email: ${email}\n`);
    console.log('==============================================\n');

    // 2. 查詢客戶資料
    console.log('[1/2] 查詢客戶資料...\n');
    const customer = await checkCustomer(email);
    displayCustomerStatus(customer);

    // 3. 查詢 OTP 記錄
    console.log('[2/2] 查詢 OTP 記錄...\n');
    const otps = await checkOTPs(email);
    displayOTPStatus(otps);

    console.log('==============================================\n');

    // 4. 提供操作選項
    if (customer || otps.length > 0) {
      console.log('可用操作：');
      if (customer) console.log('  1. 刪除客戶記錄（重新開始註冊）');
      if (otps.length > 0) console.log('  2. 刪除 OTP 記錄（清理舊驗證碼）');
      if (customer && otps.length > 0) console.log('  3. 刪除所有記錄（完全重置）');
      console.log('  0. 不執行任何操作\n');

      const choice = await new Promise((resolve) => {
        rl.question('請選擇操作 (0-3): ', (answer) => {
          resolve(answer.trim());
        });
      });

      console.log('\n==============================================\n');

      switch (choice) {
        case '1':
          if (customer) {
            console.log('⚠️  警告: 刪除客戶記錄將無法復原！\n');
            const confirm = await new Promise((resolve) => {
              rl.question('確定要刪除嗎？(yes/no): ', (answer) => {
                resolve(answer.trim().toLowerCase());
              });
            });

            if (confirm === 'yes') {
              console.log('\n刪除客戶記錄...\n');
              await deleteCustomer(customer.id);
            } else {
              console.log('\n已取消操作\n');
            }
          }
          break;

        case '2':
          if (otps.length > 0) {
            console.log('刪除 OTP 記錄...\n');
            await deleteOTPs(email);
          }
          break;

        case '3':
          if (customer && otps.length > 0) {
            console.log('⚠️  警告: 將刪除所有相關記錄！\n');
            const confirm = await new Promise((resolve) => {
              rl.question('確定要刪除嗎？(yes/no): ', (answer) => {
                resolve(answer.trim().toLowerCase());
              });
            });

            if (confirm === 'yes') {
              console.log('\n刪除所有記錄...\n');
              await deleteOTPs(email);
              await deleteCustomer(customer.id);
              console.log('✅ 所有記錄已刪除，可以重新註冊\n');
            } else {
              console.log('\n已取消操作\n');
            }
          }
          break;

        case '0':
        default:
          console.log('不執行任何操作\n');
          break;
      }
    }

    console.log('==============================================');
    console.log('檢查完成');
    console.log('==============================================\n');

  } catch (error) {
    console.error('\n❌ 檢查過程發生錯誤');
    console.error(`錯誤: ${error.message}\n`);
  } finally {
    rl.close();
  }
}

// 執行
main();




