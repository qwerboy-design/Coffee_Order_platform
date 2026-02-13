'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { ProductOption, ProductOptionValue, ProductVariant } from '@/types/admin-product';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/components/ui/Toaster';

interface VariantManagerProps {
    initialOptions?: ProductOption[];
    initialVariants?: ProductVariant[];
    basePrice: number;
    baseStock: number;
    onOptionsChange: (options: ProductOption[]) => void;
    onVariantsChange: (variants: ProductVariant[]) => void;
}

export default function VariantManager({
    initialOptions = [],
    initialVariants = [],
    basePrice,
    baseStock,
    onOptionsChange,
    onVariantsChange,
}: VariantManagerProps) {
    const [options, setOptions] = useState<ProductOption[]>(initialOptions);
    const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
    const { error } = useToast();

    // Update variants when options change
    useEffect(() => {
        generateVariants();
    }, [options]);

    const addOption = () => {
        if (options.length >= 2) {
            error('最多只能設定 2 層規格');
            return;
        }
        setOptions([...options, { name: '', values: [] }]);
    };

    const updateOptionName = (index: number, name: string) => {
        const newOptions = [...options];
        newOptions[index].name = name;
        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    const removeOption = (index: number) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    const addOptionValue = (optionIndex: number, valueName: string) => {
        if (!valueName.trim()) return;

        const newOptions = [...options];
        // Check duplicate
        if (newOptions[optionIndex].values.some(v => v.name === valueName)) {
            error('選項值名稱重複');
            return;
        }

        newOptions[optionIndex].values.push({ name: valueName });
        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    const removeOptionValue = (optionIndex: number, valueIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    const updateOptionValueImage = (optionIndex: number, valueIndex: number, url: string) => {
        const newOptions = [...options];
        newOptions[optionIndex].values[valueIndex].image_url = url;
        setOptions(newOptions);
        onOptionsChange(newOptions);
    };

    const generateVariants = () => {
        // Cartesian product
        if (options.length === 0 || options.some(o => o.values.length === 0)) {
            setVariants([]);
            onVariantsChange([]);
            return;
        }

        const cartesian = (arrays: any[]) => {
            return arrays.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())), [[]]);
        };

        // Prepare arrays of values for cartesian product
        // We store { optName: valName } pairs
        const optionArrays = options.map(opt => opt.values.map(val => ({ [opt.name]: val.name })));

        // If only 1 option, cartesian helper might behave differently if not handled
        // Actually the helper expects arrays of items.
        // Let's simplify logic:

        let combinations: Record<string, string>[] = [];

        if (options.length === 1) {
            combinations = options[0].values.map(v => ({ [options[0].name]: v.name }));
        } else if (options.length === 2) {
            options[0].values.forEach(v1 => {
                options[1].values.forEach(v2 => {
                    combinations.push({
                        [options[0].name]: v1.name,
                        [options[1].name]: v2.name
                    });
                });
            });
        }

        // Smart merge with existing variants to preserve price/stock
        const newVariants = combinations.map(combo => {
            // Find existing variant with same options
            const existing = variants.find(v => {
                // Compare object equality
                const keys1 = Object.keys(v.options).sort();
                const keys2 = Object.keys(combo).sort();
                if (JSON.stringify(keys1) !== JSON.stringify(keys2)) return false;
                return keys1.every(key => v.options[key] === combo[key]);
            });

            if (existing) return existing;

            return {
                price: basePrice,
                stock: baseStock,
                is_active: true,
                options: combo,
                sku: ''
            } as ProductVariant;
        });

        setVariants(newVariants);
        onVariantsChange(newVariants);
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
        onVariantsChange(newVariants);
    };

    const applyBatch = (field: 'price' | 'stock' | 'sku', value: any) => {
        const newVariants = variants.map(v => ({ ...v, [field]: value }));
        setVariants(newVariants);
        onVariantsChange(newVariants);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">規格設定 (最多 2 層)</label>
                {options.map((option, optIdx) => (
                    <div key={optIdx} className="p-4 bg-gray-50 rounded-lg relative border border-gray-200">
                        <button
                            type="button"
                            onClick={() => removeOption(optIdx)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                            <X size={16} />
                        </button>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">規格名稱 (例如：顏色)</label>
                                <input
                                    type="text"
                                    value={option.name}
                                    onChange={(e) => updateOptionName(optIdx, e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-coffee-500 focus:ring-coffee-500 sm:text-sm p-2 border"
                                    placeholder="輸入規格名稱"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">規格選項 (Enter 新增)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {option.values.map((val, valIdx) => (
                                        <div key={valIdx} className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm">
                                                <span>{val.name}</span>
                                                <button type="button" onClick={() => removeOptionValue(optIdx, valIdx)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                                            </div>
                                            {/* Only allow image for first option (usually Color) */}
                                            {optIdx === 0 && (
                                                <div className="mt-1">
                                                    {val.image_url ? (
                                                        <div className="relative w-8 h-8 group">
                                                            <img src={val.image_url} alt={val.name} className="w-full h-full object-cover rounded" />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateOptionValueImage(optIdx, valIdx, '')}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                                                            >
                                                                <X size={8} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 border border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-100 relative">
                                                            <ImageIcon size={12} className="text-gray-400" />
                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                onChange={async (e) => {
                                                                    if (e.target.files?.[0]) {
                                                                        // Quick upload implementation inside component
                                                                        // Ideally extract this or use ImageUpload
                                                                        const formData = new FormData();
                                                                        formData.append('file', e.target.files[0]);
                                                                        const { uploadImage } = await import('@/app/actions/upload');
                                                                        const res = await uploadImage(formData);
                                                                        if (res.success && res.url) updateOptionValueImage(optIdx, valIdx, res.url);
                                                                        else error('上傳失敗');
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <input
                                        type="text"
                                        className="border-gray-300 shadow-sm focus:border-coffee-500 focus:ring-coffee-500 sm:text-sm p-1 border rounded w-32"
                                        placeholder="輸入後按 Enter"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addOptionValue(optIdx, e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {options.length < 2 && (
                    <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-2 text-coffee-600 hover:text-coffee-700 font-medium"
                    >
                        <Plus size={16} /> 新增規格 (最多 2 層)
                    </button>
                )}
            </div>

            {/* Variant Table */}
            {variants.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-700">規格明細 ({variants.length})</h3>
                        <div className="flex gap-2">
                            <input type="number" placeholder="批次價格" className="text-sm border rounded p-1 w-20" id="batch-price" />
                            <button type="button" onClick={() => applyBatch('price', Number((document.getElementById('batch-price') as HTMLInputElement).value))} className="text-xs bg-gray-200 px-2 rounded">套用價格</button>
                            <input type="number" placeholder="批次庫存" className="text-sm border rounded p-1 w-20" id="batch-stock" />
                            <button type="button" onClick={() => applyBatch('stock', Number((document.getElementById('batch-stock') as HTMLInputElement).value))} className="text-xs bg-gray-200 px-2 rounded">套用庫存</button>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {options.map(opt => <th key={opt.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{opt.name}</th>)}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">價格</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">庫存</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {variants.map((variant, idx) => (
                                <tr key={idx}>
                                    {options.map(opt => (
                                        <td key={opt.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {variant.options[opt.name]}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))}
                                            className="w-24 border rounded p-1"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))}
                                            className="w-24 border rounded p-1"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={variant.sku || ''}
                                            onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                                            className="w-32 border rounded p-1"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={variant.is_active}
                                            onChange={(e) => updateVariant(idx, 'is_active', e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
