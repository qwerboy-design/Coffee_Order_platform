import { Resend } from 'resend';
import { config } from '@/lib/config';

const resend = new Resend(config.resend.apiKey);

/**
 * 發送 OTP 驗證碼 Email
 * @param to 收件人 Email
 * @param otpCode 6 位數驗證碼
 */
export async function sendOTPEmail(to: string, otpCode: string): Promise<void> {
  try {
    await resend.emails.send({
      from: config.resend.fromEmail,
      to,
      subject: '您的登入驗證碼',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>登入驗證碼</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">☕ 咖啡豆訂單系統</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">您的登入驗證碼</h2>
              
              <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
                您的驗證碼為:
              </p>
              
              <div style="background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #f59e0b; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otpCode}
                </span>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                此驗證碼將於 <strong>10 分鐘</strong> 後過期。
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>⚠️ 安全提示:</strong><br>
                  如果您沒有要求此驗證碼,請忽略此信件。請勿將驗證碼分享給他人。
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              <p>此為系統自動發送的信件,請勿回覆。</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('無法發送驗證碼 Email,請稍後再試');
  }
}

/**
 * 發送訂單確認 Email 給買家
 * @param order 訂單資料
 */
export async function sendOrderEmailToBuyer(order: any): Promise<void> {
  try {
    const orderItemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.grind_option === 'none' ? '不研磨' : item.grind_option === 'hand_drip' ? '手沖' : '義式'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">NT$ ${item.unit_price.toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">NT$ ${item.subtotal.toLocaleString()}</td>
      </tr>
    `).join('');

    await resend.emails.send({
      from: config.resend.fromEmail,
      to: order.customer_email,
      subject: `訂單確認 - ${order.order_id}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>訂單確認</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">☕ 咖啡豆訂單系統</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">感謝您的訂購!</h2>
              
              <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
                您的訂單已成功建立,以下是您的訂單詳情:
              </p>
              
              <div style="background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #f59e0b; margin-top: 0;">訂單編號</h3>
                <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 10px 0;">${order.order_id}</p>
                
                <h3 style="color: #f59e0b; margin-top: 20px;">客戶資訊</h3>
                <p style="margin: 5px 0; color: #4b5563;">姓名: ${order.customer_name}</p>
                <p style="margin: 5px 0; color: #4b5563;">電話: ${order.customer_phone}</p>
                <p style="margin: 5px 0; color: #4b5563;">Email: ${order.customer_email}</p>
                
                <h3 style="color: #f59e0b; margin-top: 20px;">取貨與付款方式</h3>
                <p style="margin: 5px 0; color: #4b5563;">取貨方式: ${order.pickup_method === 'self_pickup' ? '自取' : '宅配'}</p>
                <p style="margin: 5px 0; color: #4b5563;">付款方式: ${order.payment_method === 'cash' ? '現金' : order.payment_method === 'bank_transfer' ? '銀行轉帳' : order.payment_method === 'credit_card' ? '信用卡' : 'LINE Pay'}</p>
              </div>
              
              <h3 style="color: #1f2937; margin-top: 30px;">訂單明細</h3>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f59e0b; color: white;">
                    <th style="padding: 12px; text-align: left;">商品名稱</th>
                    <th style="padding: 12px; text-align: center;">數量</th>
                    <th style="padding: 12px; text-align: center;">研磨</th>
                    <th style="padding: 12px; text-align: right;">單價</th>
                    <th style="padding: 12px; text-align: right;">小計</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>
              
              <div style="background: white; padding: 20px; margin-top: 20px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span style="color: #4b5563;">總金額:</span>
                  <span style="font-weight: bold; color: #1f2937;">NT$ ${order.total_amount.toLocaleString()}</span>
                </div>
                ${order.discount_amount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span style="color: #4b5563;">折扣:</span>
                  <span style="color: #ef4444;">-NT$ ${order.discount_amount.toLocaleString()}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding-top: 10px; border-top: 2px solid #f59e0b;">
                  <span style="font-size: 18px; font-weight: bold; color: #1f2937;">應付金額:</span>
                  <span style="font-size: 18px; font-weight: bold; color: #f59e0b;">NT$ ${order.final_amount.toLocaleString()}</span>
                </div>
              </div>
              
              ${order.notes ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h4 style="color: #92400e; margin-top: 0;">備註</h4>
                <p style="color: #92400e; margin: 0;">${order.notes}</p>
              </div>
              ` : ''}
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-size: 14px; margin: 0;">
                  <strong>📌 提醒:</strong><br>
                  我們將盡快處理您的訂單。如有任何問題,請隨時與我們聯繫。
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              <p>此為系統自動發送的信件,請勿回覆。</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Error sending order email to buyer:', error);
    throw new Error('無法發送訂單確認 Email 給買家');
  }
}

/**
 * 發送訂單通知 Email 給賣家
 * @param order 訂單資料
 */
export async function sendOrderEmailToSeller(order: any): Promise<void> {
  try {
    const orderItemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.grind_option === 'none' ? '不研磨' : item.grind_option === 'hand_drip' ? '手沖' : '義式'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">NT$ ${item.unit_price.toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">NT$ ${item.subtotal.toLocaleString()}</td>
      </tr>
    `).join('');

    await resend.emails.send({
      from: config.resend.fromEmail,
      to: config.resend.adminEmail,
      subject: `🔔 新訂單通知 - ${order.order_id}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>新訂單通知</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔔 新訂單通知</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: bold;">
                  ✅ 您收到一筆新訂單!
                </p>
              </div>
              
              <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #10b981; margin-top: 0;">訂單編號</h3>
                <p style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 10px 0;">${order.order_id}</p>
                
                <h3 style="color: #10b981; margin-top: 20px;">客戶資訊</h3>
                <p style="margin: 5px 0; color: #4b5563;">姓名: ${order.customer_name}</p>
                <p style="margin: 5px 0; color: #4b5563;">電話: ${order.customer_phone}</p>
                <p style="margin: 5px 0; color: #4b5563;">Email: ${order.customer_email}</p>
                
                <h3 style="color: #10b981; margin-top: 20px;">取貨與付款方式</h3>
                <p style="margin: 5px 0; color: #4b5563;">取貨方式: ${order.pickup_method === 'self_pickup' ? '自取' : '宅配'}</p>
                <p style="margin: 5px 0; color: #4b5563;">付款方式: ${order.payment_method === 'cash' ? '現金' : order.payment_method === 'bank_transfer' ? '銀行轉帳' : order.payment_method === 'credit_card' ? '信用卡' : 'LINE Pay'}</p>
                
                <h3 style="color: #10b981; margin-top: 20px;">訂單狀態</h3>
                <p style="margin: 5px 0; color: #4b5563;">狀態: <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: bold;">待處理</span></p>
              </div>
              
              <h3 style="color: #1f2937; margin-top: 30px;">訂單明細</h3>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #10b981; color: white;">
                    <th style="padding: 12px; text-align: left;">商品名稱</th>
                    <th style="padding: 12px; text-align: center;">數量</th>
                    <th style="padding: 12px; text-align: center;">研磨</th>
                    <th style="padding: 12px; text-align: right;">單價</th>
                    <th style="padding: 12px; text-align: right;">小計</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>
              
              <div style="background: white; padding: 20px; margin-top: 20px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span style="color: #4b5563;">總金額:</span>
                  <span style="font-weight: bold; color: #1f2937;">NT$ ${order.total_amount.toLocaleString()}</span>
                </div>
                ${order.discount_amount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span style="color: #4b5563;">折扣:</span>
                  <span style="color: #ef4444;">-NT$ ${order.discount_amount.toLocaleString()}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding-top: 10px; border-top: 2px solid #10b981;">
                  <span style="font-size: 18px; font-weight: bold; color: #1f2937;">應收金額:</span>
                  <span style="font-size: 18px; font-weight: bold; color: #10b981;">NT$ ${order.final_amount.toLocaleString()}</span>
                </div>
              </div>
              
              ${order.notes ? `
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h4 style="color: #92400e; margin-top: 0;">客戶備註</h4>
                <p style="color: #92400e; margin: 0;">${order.notes}</p>
              </div>
              ` : ''}
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-size: 14px; margin: 0;">
                  <strong>📌 提醒:</strong><br>
                  請盡快處理此訂單,並與客戶確認取貨時間。
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
              <p>此為系統自動發送的信件,請勿回覆。</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Error sending order email to seller:', error);
    throw new Error('無法發送訂單通知 Email 給賣家');
  }
}
