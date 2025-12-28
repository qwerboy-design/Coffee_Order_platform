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
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:12',message:'fetchProducts started',data:{url:'/api/products?active_only=true'},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      try {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:15',message:'Before fetch API',data:{url:'/api/products?active_only=true'},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const response = await fetch('/api/products?active_only=true');
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:18',message:'API response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        const result = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:22',message:'API result parsed',data:{success:result.success,hasData:!!result.data,productCount:result.data?.length,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (!result.success) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:26',message:'API returned error',data:{error:result.error,success:result.success},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          throw new Error(result.error || '載入商品失敗');
        }

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:30',message:'Received products from API (single-select)',data:{productCount:result.data?.length,firstProductGrindOption:result.data?.[0]?.grind_option,firstProductGrindOptionType:typeof result.data?.[0]?.grind_option,firstProductId:result.data?.[0]?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'single-select',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        setProducts(result.data);
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:33',message:'Products set to state',data:{productCount:result.data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:36',message:'Error in fetchProducts',data:{error:err instanceof Error ? err.message : String(err),errorType:err instanceof Error ? err.name : typeof err},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setError(err instanceof Error ? err.message : '載入商品失敗');
      } finally {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(customer)/page.tsx:40',message:'fetchProducts finally block',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'page-load',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
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

