import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
import { getProductCategories } from '@/lib/supabase/categories';
import ProductForm from '../_components/ProductForm';

interface EditProductPageProps {
    params: {
        id: string;
    };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const { id } = params;

    const { data: product, error } = await supabaseAdmin
        .from('products')
        .select(`
      *,
      options:product_options(
        id,
        name,
        position,
        values:product_option_values(
          id,
          name,
          image_url,
          position
        )
      ),
      variants:product_variants(*)
    `)
        .eq('id', id)
        .single();

    if (error || !product) {
        notFound();
    }

    // Transform data for form
    const options = product.options || [];
    options.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

    const optionIdToName: Record<string, string> = {};
    const valueIdToName: Record<string, string> = {};

    options.forEach((opt: any) => {
        optionIdToName[opt.id] = opt.name;
        if (opt.values) {
            opt.values.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
            opt.values.forEach((val: any) => {
                valueIdToName[val.id] = val.name;
            });
        }
    });

    const variants = product.variants?.map((v: any) => {
        const newOptions: Record<string, string> = {};
        if (v.options) {
            Object.entries(v.options).forEach(([optId, valId]) => {
                const optName = optionIdToName[optId];
                const valName = valueIdToName[valId as string];
                if (optName && valName) {
                    newOptions[optName] = valName;
                }
            });
        }
        return { ...v, options: newOptions };
    }) || [];

    const transformedProduct = {
        ...product,
        options,
        variants
    };

    const categories = await getProductCategories();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">編輯商品</h1>
            </div>

            <ProductForm initialData={transformedProduct} categories={categories} />
        </div>
    );
}
