import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/client';
import { Plus } from 'lucide-react';
import ProductListClient from '@/app/(admin)/admin/products/_components/ProductListClient';

export default async function ProductsPage() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*, variants:product_variants(*), options:product_options(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 container mx-auto px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-coffee-600 text-white px-4 py-2 rounded hover:bg-coffee-700"
        >
          <Plus size={20} /> 新增商品
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ProductListClient products={products || []} />
      </div>
    </div>
  );
}
