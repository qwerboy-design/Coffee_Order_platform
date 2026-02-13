export type GrindOption = 'none' | 'hand_drip' | 'espresso';

/** 前台規格選項值（來自 product_option_values） */
export interface ProductOptionValue {
  id: string;
  name: string;
  image_url?: string | null;
}

/** 前台規格選項（來自 product_options + product_option_values） */
export interface ProductOption {
  id: string;
  name: string;
  values: ProductOptionValue[];
}

/** 前台變體（來自 product_variants，options 為 option_id -> value_id） */
export interface ProductVariant {
  id: string;
  price: number;
  stock: number;
  is_active: boolean;
  options: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock: number;
  grind_option: GrindOption;
  is_active: boolean;
  category_slug?: string;
  category_name?: string;
  created_at?: string;
  updated_at?: string;
  /** 多規格時選中的 variant（加入購物車用） */
  variant_id?: string;
  /** 規格選項（有則前台顯示規格下拉） */
  options?: ProductOption[];
  /** 規格變體（有則依選擇顯示對應價格/庫存） */
  variants?: ProductVariant[];
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock: number;
  grind_option: GrindOption;
  is_active?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  stock?: number;
  grind_option?: GrindOption;
  is_active?: boolean;
}

