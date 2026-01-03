'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/types/order';
import { formatCurrency, formatOrderStatus, formatDate } from '@/lib/utils/format';
import { formatPickupMethod, formatPaymentMethod } from '@/lib/utils/format';

interface OrderTableProps {
  orders: Order[];
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

export default function OrderTable({ orders, onStatusUpdate }: OrderTableProps) {
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          updated_by: 'admin',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '更新失敗');
      }

      if (onStatusUpdate) {
        onStatusUpdate(orderId, newStatus);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '更新失敗');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">目前沒有訂單</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                訂單編號
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                顧客資訊
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                下單時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.order_id}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{order.customer_name}</div>
                  <div className="text-sm text-gray-500">{order.customer_phone}</div>
                  <div className="text-sm text-gray-500">{order.customer_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(order.final_amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPickupMethod(order.pickup_method)} /{' '}
                    {formatPaymentMethod(order.payment_method)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {formatOrderStatus(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.created_at ? formatDate(order.created_at) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id!, e.target.value)}
                    disabled={updating[order.id!]}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="pending">待處理</option>
                    <option value="processing">製作中</option>
                    <option value="completed">已完成</option>
                    <option value="picked_up">已取貨</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}











