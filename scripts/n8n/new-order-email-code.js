/**
 * n8n Code Node - 新訂單郵件處理
 * 
 * 此程式碼用於 n8n 的 Code 節點
 * 功能：接收訂單資料，生成精美的 HTML 郵件內容
 * 
 * 輸入（從 Webhook 接收）：
 * {
 *   order_id: string,
 *   customer_name: string,
 *   customer_phone: string,
 *   customer_email: string,
 *   pickup_method: string,
 *   payment_method: string,
 *   total_amount: number,
 *   final_amount: number,
 *   discount_amount?: number,
 *   order_items: Array<{
 *     product_name: string,
 *     quantity: number,
 *     unit_price: number,
 *     grind_option: string
 *   }>,
 *   notes?: string
 * }
 * 
 * 輸出：
 * {
 *   to: string,           // 收件人 email
 *   subject: string,      // 郵件主旨
 *   html: string,         // HTML 內容
 *   text: string,         // 純文字內容
 *   order_id: string,
 *   customer_name: string,
 *   customer_email: string,
 *   final_amount: number
 * }
 */

// 取得輸入資料
const order = $input.first().json;

// 格式化訂單項目為 HTML 表格行
const formatOrderItems = (items) => {
  if (!items || items.length === 0) {
    return '<tr><td colspan="4" style="text-align: center; padding: 15px;">無商品資訊</td></tr>';
  }
  
  return items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.grind_option || '原豆'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">NT$ ${item.unit_price.toLocaleString()}</td>
    </tr>
  `).join('');
};

// 格式化日期時間（台灣時區）
const formatDateTime = () => {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  return now.toLocaleString('zh-TW', options);
};

// 生成郵件 HTML 內容
const generateEmailHtml = (order) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>訂單確認 - ${order.order_id}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <!-- 標題區塊 -->
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">☕ 訂單確認</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">感謝您的訂購！</p>
  </div>
  
  <!-- 主要內容區塊 -->
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    
    <!-- 訂單編號 -->
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">訂單編號</p>
      <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #78350f;">${order.order_id}</p>
    </div>
    
    <!-- 訂單狀態 -->
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="background: #dcfce7; color: #166534; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;">✓ 訂單已成立</span>
    </div>
    
    <!-- 客戶資訊 -->
    <h3 style="color: #1f2937; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; margin-top: 25px;">📋 訂購人資訊</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; width: 30%;">姓名：</td>
        <td style="padding: 8px 0; font-weight: 500;">${order.customer_name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">電話：</td>
        <td style="padding: 8px 0;">${order.customer_phone}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Email：</td>
        <td style="padding: 8px 0;">${order.customer_email}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">取件方式：</td>
        <td style="padding: 8px 0;">${order.pickup_method}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">付款方式：</td>
        <td style="padding: 8px 0;">${order.payment_method}</td>
      </tr>
    </table>
    
    <!-- 訂單明細 -->
    <h3 style="color: #1f2937; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; margin-top: 25px;">🛒 訂單明細</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">商品名稱</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">研磨方式</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">數量</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">單價</th>
        </tr>
      </thead>
      <tbody>
        ${formatOrderItems(order.order_items)}
      </tbody>
    </table>
    
    <!-- 金額明細 -->
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">商品小計：</td>
          <td style="padding: 8px 0; text-align: right;">NT$ ${order.total_amount.toLocaleString()}</td>
        </tr>
        ${order.discount_amount && order.discount_amount > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #dc2626;">折扣優惠：</td>
          <td style="padding: 8px 0; text-align: right; color: #dc2626;">-NT$ ${order.discount_amount.toLocaleString()}</td>
        </tr>
        ` : ''}
        <tr style="border-top: 2px solid #f59e0b;">
          <td style="padding: 15px 0 8px 0; font-size: 18px; font-weight: bold; color: #1f2937;">應付金額：</td>
          <td style="padding: 15px 0 8px 0; text-align: right; font-size: 24px; font-weight: bold; color: #f59e0b;">NT$ ${order.final_amount.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <!-- 備註 -->
    ${order.notes ? `
    <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
      <p style="margin: 0; color: #92400e;"><strong>📝 備註：</strong></p>
      <p style="margin: 5px 0 0 0; color: #78350f;">${order.notes}</p>
    </div>
    ` : ''}
    
    <!-- 後續步驟 -->
    <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px;">
      <h4 style="margin: 0 0 15px 0; color: #065f46;">📍 後續步驟</h4>
      <ol style="margin: 0; padding-left: 20px; color: #047857;">
        ${order.pickup_method === '宅配' ? `
        <li style="margin-bottom: 8px;">我們將盡快處理您的訂單</li>
        <li style="margin-bottom: 8px;">商品準備完成後會以電話或 Email 通知您</li>
        <li style="margin-bottom: 8px;">宅配商品預計 2-3 個工作天送達</li>
        ` : `
        <li style="margin-bottom: 8px;">我們將盡快處理您的訂單</li>
        <li style="margin-bottom: 8px;">商品準備完成後會以電話或 Email 通知您</li>
        <li style="margin-bottom: 8px;">請於營業時間內至店面取貨</li>
        `}
      </ol>
    </div>
    
  </div>
  
  <!-- 頁尾 -->
  <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
    <p>此為系統自動發送的信件，請勿直接回覆。</p>
    <p>如有任何問題，請聯繫客服。</p>
    <p style="margin-top: 15px;">© 2026 Mike's Coffee Ordering System - 用心烘焙，品味生活</p>
  </div>
  
</body>
</html>
`;
};

// 生成純文字版本（備用）
const generatePlainText = (order) => {
  const itemsList = order.order_items?.map(item => 
    `  - ${item.product_name} (${item.grind_option || '原豆'}) x${item.quantity} = NT$${item.unit_price}`
  ).join('\n') || '  無商品資訊';
  
  return `
☕ 訂單確認通知
================

訂單編號: ${order.order_id}
訂單時間: ${formatDateTime()}

📋 訂購人資訊
--------------
姓名: ${order.customer_name}
電話: ${order.customer_phone}
Email: ${order.customer_email}
取件方式: ${order.pickup_method}
付款方式: ${order.payment_method}

🛒 訂單明細
--------------
${itemsList}

💰 金額
--------------
商品小計: NT$ ${order.total_amount.toLocaleString()}
${order.discount_amount && order.discount_amount > 0 ? `折扣優惠: -NT$ ${order.discount_amount.toLocaleString()}\n` : ''}應付金額: NT$ ${order.final_amount.toLocaleString()}

${order.notes ? `📝 備註: ${order.notes}\n` : ''}

感謝您的訂購！
咖啡豆訂單系統
`;
};

// 輸出處理後的資料
return {
  to: order.customer_email,
  subject: `[訂單確認] ${order.order_id} - 咖啡豆訂單系統`,
  html: generateEmailHtml(order),
  text: generatePlainText(order),
  order_id: order.order_id,
  customer_name: order.customer_name,
  customer_email: order.customer_email,
  final_amount: order.final_amount
};




