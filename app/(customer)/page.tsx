'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/customer/ProductCard';
import type { Product } from '@/types/product';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?active_only=true');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '載入商品失敗');
        }

        setProducts(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入商品失敗');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">咖啡豆商品</h1>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">目前沒有商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
