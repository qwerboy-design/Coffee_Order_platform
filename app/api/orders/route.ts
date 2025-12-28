import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getOrders } from '@/lib/airtable/orders';
import { createOrderSchema } from '@/lib/validation/schemas';
import { triggerOrderCreatedWebhook } from '@/lib/n8n/webhook';
import type { OrderItem } from '@/types/order';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as string | undefined;
    const startDate = searchParams.get('start_date') as string | undefined;
    const endDate = searchParams.get('end_date') as string | undefined;

    const orders = await getOrders({
      status: status as any,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/orders/route.ts:30',message:'POST /api/orders entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    const body = await request.json();
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/orders/route.ts:33',message:'Request body received',data:{hasBody:!!body,orderItemsCount:body.order_items?.length,customerName:body.customer_name},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // 驗證資料
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/orders/route.ts:36',message:'Before schema validation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const validatedData = createOrderSchema.parse(body);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/orders/route.ts:38',message:'Schema validation passed',data:{validatedOrderItemsCount:validatedData.order_items.length},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // 建立訂單
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/orders/route.ts:41',message:'Before createOrder call',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion
    const order = await createOrder(validatedData);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/orders/route.ts:44',message:'createOrder success',data:{orderId:order.order_id,orderItemsCount:order.order_items.length},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion

    // 觸發 N8N Webhook（非同步，不等待結果）
    triggerOrderCreatedWebhook({
      order_id: order.order_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      pickup_method: order.pickup_method,
      payment_method: order.payment_method,
      total_amount: order.total_amount,
      final_amount: order.final_amount,
      order_items: order.order_items.map((item: OrderItem) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        grind_option: item.grind_option,
      })),
      notes: order.notes,
    }).catch((error) => {
      console.error('Webhook error (non-blocking):', error);
    });

    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error) {
    // #region agent log
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    } : { error: String(error) };
    const zodError = error as any;
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/orders/route.ts:65',message:'Error in POST /api/orders',data:{...errorData,isZodError:error instanceof Error && error.name==='ZodError',zodErrors:zodError.errors},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    
    console.error('Error creating order:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

