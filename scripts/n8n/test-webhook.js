/**
 * n8n Webhook 測試腳本
 * 用於測試新訂單郵件通知工作流程
 * 
 * 使用方式：
 *   node test-webhook.js
 * 
 * 環境變數：
 *   N8N_WEBHOOK_URL - n8n Webhook URL
 *   N8N_WEBHOOK_SECRET - Webhook 密鑰（可選）
 *   TEST_EMAIL - 測試收件人 Email
 */

require('dotenv').config({ path: '../../.env.local' });

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;
const TEST_EMAIL = process.env.TEST_EMAIL || 'qwerboy@gmail.com';

// 測試訂單資料
const testOrderPayload = {
  order_id: `TEST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  customer_name: '測試用戶',
  customer_phone: '0912345678',
  customer_email: TEST_EMAIL,
  pickup_method: '自取',
  payment_method: '現金',
  total_amount: 1280,
  final_amount: 1180,
  discount_amount: 100,
  order_items: [
    {
      product_name: '衣索比亞 耶加雪菲 G1',
      quantity: 2,
      unit_price: 450,
      grind_option: '細研磨（手沖）'
    },
    {
      product_name: '哥倫比亞 薇拉莊園',
      quantity: 1,
      unit_price: 380,
      grind_option: '原豆（不磨）'
    }
  ],
  notes: '這是一筆測試訂單，請忽略'
};

async function testWebhook() {
  console.log('========================================');
  console.log('🧪 n8n Webhook 測試');
  console.log('========================================\n');

  // 檢查環境變數
  if (!N8N_WEBHOOK_URL) {
    console.error('❌ 錯誤: N8N_WEBHOOK_URL 未設定');
    console.log('\n請在 .env.local 中設定 N8N_WEBHOOK_URL');
    console.log('例如: N8N_WEBHOOK_URL=https://qwerboy.app.n8n.cloud/webhook/xxxxxxxx');
    process.exit(1);
  }

  console.log('📧 測試收件人:', TEST_EMAIL);
  console.log('🔗 Webhook URL:', N8N_WEBHOOK_URL);
  console.log('🔐 使用密鑰:', N8N_WEBHOOK_SECRET ? '是' : '否');
  console.log('\n📦 測試訂單資料:');
  console.log('  訂單編號:', testOrderPayload.order_id);
  console.log('  客戶姓名:', testOrderPayload.customer_name);
  console.log('  商品數量:', testOrderPayload.order_items.length, '項');
  console.log('  應付金額: NT$', testOrderPayload.final_amount);
  console.log('\n');

  try {
    console.log('🚀 發送 Webhook 請求...\n');

    const headers = {
      'Content-Type': 'application/json',
    };

    if (N8N_WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = N8N_WEBHOOK_SECRET;
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(testOrderPayload),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log('📨 回應狀態:', response.status, response.statusText);
    console.log('📄 回應內容:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Webhook 觸發成功！');
      console.log(`\n📬 請檢查 ${TEST_EMAIL} 是否收到訂單確認郵件`);
    } else {
      console.log('\n⚠️ Webhook 回傳非成功狀態');
      console.log('請檢查 n8n 工作流程是否正確設定');
    }

  } catch (error) {
    console.error('\n❌ 發送失敗:', error.message);
    
    if (error.cause) {
      console.error('原因:', error.cause);
    }
    
    console.log('\n可能的問題:');
    console.log('1. N8N_WEBHOOK_URL 不正確');
    console.log('2. n8n 工作流程未啟用');
    console.log('3. 網路連線問題');
  }

  console.log('\n========================================');
}

// 執行測試
testWebhook();





