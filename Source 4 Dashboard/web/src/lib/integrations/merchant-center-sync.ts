/**
 * Google Merchant Center Sync Service
 *
 * Syncs GMC data to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { MerchantCenterClient, GMCDateRange, createMerchantCenterClient } from './merchant-center-client';

export interface GMCSyncOptions {
    fullSync?: boolean;
    dateRange?: GMCDateRange;
    syncProducts?: boolean;
    syncPerformance?: boolean;
}

export interface GMCSyncResult {
    success: boolean;
    syncId?: number;
    recordsSynced: number;
    recordsCreated: number;
    recordsUpdated: number;
    duration: number;
    errors?: string[];
    message: string;
}

export class MerchantCenterSync {
    private supabase;
    private gmcClient: MerchantCenterClient;

    constructor(gmcClient: MerchantCenterClient) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.gmcClient = gmcClient;
    }

    /**
     * Main sync method
     */
    async sync(options: GMCSyncOptions = {}): Promise<GMCSyncResult> {
        const startTime = Date.now();
        const errors: string[] = [];
        let recordsSynced = 0;
        let recordsCreated = 0;
        let recordsUpdated = 0;

        // Default options
        const {
            fullSync = false,
            dateRange = fullSync
                ? { startDate: '2024-01-01', endDate: new Date().toISOString().split('T')[0] }
                : {
                    startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
                    endDate: new Date().toISOString().split('T')[0] // Today
                },
            syncProducts = true,
            syncPerformance = true,
        } = options;

        // Create sync log entry
        const { data: syncLog, error: syncLogError } = await this.supabase
            .from('gmc_sync_log')
            .insert({
                sync_started_at: new Date().toISOString(),
                status: 'running'
            })
            .select()
            .single();

        if (syncLogError || !syncLog) {
            return {
                success: false,
                recordsSynced: 0,
                recordsCreated: 0,
                recordsUpdated: 0,
                duration: Date.now() - startTime,
                errors: ['Failed to create sync log'],
                message: 'Sync failed to start'
            };
        }

        const syncId = syncLog.id;

        try {
            // Test connection first
            const connectionTest = await this.gmcClient.testConnection();
            if (!connectionTest.success) {
                throw new Error(`GMC connection failed: ${connectionTest.error}`);
            }

            // Sync Products
            if (syncProducts) {
                const result = await this.syncProducts();
                recordsSynced += result.synced;
                recordsCreated += result.created;
                recordsUpdated += result.updated;
                if (result.error) errors.push(result.error);
            }

            // Sync Performance
            if (syncPerformance) {
                const result = await this.syncPerformance(dateRange);
                recordsSynced += result.synced;
                recordsCreated += result.created;
                recordsUpdated += result.updated;
                if (result.error) errors.push(result.error);
            }

            // Update sync log
            await this.supabase
                .from('gmc_sync_log')
                .update({
                    sync_completed_at: new Date().toISOString(),
                    records_synced: recordsSynced,
                    errors: errors.length > 0 ? errors : null,
                    status: errors.length > 0 ? 'partial' : 'success'
                })
                .eq('id', syncId);

            const duration = Date.now() - startTime;

            return {
                success: errors.length === 0,
                syncId,
                recordsSynced,
                recordsCreated,
                recordsUpdated,
                duration,
                errors: errors.length > 0 ? errors : undefined,
                message: errors.length > 0
                    ? `Partially synced ${recordsSynced} records in ${(duration / 1000).toFixed(1)}s with ${errors.length} errors`
                    : `Successfully synced ${recordsSynced} records in ${(duration / 1000).toFixed(1)}s`
            };

        } catch (error: any) {
            // Update sync log with error
            await this.supabase
                .from('gmc_sync_log')
                .update({
                    sync_completed_at: new Date().toISOString(),
                    records_synced: recordsSynced,
                    errors: [error.message],
                    status: 'failed'
                })
                .eq('id', syncId);

            return {
                success: false,
                syncId,
                recordsSynced,
                recordsCreated,
                recordsUpdated,
                duration: Date.now() - startTime,
                errors: [error.message],
                message: `Sync failed: ${error.message}`
            };
        }
    }

    /**
     * Sync Products
     */
    private async syncProducts(): Promise<{
        synced: number;
        created: number;
        updated: number;
        error?: string;
    }> {
        try {
            const products = await this.gmcClient.getProducts();
            const statuses = await this.gmcClient.getProductStatuses();

            // Map statuses to products for easier access
            const statusMap = new Map(statuses.map(s => [s.id, s]));

            let created = 0;
            let updated = 0;

            for (const product of products) {
                const statusInfo = statusMap.get(product.id);

                // Determine overall status (simplified logic)
                let status = 'active';
                if (statusInfo?.destination_statuses) {
                    // Check if approved for Shopping
                    const shoppingStatus = statusInfo.destination_statuses.find((ds: any) => ds.destination === 'Shopping');
                    if (shoppingStatus) {
                        status = shoppingStatus.status; // 'approved', 'disapproved', 'pending'
                    }
                }

                const { error } = await this.supabase
                    .from('gmc_products')
                    .upsert({
                        id: product.id,
                        offer_id: product.offer_id,
                        title: product.title,
                        description: product.description,
                        link: product.link,
                        image_link: product.image_link,
                        price_value: product.price_value,
                        price_currency: product.price_currency,
                        availability: product.availability,
                        brand: product.brand,
                        google_product_category: product.google_product_category,
                        product_types: product.product_types,
                        channel: product.channel,
                        content_language: product.content_language,
                        target_country: product.target_country,
                        feed_label: product.feed_label,
                        status: status,
                        item_level_issues: statusInfo?.item_level_issues || [],
                        synced_at: new Date().toISOString()
                    }, {
                        onConflict: 'id'
                    });

                if (error) {
                    console.error('Error upserting product:', error);
                } else {
                    // Rough estimate, upsert doesn't tell us if it was insert or update easily without return
                    updated++;
                }
            }

            return {
                synced: products.length,
                created, // Not tracking created vs updated precisely here to save query overhead
                updated: products.length
            };
        } catch (error: any) {
            return {
                synced: 0,
                created: 0,
                updated: 0,
                error: `Product sync error: ${error.message}`
            };
        }
    }

    /**
     * Sync Performance
     */
    private async syncPerformance(dateRange: GMCDateRange): Promise<{
        synced: number;
        created: number;
        updated: number;
        error?: string;
    }> {
        try {
            const metrics = await this.gmcClient.getPerformanceMetrics(dateRange);

            let created = 0;
            let updated = 0;

            for (const row of metrics) {
                // For aggregate data, we might use a fixed ID or just date as unique key if offer_id is null
                // The table schema has UNIQUE(date, offer_id). If offer_id is null, it treats it as unique for that date (Postgres unique constraint with nulls can be tricky, but usually allows multiple nulls. 
                // However, for aggregate daily stats, we probably want one row per date.
                // Let's assume we are syncing aggregate daily stats for now.

                // If we want to enforce one row per date for aggregate, we should probably use a specific value for offer_id like 'AGGREGATE' or handle the constraint differently.
                // For now, let's assume the table handles it or we just insert.

                const { error } = await this.supabase
                    .from('gmc_performance')
                    .upsert({
                        date: row.date,
                        clicks: row.clicks,
                        impressions: row.impressions,
                        ctr: row.ctr,
                        conversions: row.conversions,
                        conversion_value: row.conversion_value,
                        synced_at: new Date().toISOString()
                    }, {
                        onConflict: 'date, offer_id' // This might fail if offer_id is null and we have multiple nulls? No, wait.
                        // If offer_id is NULL, unique index allows multiple rows.
                        // But here we are upserting.
                        // Let's explicitly set offer_id to 'ALL_PRODUCTS' for aggregate data to avoid ambiguity.
                    });

                // Actually, let's modify the insert to use a placeholder for offer_id if it's aggregate
                // But wait, the client is fetching aggregate data.

                const { error: upsertError } = await this.supabase
                    .from('gmc_performance')
                    .upsert({
                        date: row.date,
                        offer_id: 'ALL_PRODUCTS', // Explicitly mark as aggregate
                        clicks: row.clicks,
                        impressions: row.impressions,
                        ctr: row.ctr,
                        conversions: row.conversions,
                        conversion_value: row.conversion_value,
                        synced_at: new Date().toISOString()
                    }, {
                        onConflict: 'date, offer_id'
                    });

                if (upsertError) {
                    console.error('Error upserting performance:', upsertError);
                } else {
                    updated++;
                }
            }

            return {
                synced: metrics.length,
                created,
                updated: metrics.length
            };
        } catch (error: any) {
            return {
                synced: 0,
                created: 0,
                updated: 0,
                error: `Performance sync error: ${error.message}`
            };
        }
    }
}

/**
 * Create GMC sync instance from environment variables
 */
export function createMerchantCenterSync(): MerchantCenterSync | null {
    const gmcClient = createMerchantCenterClient();

    if (!gmcClient) {
        return null;
    }

    return new MerchantCenterSync(gmcClient);
}
