import { supabaseAdmin } from './client';

export interface ProductCategoryOption {
  id: string;
  name: string;
  slug: string;
}

/** 後台「商品選項」僅顯示此四類（slug 需與 migration 011 一致） */
const PRODUCT_OPTION_SLUGS = ['food', '3c', 'tools', 'coffee-beans'] as const;

/**
 * 取得商品選項（供後台商品選項必填下拉使用）
 * 只回傳：食品、3C、器具、咖啡豆
 */
export async function getProductCategories(): Promise<ProductCategoryOption[]> {
  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .in('slug', [...PRODUCT_OPTION_SLUGS])
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching product categories:', error);
    return [];
  }
  return data || [];
}
