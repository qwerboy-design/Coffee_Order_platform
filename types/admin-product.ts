export interface ProductImage {
    url: string;
    alt?: string;
    is_cover?: boolean;
}

export interface ProductOptionValue {
    id?: string;
    name: string;
    image_url?: string;
    position?: number;
}

export interface ProductOption {
    id?: string;
    name: string;
    position?: number;
    values: ProductOptionValue[];
}

export interface ProductVariant {
    id?: string;
    sku?: string;
    price: number;
    stock: number;
    is_active: boolean;
    options: Record<string, string>; // e.g. { "顏色": "紅色", "尺寸": "S" }
}

export interface AdminProduct {
    id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    images: ProductImage[];
    video_url?: string;
    is_active: boolean;
    category_id?: string;

    options: ProductOption[];
    variants: ProductVariant[];

    created_at?: string;
    updated_at?: string;
}

export interface CreateProductInput {
    name: string;
    description?: string;
    price: number;
    stock: number;
    images: ProductImage[];
    video_url?: string;
    is_active?: boolean;
    category_id?: string;

    options: ProductOption[];
    variants: ProductVariant[];
}
