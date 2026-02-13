export type GrindOption = 'none' | 'hand_drip' | 'espresso';

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

