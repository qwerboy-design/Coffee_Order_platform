'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

export default function Header() {
  const itemCount = useCart((state) => state.getItemCount());

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-amber-800">
            ☕ 咖啡豆訂單系統
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-amber-600">
              商品
            </Link>
            <Link
              href="/cart"
              className="relative text-gray-700 hover:text-amber-600"
            >
              購物車
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <Link href="/admin/orders" className="text-gray-700 hover:text-amber-600">
              後台
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

