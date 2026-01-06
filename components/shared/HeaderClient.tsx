'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useState, useEffect } from 'react';

export function HeaderClient() {
  const itemCount = useCart((state) => state.getItemCount());
  const [isMounted, setIsMounted] = useState(false);
  const [hydratedItemCount, setHydratedItemCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setHydratedItemCount(itemCount);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setHydratedItemCount(itemCount);
    }
  }, [itemCount, isMounted]);

  const displayCount = isMounted ? hydratedItemCount : 0;
  const shouldRenderBadge = isMounted && displayCount > 0;

  return (
    <>
      <Link
        href="/cart"
        className="relative text-gray-700 hover:text-coffee-600"
      >
        購物車
        {shouldRenderBadge && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {displayCount}
          </span>
        )}
      </Link>
      <Link href="/admin/orders" className="text-gray-700 hover:text-coffee-600">
        後台
      </Link>
    </>
  );
}
