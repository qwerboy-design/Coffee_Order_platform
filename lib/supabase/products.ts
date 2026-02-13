import { supabase, supabaseAdmin, TABLES } from './client';
import type { Product } from '@/types/product';

/** 從 join 結果取出分類（支援 object 或 array 回傳） */
function pickCategory(record: Record<string, unknown>): { slug?: string; name?: string } | null {
  const raw = record.product_categories ?? record.category;
  if (!raw) return null;
  const pc = Array.isArray(raw) ? raw[0] : raw;
  return pc && typeof pc === 'object' && 'slug' in pc ? (pc as { slug?: string; name?: string }) : null;
}

/** 將後台 options/variants 轉成前台型別 */
function mapOptionsAndVariants(record: Record<string, unknown>): { options?: Product['options']; variants?: Product['variants'] } {
  const rawOpts = record.product_options;
  const rawVars = record.product_variants;
  const options: Product['options'] = Array.isArray(rawOpts)
    ? rawOpts
        .sort((a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0))
        .map((opt: { id: string; name: string; product_option_values?: unknown[] }) => {
          const values = Array.isArray(opt.product_option_values)
            ? opt.product_option_values
                .sort((a: { position?: number }, b: { position?: number }) => (a.position ?? 0) - (b.position ?? 0))
                .map((v: { id: string; name: string; image_url?: string | null }) => ({
                  id: v.id,
                  name: v.name,
                  image_url: v.image_url ?? undefined,
                }))
            : [];
          return { id: opt.id, name: opt.name, values };
        })
    : undefined;
  const variants: Product['variants'] = Array.isArray(rawVars)
    ? rawVars
        .filter((v: { is_active?: boolean }) => v.is_active !== false)
        .map((v: { id: string; price: number; stock: number; options?: Record<string, string> }) => ({
          id: v.id,
          price: typeof v.price === 'number' ? v.price : parseFloat(String(v.price)),
          stock: Number(v.stock) || 0,
          is_active: true,
          options: (v.options && typeof v.options === 'object') ? v.options : {},
        }))
    : undefined;
  return { options, variants };
}

/**
 * 取得所有產品（可選擇只顯示上架商品）
 * 含 product_categories、product_options、product_option_values、product_variants 供前台呈現規格
 */
export async function getProducts(activeOnly = true): Promise<Product[]> {
  try {
    let query = supabaseAdmin
      .from(TABLES.PRODUCTS)
      .select(`
        *,
        product_categories(slug, name),
        product_options(id, name, position, product_option_values(id, name, image_url, position)),
        product_variants(id, price, stock, options, is_active)
      `)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(record => {
      const images = record.images;
      const firstImageUrl = Array.isArray(images) && images[0] && typeof images[0] === 'object' && (images[0] as { url?: string }).url
        ? (images[0] as { url: string }).url
        : '';
      const pc = pickCategory(record as Record<string, unknown>);
      const { options, variants } = mapOptionsAndVariants(record as Record<string, unknown>);
      const basePrice = record.price != null ? parseFloat(String(record.price)) : 0;
      const baseStock = Number(record.stock) || 0;
      return {
        id: record.id,
        name: record.name,
        description: record.description || '',
        price: basePrice,
        image_url: record.image_url || firstImageUrl || '',
        stock: baseStock,
        grind_option: record.grind_option,
        is_active: record.is_active,
        category_slug: pc?.slug ?? undefined,
        category_name: pc?.name ?? undefined,
        created_at: record.created_at,
        updated_at: record.updated_at,
        options,
        variants,
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('無法取得產品列表');
  }
}

/**
 * 根據 ID 取得單一產品（使用 admin 以正確取得種類）
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PRODUCTS)
      .select('*, product_categories(slug, name)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 找不到記錄
      }
      throw error;
    }

    const images = data.images;
    const firstImageUrl = Array.isArray(images) && images[0] && typeof images[0] === 'object' && (images[0] as { url?: string }).url
      ? (images[0] as { url: string }).url
      : '';
    const pc = pickCategory(data as Record<string, unknown>);
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      image_url: data.image_url || firstImageUrl || '',
      stock: data.stock,
      grind_option: data.grind_option,
      is_active: data.is_active,
      category_slug: pc?.slug ?? undefined,
      category_name: pc?.name ?? undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw new Error('無法取得產品資料');
  }
}

/**
 * 檢查產品庫存是否足夠
 */
export async function checkProductStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const product = await getProductById(productId);
    
    if (!product || !product.is_active) {
      return false;
    }

    return product.stock >= quantity;
  } catch (error) {
    console.error('Error checking product stock:', error);
    return false;
  }
}

/**
 * 扣減產品庫存（使用 Admin 客戶端）
 */
export async function deductProductStock(productId: string, quantity: number): Promise<void> {
  try {
    // 使用 PostgreSQL 的原子操作扣減庫存
    const { error } = await supabaseAdmin
      .rpc('deduct_product_stock', {
        product_uuid: productId,
        quantity: quantity
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error deducting product stock:', error);
    throw new Error('扣減庫存失敗');
  }
}

/**
 * 批量檢查多個產品的庫存
 */
export async function checkMultipleProductsStock(
  items: { productId: string; quantity: number }[]
): Promise<{ available: boolean; insufficientProducts: string[] }> {
  try {
    const insufficientProducts: string[] = [];

    for (const item of items) {
      const isAvailable = await checkProductStock(item.productId, item.quantity);
      if (!isAvailable) {
        const product = await getProductById(item.productId);
        insufficientProducts.push(product?.name || item.productId);
      }
    }

    return {
      available: insufficientProducts.length === 0,
      insufficientProducts,
    };
  } catch (error) {
    console.error('Error checking multiple products stock:', error);
    throw new Error('檢查庫存失敗');
  }
}

/**
 * 建立新產品（Admin 功能）
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<Product> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PRODUCTS)
      .insert({
        name: productData.name,
        description: productData.description || null,
        price: productData.price,
        image_url: productData.image_url || null,
        stock: productData.stock,
        grind_option: productData.grind_option || 'whole_bean',
        is_active: productData.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      image_url: data.image_url || '',
      stock: data.stock,
      grind_option: data.grind_option,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('建立產品失敗');
  }
}

/**
 * 更新產品資料（Admin 功能）
 */
export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<Product> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price),
      image_url: data.image_url || '',
      stock: data.stock,
      grind_option: data.grind_option,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('更新產品失敗');
  }
}


