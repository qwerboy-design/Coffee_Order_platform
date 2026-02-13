'use client';

import Image from 'next/image';
import type { Product, GrindOption, ProductVariant } from '@/types/product';
import { useCart } from '@/hooks/useCart';
import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/format';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

/** 依選中的 option value id 找出對應的 variant */
function findVariant(variants: ProductVariant[] | undefined, selectedByOptionId: Record<string, string>): ProductVariant | null {
  if (!variants?.length || !selectedByOptionId) return null;
  const selectedEntries = Object.entries(selectedByOptionId).filter(([, v]) => v != null && v !== '');
  if (selectedEntries.length === 0) return null;
  return variants.find((v) => {
    const opts = v.options || {};
    if (Object.keys(opts).length !== selectedEntries.length) return false;
    return selectedEntries.every(([optId, valId]) => opts[optId] === valId);
  }) ?? null;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [selectedGrind, setSelectedGrind] = useState<GrindOption>(
    product.grind_option || 'none'
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedByOptionId, setSelectedByOptionId] = useState<Record<string, string>>({});
  const addItem = useCart((state) => state.addItem);

  const hasVariants = product.options?.length && product.variants?.length;
  const currentVariant = useMemo(
    () => findVariant(product.variants, selectedByOptionId),
    [product.variants, selectedByOptionId]
  );
  const displayPrice = hasVariants && currentVariant != null ? currentVariant.price : product.price;
  const displayStock = hasVariants && currentVariant != null ? currentVariant.stock : product.stock;
  const canAdd = product.is_active && displayStock > 0 && (!hasVariants || currentVariant != null) && quantity <= displayStock;

  const handleAddToCart = () => {
    if (!canAdd) {
      if (hasVariants && !currentVariant) {
        alert('請選擇規格');
        return;
      }
      if (quantity > displayStock) alert('庫存不足');
      return;
    }
    const itemToAdd: Product = currentVariant
      ? { ...product, price: currentVariant.price, stock: currentVariant.stock, variant_id: currentVariant.id }
      : product;
    addItem(itemToAdd, quantity, selectedGrind);
    alert('已加入購物車');
  };

  const grindLabels: Record<GrindOption, string> = {
    none: '不磨',
    hand_drip: '磨手沖',
    espresso: '磨義式',
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {product.image_url && (
        <div className="relative h-48 w-full">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-4">
        {product.category_name && (
          <span className="inline-block text-xs font-medium text-coffee-600 bg-coffee-50 px-2 py-0.5 rounded mb-2">
            {product.category_name}
          </span>
        )}
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {hasVariants && product.options && (
          <div className="space-y-2 mb-4">
            {product.options.map((opt) => (
              <div key={opt.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{opt.name}</label>
                <select
                  value={selectedByOptionId[opt.id] ?? ''}
                  onChange={(e) =>
                    setSelectedByOptionId((prev) => ({ ...prev, [opt.id]: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">請選擇{opt.name}</option>
                  {opt.values.map((val) => (
                    <option key={val.id} value={val.id}>{val.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-coffee-500">
            {formatCurrency(displayPrice)}
          </span>
          <span
            className={`text-sm font-medium ${
              displayStock > 0 ? 'text-coral-500' : 'text-red-600'
            }`}
          >
            庫存: {displayStock}
          </span>
        </div>

        {product.category_slug === 'coffee-beans' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">研磨選項（選填）</label>
            <select
              value={selectedGrind}
              onChange={(e) => setSelectedGrind(e.target.value as GrindOption)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="none">{grindLabels.none}</option>
              <option value="hand_drip">{grindLabels.hand_drip}</option>
              <option value="espresso">{grindLabels.espresso}</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-coral-500">數量</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 border-2 border-coral-500 text-coral-500 rounded flex items-center justify-center hover:bg-coral-50 transition-colors"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                const inputValue = parseInt(e.target.value) || 1;
                const maxQuantity = Math.max(1, displayStock);
                const clampedValue = Math.max(1, Math.min(maxQuantity, inputValue));
                setQuantity(clampedValue);
                if (inputValue > maxQuantity) {
                  alert(`數量不能超過庫存 ${displayStock}`);
                }
              }}
              min="1"
              max={displayStock}
              className="w-16 text-center border-2 border-coral-500 text-coral-500 font-semibold rounded py-1 focus:outline-none focus:ring-2 focus:ring-coral-300"
            />
            <button
              onClick={() => {
                const maxQuantity = Math.max(1, displayStock);
                if (quantity >= maxQuantity) {
                  alert(`數量不能超過庫存 ${displayStock}`);
                  return;
                }
                setQuantity(Math.min(maxQuantity, quantity + 1));
              }}
              disabled={quantity >= displayStock}
              className="w-8 h-8 border-2 border-coral-500 text-coral-500 rounded flex items-center justify-center hover:bg-coral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!canAdd}
          className="w-full bg-button-500 text-white py-2 rounded-md hover:bg-button-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg border-2 border-button-600"
        >
          {displayStock === 0 ? '缺貨' : hasVariants && !currentVariant ? '請選擇規格' : '加入購物車'}
        </button>
      </div>
    </div>
  );
}
