import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/airtable/products';
import { createProductSchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/products/route.ts:5',message:'GET /api/products entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active_only') !== 'false';

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/products/route.ts:10',message:'Before getProducts call',data:{activeOnly},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    const products = await getProducts(activeOnly);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/products/route.ts:17',message:'After getProducts success (single-select)',data:{productCount:products.length,firstProductGrindOption:products[0]?.grind_option,firstProductGrindOptionType:typeof products[0]?.grind_option},timestamp:Date.now(),sessionId:'debug-session',runId:'single-select',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    // #region agent log
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 300)
    } : { error: String(error) };
    fetch('http://127.0.0.1:7244/ingest/a40b7c3c-59c4-467a-981c-58b903716aa6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/products/route.ts:20',message:'Error in GET /api/products',data:errorData,timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    console.error('Error fetching products:', error);
    
    // 提供更詳細的錯誤訊息給前端
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    const product = await createProduct(validatedData);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

