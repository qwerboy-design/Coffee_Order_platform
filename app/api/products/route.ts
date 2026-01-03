import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/supabase/products';
import { createProductSchema } from '@/lib/validation/schemas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active_only') !== 'false';

    const products = await getProducts(activeOnly);

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    
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
