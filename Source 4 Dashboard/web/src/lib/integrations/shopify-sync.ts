/**
 * Shopify Sync Service
 *
 * Syncs Shopify data to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { ShopifyClient, createShopifyClient } from './shopify-client';

export interface ShopifySyncOptions {
  fullSync?: boolean;
  syncOrders?: boolean;
  syncProducts?: boolean;
  syncCustomers?: boolean;
  createdAtMin?: string; // ISO date for incremental sync
  limit?: number; // Limit number of records per type
}

export interface ShopifySyncResult {
  success: boolean;
  syncId?: number;
  recordsSynced: number;
  ordersCount: number;
  productsCount: number;
  customersCount: number;
  duration: number;
  errors?: string[];
  message: string;
}

export class ShopifySync {
  private supabase;
  private shopifyClient: ShopifyClient;

  constructor(shopifyClient: ShopifyClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.shopifyClient = shopifyClient;
  }

  /**
   * Main sync method
   */
  async sync(options: ShopifySyncOptions = {}): Promise<ShopifySyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let ordersCount = 0;
    let productsCount = 0;
    let customersCount = 0;

    // Default options
    const {
      fullSync = false,
      syncOrders = true,
      syncProducts = true,
      syncCustomers = true,
      createdAtMin,
      limit
    } = options;

    // For incremental sync, get last 7 days by default
    const defaultCreatedAtMin = fullSync
      ? undefined
      : createdAtMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await this.supabase
      .from('shopify_sync_log')
      .insert({
        sync_started_at: new Date().toISOString(),
        sync_type: fullSync ? 'all' : 'incremental',
        date_range_start: defaultCreatedAtMin || null,
        date_range_end: new Date().toISOString(),
        status: 'running'
      })
      .select()
      .single();

    if (syncLogError || !syncLog) {
      console.error('Failed to create sync log:', syncLogError);
      return {
        success: false,
        recordsSynced: 0,
        ordersCount: 0,
        productsCount: 0,
        customersCount: 0,
        duration: Date.now() - startTime,
        errors: ['Failed to create sync log'],
        message: 'Sync failed to start'
      };
    }

    const syncId = syncLog.id;

    try {
      // Test connection first
      const connectionTest = await this.shopifyClient.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Shopify connection failed: ${connectionTest.error}`);
      }

      // Sync orders
      if (syncOrders) {
        console.log('[ShopifySync] Syncing orders...');
        const result = await this.syncOrders({
          createdAtMin: defaultCreatedAtMin,
          limit
        });
        ordersCount = result.count;
        if (result.error) errors.push(result.error);
        console.log(`[ShopifySync] Synced ${ordersCount} orders`);
      }

      // Sync products
      if (syncProducts) {
        console.log('[ShopifySync] Syncing products...');
        const result = await this.syncProducts({ limit });
        productsCount = result.count;
        if (result.error) errors.push(result.error);
        console.log(`[ShopifySync] Synced ${productsCount} products`);
      }

      // Sync customers
      if (syncCustomers) {
        console.log('[ShopifySync] Syncing customers...');
        const result = await this.syncCustomers({
          createdAtMin: defaultCreatedAtMin,
          limit
        });
        customersCount = result.count;
        if (result.error) errors.push(result.error);
        console.log(`[ShopifySync] Synced ${customersCount} customers`);
      }

      const totalRecords = ordersCount + productsCount + customersCount;

      // Update sync log
      await this.supabase
        .from('shopify_sync_log')
        .update({
          sync_completed_at: new Date().toISOString(),
          records_synced: totalRecords,
          errors: errors.length > 0 ? errors : null,
          status: errors.length > 0 ? 'partial' : 'success'
        })
        .eq('id', syncId);

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        syncId,
        recordsSynced: totalRecords,
        ordersCount,
        productsCount,
        customersCount,
        duration,
        errors: errors.length > 0 ? errors : undefined,
        message: errors.length > 0
          ? `Partially synced ${totalRecords} records in ${(duration / 1000).toFixed(1)}s with ${errors.length} errors`
          : `Successfully synced ${totalRecords} records in ${(duration / 1000).toFixed(1)}s`
      };

    } catch (error: any) {
      // Update sync log with error
      await this.supabase
        .from('shopify_sync_log')
        .update({
          sync_completed_at: new Date().toISOString(),
          records_synced: ordersCount + productsCount + customersCount,
          errors: [error.message],
          status: 'failed'
        })
        .eq('id', syncId);

      return {
        success: false,
        syncId,
        recordsSynced: ordersCount + productsCount + customersCount,
        ordersCount,
        productsCount,
        customersCount,
        duration: Date.now() - startTime,
        errors: [error.message],
        message: `Sync failed: ${error.message}`
      };
    }
  }

  /**
   * Sync orders
   */
  private async syncOrders(params: {
    createdAtMin?: string;
    limit?: number;
  }): Promise<{ count: number; error?: string }> {
    try {
      const orders = await this.shopifyClient.getAllOrders({
        status: 'any',
        createdAtMin: params.createdAtMin,
        limit: params.limit || 250
      });

      let count = 0;

      for (const order of orders) {
        // Upsert order
        const { error: orderError } = await this.supabase
          .from('shopify_orders')
          .upsert({
            order_id: order.id,
            order_number: order.order_number?.toString(),
            name: order.name,
            email: order.email,
            created_at: order.created_at,
            updated_at: order.updated_at,
            closed_at: order.closed_at,
            cancelled_at: order.cancelled_at,
            processed_at: order.processed_at,
            currency: order.currency,
            total_price: parseFloat(order.total_price || '0'),
            subtotal_price: parseFloat(order.subtotal_price || '0'),
            total_tax: parseFloat(order.total_tax || '0'),
            total_discounts: parseFloat(order.total_discounts || '0'),
            total_shipping: order.shipping_lines?.reduce((sum: number, line: any) => sum + parseFloat(line.price || '0'), 0) || 0,
            financial_status: order.financial_status,
            fulfillment_status: order.fulfillment_status,
            customer_id: order.customer?.id,
            customer_email: order.customer?.email,
            customer_first_name: order.customer?.first_name,
            customer_last_name: order.customer?.last_name,
            shipping_address_city: order.shipping_address?.city,
            shipping_address_province: order.shipping_address?.province,
            shipping_address_country: order.shipping_address?.country,
            shipping_address_zip: order.shipping_address?.zip,
            billing_address_city: order.billing_address?.city,
            billing_address_province: order.billing_address?.province,
            billing_address_country: order.billing_address?.country,
            source_name: order.source_name,
            landing_site: order.landing_site,
            referring_site: order.referring_site,
            line_items_count: order.line_items?.length || 0,
            tags: order.tags,
            note: order.note,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'order_id'
          });

        if (orderError) {
          console.error('Error upserting order:', orderError);
          continue;
        }

        // Upsert line items
        if (order.line_items) {
          for (const item of order.line_items) {
            await this.supabase
              .from('shopify_order_line_items')
              .upsert({
                line_item_id: item.id,
                order_id: order.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                title: item.title,
                variant_title: item.variant_title,
                sku: item.sku,
                vendor: item.vendor,
                quantity: item.quantity,
                price: parseFloat(item.price || '0'),
                total_discount: parseFloat(item.total_discount || '0'),
                fulfillment_status: item.fulfillment_status,
                fulfillable_quantity: item.fulfillable_quantity,
                taxable: item.taxable,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'line_item_id'
              });
          }
        }

        count++;
      }

      return { count };
    } catch (error: any) {
      return { count: 0, error: `Orders sync error: ${error.message}` };
    }
  }

  /**
   * Sync products
   */
  private async syncProducts(params: {
    limit?: number;
  }): Promise<{ count: number; error?: string }> {
    try {
      const products = await this.shopifyClient.getAllProducts({
        limit: params.limit || 250
      });

      let count = 0;

      for (const product of products) {
        // Calculate total inventory
        const totalInventory = product.variants?.reduce(
          (sum: number, v: any) => sum + (v.inventory_quantity || 0),
          0
        ) || 0;

        // Upsert product
        const { error: productError } = await this.supabase
          .from('shopify_products')
          .upsert({
            product_id: product.id,
            title: product.title,
            body_html: product.body_html,
            vendor: product.vendor,
            product_type: product.product_type,
            handle: product.handle,
            status: product.status,
            tags: product.tags,
            created_at: product.created_at,
            updated_at: product.updated_at,
            published_at: product.published_at,
            total_inventory: totalInventory,
            variants_count: product.variants?.length || 0,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'product_id'
          });

        if (productError) {
          console.error('Error upserting product:', productError);
          continue;
        }

        // Upsert variants
        if (product.variants) {
          for (const variant of product.variants) {
            await this.supabase
              .from('shopify_product_variants')
              .upsert({
                variant_id: variant.id,
                product_id: product.id,
                title: variant.title,
                sku: variant.sku,
                barcode: variant.barcode,
                price: parseFloat(variant.price || '0'),
                compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                inventory_quantity: variant.inventory_quantity || 0,
                inventory_policy: variant.inventory_policy,
                weight: variant.weight,
                weight_unit: variant.weight_unit,
                option1: variant.option1,
                option2: variant.option2,
                option3: variant.option3,
                created_at: variant.created_at,
                updated_at: variant.updated_at,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'variant_id'
              });
          }
        }

        count++;
      }

      return { count };
    } catch (error: any) {
      return { count: 0, error: `Products sync error: ${error.message}` };
    }
  }

  /**
   * Sync customers
   */
  private async syncCustomers(params: {
    createdAtMin?: string;
    limit?: number;
  }): Promise<{ count: number; error?: string }> {
    try {
      const customers = await this.shopifyClient.getAllCustomers({
        createdAtMin: params.createdAtMin,
        limit: params.limit || 250
      });

      let count = 0;

      for (const customer of customers) {
        const { error } = await this.supabase
          .from('shopify_customers')
          .upsert({
            customer_id: customer.id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            phone: customer.phone,
            created_at: customer.created_at,
            updated_at: customer.updated_at,
            orders_count: customer.orders_count || 0,
            total_spent: parseFloat(customer.total_spent || '0'),
            state: customer.state,
            verified_email: customer.verified_email,
            tax_exempt: customer.tax_exempt,
            tags: customer.tags,
            note: customer.note,
            default_city: customer.default_address?.city,
            default_province: customer.default_address?.province,
            default_country: customer.default_address?.country,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'customer_id'
          });

        if (!error) {
          count++;
        }
      }

      return { count };
    } catch (error: any) {
      return { count: 0, error: `Customers sync error: ${error.message}` };
    }
  }
}

/**
 * Create Shopify sync instance from environment variables
 */
export function createShopifySync(): ShopifySync | null {
  const shopifyClient = createShopifyClient();

  if (!shopifyClient) {
    return null;
  }

  return new ShopifySync(shopifyClient);
}
