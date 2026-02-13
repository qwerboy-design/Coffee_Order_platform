'use client';

import Image from 'next/image';
import type { Product } from '@/types/product';
import type { GrindOption } from '@/types/product';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/format';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [selectedGrind, setSelectedGrind] = useState<GrindOption>(
    product.grind_option || 'none'
  );
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((state) => state.addItem);

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      alert('庫存不足');
      return;
    }
    addItem(product, quantity, selectedGrind);
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
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-coffee-500">
            {formatCurrency(product.price)}
          </span>
          <span
            className={`text-sm font-medium ${
              product.stock > 0 ? 'text-coral-500' : 'text-red-600'
            }`}
          >
            庫存: {product.stock}
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
                const maxQuantity = Math.max(1, product.stock);
                const clampedValue = Math.max(1, Math.min(maxQuantity, inputValue));
                setQuantity(clampedValue);
                if (inputValue > maxQuantity) {
                  alert(`數量不能超過庫存 ${product.stock}`);
                }
              }}
              min="1"
              max={product.stock}
              className="w-16 text-center border-2 border-coral-500 text-coral-500 font-semibold rounded py-1 focus:outline-none focus:ring-2 focus:ring-coral-300"
            />
            <button
              onClick={() => {
                const maxQuantity = Math.max(1, product.stock);
                if (quantity >= maxQuantity) {
                  alert(`數量不能超過庫存 ${product.stock}`);
                  return;
                }
                setQuantity(Math.min(maxQuantity, quantity + 1));
              }}
              disabled={quantity >= product.stock}
              className="w-8 h-8 border-2 border-coral-500 text-coral-500 rounded flex items-center justify-center hover:bg-coral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !product.is_active}
          className="w-full bg-button-500 text-white py-2 rounded-md hover:bg-button-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg border-2 border-button-600"
        >
          {product.stock === 0 ? '缺貨' : '加入購物車'}
        </button>
      </div>
    </div>
  );
}
