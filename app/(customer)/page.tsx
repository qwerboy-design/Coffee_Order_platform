import ProductCard from '@/components/customer/ProductCard';
import { getProducts } from '@/lib/supabase/products';
import type { Product } from '@/types/product';

export default async function HomePage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts(true);
  } catch (err) {
    console.error('Error fetching products:', err);
    error = err instanceof Error ? err.message : '載入商品失敗';
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">咖啡豆商品</h1>
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">目前沒有商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              priority={index < 6} // 前 6 個商品優先載入
            />
          ))}
        </div>
      )}
    </div>
  );
}
