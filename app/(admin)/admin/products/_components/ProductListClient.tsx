'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { deleteProduct } from '@/app/actions/admin/products';
import { useToast } from '@/components/ui/Toaster';
import { useRouter } from 'next/navigation';

export default function ProductListClient({ products }: { products: any[] }) {
    const { success, error } = useToast();
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此商品嗎？')) return;

        setDeletingId(id);
        try {
            const res = await deleteProduct(id);
            if (res.success) {
                success('刪除成功');
                router.refresh(); // Refresh server data
            } else {
                error(res.error || '刪除失敗');
            }
        } catch (e) {
            error('發生錯誤');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        圖片
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        價格 / 規格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        庫存
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                    const hasVariants = product.variants && product.variants.length > 0;
                    const imageUrl = product.images?.[0]?.url;

                    return (
                        <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded" />
                                ) : (
                                    <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">無圖</div>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                {hasVariants && (
                                    <div className="text-xs text-gray-500">
                                        多規格: {product.options?.map((o: any) => o.name).join(', ')}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {hasVariants ? (
                                    <span>${Math.min(...product.variants.map((v: any) => v.price))} ~ ${Math.max(...product.variants.map((v: any) => v.price))}</span>
                                ) : (
                                    <span>${product.price}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {hasVariants ? (
                                    <span>{product.variants.reduce((a: number, b: any) => a + b.stock, 0)} (總和)</span>
                                ) : (
                                    <span>{product.stock}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {product.is_active ? '上架中' : '下架'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/admin/products/${product.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center">
                                    <Edit size={16} className="mr-1" /> 編輯
                                </Link>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    disabled={deletingId === product.id}
                                    className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50"
                                >
                                    <Trash2 size={16} className="mr-1" /> 刪除
                                </button>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    );
}
