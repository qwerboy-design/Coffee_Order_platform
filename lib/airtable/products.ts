import base, { TABLES } from './client';
import type { Product, CreateProductRequest, UpdateProductRequest, GrindOption } from '@/types/product';
import { diagnoseTable } from './diagnostics';

export async function getProducts(activeOnly: boolean = true): Promise<Product[]> {
  try {
    const records = await base(TABLES.PRODUCTS)
      .select({
        filterByFormula: activeOnly ? '{is_active} = 1' : undefined,
        sort: [{ field: 'created_at', direction: 'desc' }],
      })
      .all();

    return records.map((record) => {
      const rawGrindOption = record.get('grind_option') || record.get('grind_options');
      
      // Convert to single GrindOption value
      let grindOption: GrindOption = 'none';
      if (typeof rawGrindOption === 'string' && rawGrindOption) {
        // Map Chinese labels to GrindOption values
        const labelToOption: Record<string, GrindOption> = {
          '不磨': 'none',
          '磨手沖': 'hand_drip',
          '磨義式': 'espresso',
        };
        const option = labelToOption[rawGrindOption];
        if (option) {
          grindOption = option;
        } else {
          // If not found in label map, try direct value
          const validOptions: GrindOption[] = ['none', 'hand_drip', 'espresso'];
          if (validOptions.includes(rawGrindOption as GrindOption)) {
            grindOption = rawGrindOption as GrindOption;
          }
        }
      } else if (Array.isArray(rawGrindOption) && rawGrindOption.length > 0) {
        // Handle legacy array format (backward compatibility)
        grindOption = rawGrindOption[0] as GrindOption;
      }
      
      return {
        id: record.id,
        name: record.get('name') as string,
        description: record.get('description') as string,
        price: record.get('price') as number,
        image_url: record.get('image_url') as string | undefined,
        stock: record.get('stock') as number,
        grind_option: grindOption,
        is_active: record.get('is_active') as boolean ?? true,
        created_at: record.get('created_at') as string | undefined,
        updated_at: record.get('updated_at') as string | undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    const airtableError = error as { statusCode?: number };
    
    if (airtableError?.statusCode === 404) {
      const diagnosis = await diagnoseTable(TABLES.PRODUCTS).catch(() => null);
      
      const helpfulMessage = `Table "${TABLES.PRODUCTS}" not found in Airtable Base. 

請確認：
1. 在 Airtable Base 中建立名為 "${TABLES.PRODUCTS}" 的 Table（大小寫必須完全一致）
2. Table 存在於您的 Base 中（Base ID: ${process.env.AIRTABLE_BASE_ID?.substring(0, 10)}...）
3. 您的 API Key 有權限存取此 Base

詳細設定步驟請參考 SETUP.md 文件。

診斷建議：
${diagnosis?.suggestions?.map(s => `- ${s}`).join('\n') || '無法執行診斷'}`;
      throw new Error(helpfulMessage);
    }
    
    throw new Error('Failed to fetch products');
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const record = await base(TABLES.PRODUCTS).find(id);
    const rawGrindOption = record.get('grind_option') || record.get('grind_options');
    
    // Convert to single GrindOption value
    let grindOption: GrindOption = 'none';
    if (typeof rawGrindOption === 'string' && rawGrindOption) {
      const labelToOption: Record<string, GrindOption> = {
        '不磨': 'none',
        '磨手沖': 'hand_drip',
        '磨義式': 'espresso',
      };
      const option = labelToOption[rawGrindOption];
      if (option) {
        grindOption = option;
      } else if (['none', 'hand_drip', 'espresso'].includes(rawGrindOption)) {
        grindOption = rawGrindOption as GrindOption;
      }
    } else if (Array.isArray(rawGrindOption) && rawGrindOption.length > 0) {
      grindOption = rawGrindOption[0] as GrindOption;
    }
    
    return {
      id: record.id,
      name: record.get('name') as string,
      description: record.get('description') as string,
      price: record.get('price') as number,
      image_url: record.get('image_url') as string | undefined,
      stock: record.get('stock') as number,
      grind_option: grindOption,
      is_active: record.get('is_active') as boolean ?? true,
      created_at: record.get('created_at') as string | undefined,
      updated_at: record.get('updated_at') as string | undefined,
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  try {
    const records = await base(TABLES.PRODUCTS).create([{
      fields: {
        name: data.name,
        description: data.description,
        price: data.price,
        image_url: data.image_url || '',
        stock: data.stock,
        grind_option: data.grind_option,
        is_active: data.is_active ?? true,
      }
    }]);
    const record = records[0];

    const rawGrindOption = record.get('grind_option');
    let grindOption: GrindOption = 'none';
    if (typeof rawGrindOption === 'string' && rawGrindOption) {
      const labelToOption: Record<string, GrindOption> = {
        '不磨': 'none',
        '磨手沖': 'hand_drip',
        '磨義式': 'espresso',
      };
      const option = labelToOption[rawGrindOption];
      if (option) {
        grindOption = option;
      } else if (['none', 'hand_drip', 'espresso'].includes(rawGrindOption)) {
        grindOption = rawGrindOption as GrindOption;
      }
    }

    return {
      id: record.id,
      name: record.get('name') as string,
      description: record.get('description') as string,
      price: record.get('price') as number,
      image_url: record.get('image_url') as string | undefined,
      stock: record.get('stock') as number,
      grind_option: grindOption,
      is_active: record.get('is_active') as boolean ?? true,
      created_at: record.get('created_at') as string | undefined,
      updated_at: record.get('updated_at') as string | undefined,
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest
): Promise<Product> {
  try {
    const updateFields: Record<string, unknown> = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.price !== undefined) updateFields.price = data.price;
    if (data.image_url !== undefined) updateFields.image_url = data.image_url;
    if (data.stock !== undefined) updateFields.stock = data.stock;
    if (data.grind_option !== undefined) updateFields.grind_option = data.grind_option;
    if (data.is_active !== undefined) updateFields.is_active = data.is_active;

    const record = await base(TABLES.PRODUCTS).update(id, updateFields);

    const rawGrindOption = record.get('grind_option');
    let grindOption: GrindOption = 'none';
    if (typeof rawGrindOption === 'string' && rawGrindOption) {
      const labelToOption: Record<string, GrindOption> = {
        '不磨': 'none',
        '磨手沖': 'hand_drip',
        '磨義式': 'espresso',
      };
      const option = labelToOption[rawGrindOption];
      if (option) {
        grindOption = option;
      } else if (['none', 'hand_drip', 'espresso'].includes(rawGrindOption)) {
        grindOption = rawGrindOption as GrindOption;
      }
    } else if (Array.isArray(rawGrindOption) && rawGrindOption.length > 0) {
      grindOption = (rawGrindOption as string[])[0] as GrindOption;
    }

    return {
      id: record.id,
      name: record.get('name') as string,
      description: record.get('description') as string,
      price: record.get('price') as number,
      image_url: record.get('image_url') as string | undefined,
      stock: record.get('stock') as number,
      grind_option: grindOption,
      is_active: record.get('is_active') as boolean ?? true,
      created_at: record.get('created_at') as string | undefined,
      updated_at: record.get('updated_at') as string | undefined,
    };
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
}

export async function updateProductStock(
  id: string,
  quantity: number
): Promise<void> {
  try {
    const product = await getProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.stock - quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    await base(TABLES.PRODUCTS).update(id, {
      stock: newStock,
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}
