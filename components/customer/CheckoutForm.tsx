'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutFormSchema } from '@/lib/validation/schemas';
import { useCart } from '@/hooks/useCart';
import { formatCurrency, formatGrindOption } from '@/lib/utils/format';
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
    resolver: zodResolver(checkoutFormSchema),
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
  }, [items, setValue]);

  const onSubmit = async (data: CreateOrderRequest) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 檢查購物車
      if (!items || items.length === 0) {
        setError('購物車是空的，請先加入商品');
        setIsSubmitting(false);
        return;
      }

      const total = getTotal();
      const orderData: CreateOrderRequest = {
        ...data,
        total_amount: total,
        discount_amount: 0,
        final_amount: total,
        order_items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          grind_option: item.grind_option,
        })),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      let responseText = '';
      try {
        responseText = await response.clone().text();
      } catch {
        // Ignore text extraction errors
      }

      if (!response.ok) {
        if (responseText && responseText.length > 0) {
          try {
            const errorResult = JSON.parse(responseText);
            throw new Error(errorResult.error || `HTTP ${response.status}: ${response.statusText}`);
          } catch {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      if (responseText.length === 0) {
        throw new Error('伺服器回應為空，請稍後再試');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error('伺服器回應格式錯誤，請稍後再試');
      }

      if (!result.success) {
        throw new Error(result.error || '訂單建立失敗');
      }

      // 清空購物車
      clearCart();

      // 導向訂單追蹤頁
      router.push(`/order/${result.data.order_id}`);
    } catch (err) {
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
          className="inline-block bg-button-500 text-white px-6 py-2 rounded-md hover:bg-button-600"
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
              <span className="text-coffee-500">{formatCurrency(getTotal())}</span>
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
              <p className="text-red-600 text-sm mt-1">{errors.customer_name.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">電話 *</label>
            <input
              {...register('customer_phone')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.customer_phone && (
              <p className="text-red-600 text-sm mt-1">{errors.customer_phone.message as string}</p>
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
              <p className="text-red-600 text-sm mt-1">{errors.customer_email.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">取件方式 *</label>
            <select
              {...register('pickup_method')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="self_pickup">自取</option>
              <option value="home_delivery">外送</option>
            </select>
            {errors.pickup_method && (
              <p className="text-red-600 text-sm mt-1">{errors.pickup_method.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">付款方式 *</label>
            <select
              {...register('payment_method')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="cash">現金</option>
              <option value="bank_transfer">轉帳</option>
              <option value="credit_card">信用卡</option>
              <option value="line_pay">LINE Pay</option>
            </select>
            {errors.payment_method && (
              <p className="text-red-600 text-sm mt-1">{errors.payment_method.message as string}</p>
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
            className="w-full bg-button-500 text-white py-3 rounded-md hover:bg-button-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '處理中...' : '送出訂單'}
          </button>
        </form>
      </div>
    </div>
  );
}
