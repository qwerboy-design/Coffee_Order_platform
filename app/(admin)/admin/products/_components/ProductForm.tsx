'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProduct, updateProduct } from '@/app/actions/admin/products';
import { ProductOption, ProductVariant, AdminProduct, CreateProductInput } from '@/types/admin-product';
import ImageUpload from '@/components/ui/ImageUpload';
import VariantManager from './VariantManager';
import { useToast } from '@/components/ui/Toaster';

const productSchema = z.object({
    name: z.string().min(1, '商品名稱為必填'),
    description: z.string().optional(),
    price: z.number().min(0, '價格不能小於 0'),
    stock: z.number().min(0, '庫存不能小於 0'),
    // category_id: z.string().optional(),
});

interface ProductFormProps {
    initialData?: AdminProduct;
}

export default function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const { toast, error: toastError, success } = useToast();
    const [loading, setLoading] = useState(false);

    const [images, setImages] = useState<string[]>(initialData?.images?.map(i => i.url) || []);
    const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '');

    const [enableVariants, setEnableVariants] = useState(initialData && initialData.options?.length > 0);
    const [options, setOptions] = useState<ProductOption[]>(initialData?.options || []);
    const [variants, setVariants] = useState<ProductVariant[]>(initialData?.variants || []);

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            price: initialData?.price || 0,
            stock: initialData?.stock || 0,
        },
        mode: 'onSubmit' // Validate on submit
    });

    const basePrice = watch('price');
    const baseStock = watch('stock');

    const onSubmit = async (data: any) => {
        if (images.length === 0) {
            toastError('請至少上傳一張商品圖片');
            return;
        }

        setLoading(true);

        try {
            const input: CreateProductInput = {
                name: data.name,
                description: data.description,
                price: data.price,
                stock: enableVariants ? variants.reduce((acc, v) => acc + v.stock, 0) : data.stock,
                images: images.map((url, idx) => ({ url, is_cover: idx === 0 })),
                video_url: videoUrl,
                is_active: true,
                options: enableVariants ? options : [],
                variants: enableVariants ? variants : [],
                category_id: initialData?.category_id
            };

            let result;
            if (initialData?.id) {
                result = await updateProduct(initialData.id, input);
            } else {
                result = await createProduct(input);
            }

            if (result.success) {
                success(initialData?.id ? '商品更新成功！' : '商品建立成功！');
                router.push('/admin/products');
                router.refresh();
            } else {
                toastError(result.error || (initialData?.id ? '更新失敗' : '建立失敗'));
            }

        } catch (err) {
            console.error(err);
            toastError('發生錯誤');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Images */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-medium mb-4">商品圖片</h3>
                            <ImageUpload
                                value={images}
                                onChange={setImages}
                                maxFiles={9}
                            />
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-medium mb-4">商品影片</h3>
                            <input
                                type="text"
                                placeholder="YouTube 影片網址"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Right Column: Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                            <h3 className="text-lg font-medium mb-4">基本資訊</h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">商品名稱</label>
                                    <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-coffee-500 focus:border-coffee-500" />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">商品描述</label>
                                    <textarea {...register('description')} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-coffee-500 focus:border-coffee-500" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">銷售資訊</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 font-medium">開啟多規格</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableVariants}
                                            onChange={(e) => setEnableVariants(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-coffee-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coffee-600"></div>
                                    </label>
                                </div>
                            </div>

                            {enableVariants ? (
                                <VariantManager
                                    initialOptions={options}
                                    initialVariants={variants}
                                    basePrice={basePrice}
                                    baseStock={baseStock}
                                    onOptionsChange={setOptions}
                                    onVariantsChange={setVariants}
                                />
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">價格</label>
                                        <div className="relative mt-1 rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-gray-500 sm:text-sm">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                {...register('price', { valueAsNumber: true })}
                                                className="block w-full rounded-md border-gray-300 pl-7 pr-3 focus:border-coffee-500 focus:ring-coffee-500 sm:text-sm p-2 border"
                                            />
                                        </div>
                                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message as string}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">商品數量</label>
                                        <input
                                            type="number"
                                            {...register('stock', { valueAsNumber: true })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-coffee-500 focus:ring-coffee-500 sm:text-sm p-2 border"
                                        />
                                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message as string}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coffee-500"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 text-sm font-medium text-white bg-coffee-600 rounded-md hover:bg-coffee-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coffee-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                            >
                                {loading ? '儲存中...' : '儲存商品'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
