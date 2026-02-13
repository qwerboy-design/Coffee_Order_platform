import { getProductCategories } from '@/lib/supabase/categories';
import ProductForm from '../_components/ProductForm';

export default async function NewProductPage() {
    const categories = await getProductCategories();
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">新增商品</h1>
                <p className="mt-1 text-sm text-gray-500">
                    填寫下方資訊以建立新商品。
                </p>
            </div>

            <ProductForm categories={categories} />
        </div>
    );
}
