'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Order } from '@/types/order';
import { formatCurrency, formatOrderStatus, formatDate, formatPickupMethod, formatPaymentMethod, formatGrindOption } from '@/lib/utils/format';

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '載入訂單失敗');
        }

        setOrder(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入訂單失敗');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || '訂單不存在'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">訂單詳情</h1>
        <a
          href="/admin/orders"
          className="text-amber-600 hover:text-amber-700"
        >
          ← 返回訂單列表
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">訂單資訊</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">訂單編號</p>
            <p className="font-semibold">{order.order_id}</p>
          </div>
          <div>
            <p className="text-gray-600">狀態</p>
            <p className="font-semibold">{formatOrderStatus(order.status)}</p>
          </div>
          <div>
            <p className="text-gray-600">下單時間</p>
            <p className="font-semibold">
              {order.created_at ? formatDate(order.created_at) : '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">總金額</p>
            <p className="font-semibold text-amber-600">
              {formatCurrency(order.final_amount)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">顧客資訊</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">姓名</p>
            <p className="font-semibold">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-gray-600">電話</p>
            <p className="font-semibold">{order.customer_phone}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-semibold">{order.customer_email}</p>
          </div>
          <div>
            <p className="text-gray-600">取件方式</p>
            <p className="font-semibold">{formatPickupMethod(order.pickup_method)}</p>
          </div>
          <div>
            <p className="text-gray-600">付款方式</p>
            <p className="font-semibold">{formatPaymentMethod(order.payment_method)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">訂單明細</h2>
        <div className="space-y-4">
          {order.order_items.map((item, index) => (
            <div key={index} className="flex justify-between items-start pb-4 border-b">
              <div>
                <h3 className="font-semibold">{item.product_name}</h3>
                <p className="text-sm text-gray-600">
                  {formatGrindOption(item.grind_option)} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>總計</span>
              <span className="text-amber-600">{formatCurrency(order.final_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">備註</h2>
          <p className="text-gray-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}

