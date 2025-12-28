'use client';

import Image from 'next/image';
import type { Product } from '@/types/product';
import type { GrindOption } from '@/types/order';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/format';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/customer/ProductCard.tsx:14',message:'ProductCard render with product (single-select)',data:{productId:product.id,grindOption:product.grind_option,grindOptionType:typeof product.grind_option},timestamp:Date.now(),sessionId:'debug-session',runId:'single-select',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-amber-600">
            {formatCurrency(product.price)}
          </span>
          <span
            className={`text-sm ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            庫存: {product.stock}
          </span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">研磨選項</label>
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

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">數量</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max={product.stock}
              className="w-16 text-center border border-gray-300 rounded py-1"
            />
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || !product.is_active}
          className="w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {product.stock === 0 ? '缺貨' : '加入購物車'}
        </button>
      </div>
    </div>
  );
}

