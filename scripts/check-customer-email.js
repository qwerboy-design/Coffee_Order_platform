#!/usr/bin/env node

/**
 * 檢查客戶 Email 是否存在於資料庫中
 * 用法: node scripts/check-customer-email.js <email>
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('錯誤：請設定 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomerEmail(email) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`\n查詢 Email: ${email}`);
    console.log(`標準化後: ${normalizedEmail}\n`);

    // 查詢客戶
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ 找不到客戶記錄');
        console.log(`\n建議：`);
        console.log(`1. 確認 Email 是否正確`);
        console.log(`2. 如果尚未註冊，請前往 http://localhost:3000/register 註冊`);
        console.log(`3. 如果已使用 OTP 註冊，請使用 OTP 登入，或前往註冊頁面設定密碼\n`);
        return;
      }
      throw error;
    }

    console.log('✅ 找到客戶記錄：');
    console.log(`  ID: ${data.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  姓名: ${data.name}`);
    console.log(`  電話: ${data.phone}`);
    console.log(`  認證方式: ${data.auth_provider || '未知'}`);
    console.log(`  有密碼雜湊: ${data.password_hash ? '是' : '否'}`);
    
    if (data.password_hash) {
      console.log(`  密碼雜湊長度: ${data.password_hash.length}`);
      console.log(`  密碼雜湊前綴: ${data.password_hash.substring(0, 20)}...`);
    } else {
      console.log(`\n⚠️  此帳號沒有設定密碼`);
      console.log(`建議：`);
      console.log(`1. 使用 OTP 驗證碼登入`);
      console.log(`2. 或前往註冊頁面，勾選「設定密碼」來設定密碼\n`);
    }

    // 查詢所有類似的 Email（大小寫變體）
    const { data: allCustomers, error: searchError } = await supabase
      .from('customers')
      .select('email, id, name')
      .ilike('email', `%${normalizedEmail.split('@')[0]}%`);

    if (!searchError && allCustomers && allCustomers.length > 0) {
      console.log(`\n相關的 Email 記錄（包含相似字串）：`);
      allCustomers.forEach(c => {
        console.log(`  - ${c.email} (ID: ${c.id}, 姓名: ${c.name})`);
      });
    }

  } catch (error) {
    console.error('❌ 查詢錯誤：', error.message);
    if (error.details) console.error('詳細資訊：', error.details);
    if (error.hint) console.error('提示：', error.hint);
  }
}

// 從命令列參數取得 Email
const email = process.argv[2];

if (!email) {
  console.error('用法: node scripts/check-customer-email.js <email>');
  console.error('範例: node scripts/check-customer-email.js qwerboy@gmail.com');
  process.exit(1);
}

checkCustomerEmail(email).then(() => {
  process.exit(0);
});
