/**
 * Shopify Sync API Endpoint
 *
 * POST /api/sync/shopify
 */

import { NextRequest, NextResponse } from 'next/server';
import { createShopifySync } from '@/lib/integrations/shopify-sync';

export async function POST(request: NextRequest) {
  console.log('[Shopify Sync API] Starting sync...');
  try {
    // Parse request body
    const body = await request.json();
    console.log('[Shopify Sync API] Request body:', body);
    const {
      fullSync = false,
      syncOrders = true,
      syncProducts = true,
      syncCustomers = true,
      createdAtMin,
      limit
    } = body;

    // Create sync instance
    console.log('[Shopify Sync API] Creating sync instance...');
    const shopifySync = createShopifySync();

    if (!shopifySync) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shopify sync not configured. Please check environment variables.',
          message: 'Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ACCESS_TOKEN'
        },
        { status: 500 }
      );
    }

    // Run sync
    console.log('[Shopify Sync API] Running sync with options:', { fullSync, syncOrders, syncProducts, syncCustomers, createdAtMin, limit });
    const result = await shopifySync.sync({
      fullSync,
      syncOrders,
      syncProducts,
      syncCustomers,
      createdAtMin,
      limit
    });

    console.log('[Shopify Sync API] Sync result:', result);
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Shopify Sync API] Error:', error.message, error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Shopify sync failed'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Shopify Sync API',
      usage: 'POST with JSON body: { fullSync?: boolean, syncOrders?: boolean, syncProducts?: boolean, syncCustomers?: boolean, createdAtMin?: string, limit?: number }'
    },
    { status: 200 }
  );
}
