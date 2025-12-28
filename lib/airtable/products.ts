import base, { TABLES } from './client';
import type { Product, CreateProductRequest, UpdateProductRequest, GrindOption } from '@/types/product';
import { diagnoseTable } from './diagnostics';

export async function getProducts(activeOnly: boolean = true): Promise<Product[]> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/products.ts:5',message:'getProducts entry',data:{activeOnly,tableName:TABLES.PRODUCTS},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/products.ts:8',message:'Before base() call',data:{tableName:TABLES.PRODUCTS},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const records = await base(TABLES.PRODUCTS)
      .select({
        filterByFormula: activeOnly ? '{is_active} = 1' : undefined,
        sort: [{ field: 'created_at', direction: 'desc' }],
      })
      .all();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/products.ts:15',message:'After base() call success',data:{recordCount:records.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return records.map((record) => {
      // #region agent log
      const rawGrindOption = record.get('grind_option') || record.get('grind_options');
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/products.ts:23',message:'Raw grind_option from Airtable',data:{productId:record.id,productName:record.get('name'),rawGrindOption,rawType:typeof rawGrindOption,isArray:Array.isArray(rawGrindOption),isString:typeof rawGrindOption==='string',isNull:rawGrindOption===null,isUndefined:rawGrindOption===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'single-select',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
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
      
      const product = {
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
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/products.ts:50',message:'Product mapped with grind_option (single-select)',data:{productId:product.id,grindOption:product.grind_option,grindOptionType:typeof product.grind_option},timestamp:Date.now(),sessionId:'debug-session',runId:'single-select',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return product;
    });
  } catch (error) {
    // #region agent log
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200)
    } : { error: String(error) };
    const airtableError = error as any;
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/airtable/products.ts:28',message:'Error in getProducts',data:{...errorData,airtableError:airtableError.error,airtableStatusCode:airtableError.statusCode,tableName:TABLES.PRODUCTS},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A,B,C,D'})}).catch(()=>{});
    // #endregion

    console.error('Error fetching products:', error);
    
    // 提供更詳細的錯誤訊息和診斷
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
    const record = await base(TABLES.PRODUCTS).create({
      name: data.name,
      description: data.description,
      price: data.price,
      image_url: data.image_url || '',
      stock: data.stock,
      grind_option: data.grind_option,
      is_active: data.is_active ?? true,
    });

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
    const updateFields: any = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.price !== undefined) updateFields.price = data.price;
    if (data.image_url !== undefined) updateFields.image_url = data.image_url;
    if (data.stock !== undefined) updateFields.stock = data.stock;
    if (data.grind_option !== undefined) updateFields.grind_option = data.grind_option;
    if (data.is_active !== undefined) updateFields.is_active = data.is_active;

    const record = await base(TABLES.PRODUCTS).update(id, updateFields) as any;

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

