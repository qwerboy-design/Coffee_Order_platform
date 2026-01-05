#!/usr/bin/env node

/**
 * Resend API Key 檢查工具
 * 協助診斷 API Key 設定問題
 */

require('dotenv').config({ path: '.env.local' });

console.log('==============================================');
console.log('  Resend API Key 診斷工具');
console.log('==============================================\n');

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

console.log('檢查項目：\n');

// 1. API Key 是否存在
if (!apiKey) {
  console.log('❌ RESEND_API_KEY 未設定');
  console.log('\n請在 .env.local 中設定：');
  console.log('RESEND_API_KEY=re_xxxxxxxxxxxxx\n');
  process.exit(1);
} else {
  console.log('✅ RESEND_API_KEY 已設定');
}

// 2. API Key 格式檢查
if (!apiKey.startsWith('re_')) {
  console.log('⚠️  API Key 格式可能不正確');
  console.log('   正確格式應以 "re_" 開頭');
} else {
  console.log('✅ API Key 格式正確（以 re_ 開頭）');
}

// 3. API Key 長度檢查
console.log(`✅ API Key 長度: ${apiKey.length} 字元`);

// 4. 發送者 Email 檢查
if (!fromEmail) {
  console.log('❌ RESEND_FROM_EMAIL 未設定');
} else {
  console.log(`✅ RESEND_FROM_EMAIL: ${fromEmail}`);
  
  // Email 格式檢查
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(fromEmail)) {
    console.log('⚠️  Email 格式可能不正確');
  }
}

console.log('\n==============================================');
console.log('診斷資訊：');
console.log('==============================================\n');

console.log('API Key 前綴:', apiKey.substring(0, 10) + '...');
console.log('API Key 長度:', apiKey.length);

console.log('\n可能的問題：');
console.log('1. API Key 複製時包含了多餘的空格或換行');
console.log('2. API Key 已過期或被撤銷');
console.log('3. API Key 在 Resend Dashboard 中已刪除');
console.log('4. .env.local 中有特殊字元需要用引號包裹');

console.log('\n解決方式：');
console.log('1. 前往 Resend Dashboard: https://resend.com/api-keys');
console.log('2. 建立新的 API Key');
console.log('3. 複製完整的 Key（確保沒有空格）');
console.log('4. 更新 .env.local:');
console.log('   RESEND_API_KEY=re_xxxxxxxxxxxxx');
console.log('5. 重新執行測試: node scripts/test-email.js\n');

