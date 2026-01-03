'use client';

import { useCart } from '@/hooks/useCart';
import { formatCurrency, formatGrindOption } from '@/lib/utils/format';
import Link from 'next/link';

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">購物車是空的</p>
        <Link
          href="/"
          className="inline-block bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700"
        >
          繼續購物
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">購物車</h2>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          清空購物車
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={`${item.product.id}-${item.grind_option}-${index}`}
            className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.product.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                研磨: {formatGrindOption(item.grind_option)}
              </p>
              <p className="text-amber-600 dark:text-amber-400 font-semibold">
                {formatCurrency(item.product.price)} × {item.quantity} ={' '}
                {formatCurrency(item.product.price * item.quantity)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.grind_option, item.quantity - 1)
                  }
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-12 text-center text-gray-900 dark:text-gray-100 font-medium">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.grind_option, item.quantity + 1)
                  }
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.product.id, item.grind_option)}
                className="text-red-600 hover:text-red-700"
              >
                移除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mt-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">總計</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(getTotal())}
          </span>
        </div>
        <Link
          href="/checkout"
          className="block w-full bg-amber-600 text-white text-center py-3 rounded-md hover:bg-amber-700 transition-colors"
        >
          前往結帳
        </Link>
      </div>
    </div>
  );
}
