'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema } from '@/lib/validation/schemas';
import { useCart } from '@/hooks/useCart';
import { formatCurrency, formatPickupMethod, formatPaymentMethod, formatGrindOption } from '@/lib/utils/format';
import type { CreateOrderRequest } from '@/types/order';
import { useRouter } from 'next/navigation';

export default function CheckoutForm() {
  const { items, getTotal, clearCart } = useCart();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderRequest>({
    resolver: zodResolver(createOrderSchema),
  });

  // Set order_items from cart items when component mounts or items change
  useEffect(() => {
    const orderItems = items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
      grind_option: item.grind_option,
    }));
    setValue('order_items', orderItems);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:30',message:'order_items set from cart',data:{orderItemsCount:orderItems.length,orderItems},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, [items, setValue]);

  // #region agent log
  // Log form validation errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:38',message:'Form validation errors',data:{errors:Object.keys(errors).map(k=>({field:k,message:errors[k as keyof typeof errors]?.message}))},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A'})}).catch(()=>{});
    }
  }, [errors]);
  // #endregion

  const onSubmit = async (data: CreateOrderRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:26',message:'onSubmit called',data:{formData:data,itemsCount:items.length,items:items.map(i=>({productId:i.product.id,productName:i.product.name,quantity:i.quantity,grindOption:i.grind_option}))},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A,C'})}).catch(()=>{});
      // #endregion
      
      // 準備訂單資料
      const orderData: CreateOrderRequest = {
        ...data,
        order_items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          grind_option: item.grind_option,
        })),
      };

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:40',message:'Order data prepared',data:{orderData,orderItemsCount:orderData.order_items.length,orderItems:orderData.order_items},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:43',message:'Before API request',data:{url:'/api/orders',method:'POST'},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:51',message:'API response received',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      const result = await response.json();

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:54',message:'API result parsed',data:{success:result.success,error:result.error,hasData:!!result.data,orderId:result.data?.order_id},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (!result.success) {
        throw new Error(result.error || '訂單建立失敗');
      }

      // 清空購物車
      clearCart();

      // 導向訂單追蹤頁
      router.push(`/order/${result.data.order_id}`);
    } catch (err) {
      // #region agent log
      const errorData = err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: err.stack?.substring(0, 300)
      } : { error: String(err) };
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:62',message:'Error in onSubmit',data:errorData,timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion
      setError(err instanceof Error ? err.message : '訂單建立失敗，請稍後再試');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">購物車是空的</p>
        <a
          href="/"
          className="inline-block bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700"
        >
          繼續購物
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">訂單摘要</h2>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {items.map((item, index) => (
            <div
              key={`${item.product.id}-${item.grind_option}-${index}`}
              className="flex justify-between items-start pb-4 border-b"
            >
              <div>
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-sm text-gray-600">
                  {formatGrindOption(item.grind_option)} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold">
                {formatCurrency(item.product.price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>總計</span>
              <span className="text-amber-600">{formatCurrency(getTotal())}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">顧客資訊</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">姓名 *</label>
            <input
              {...register('customer_name')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.customer_name && (
              <p className="text-red-600 text-sm mt-1">{errors.customer_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">電話 *</label>
            <input
              {...register('customer_phone')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.customer_phone && (
              <p className="text-red-600 text-sm mt-1">{errors.customer_phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              {...register('customer_email')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.customer_email && (
              <p className="text-red-600 text-sm mt-1">{errors.customer_email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">取件方式 *</label>
            <select
              {...register('pickup_method')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="self_pickup">自取</option>
              <option value="delivery">外送</option>
            </select>
            {errors.pickup_method && (
              <p className="text-red-600 text-sm mt-1">{errors.pickup_method.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">付款方式 *</label>
            <select
              {...register('payment_method')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="cash">現金</option>
              <option value="transfer">轉帳</option>
              <option value="credit_card">信用卡</option>
            </select>
            {errors.payment_method && (
              <p className="text-red-600 text-sm mt-1">{errors.payment_method.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">備註</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => {
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/CheckoutForm.tsx:193',message:'Submit button clicked',data:{isSubmitting,itemsCount:items.length,hasErrors:Object.keys(errors).length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'order-submit',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
            }}
            className="w-full bg-amber-600 text-white py-3 rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '處理中...' : '送出訂單'}
          </button>
        </form>
      </div>
    </div>
  );
}

