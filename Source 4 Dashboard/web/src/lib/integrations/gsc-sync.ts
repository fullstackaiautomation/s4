/**
 * Google Search Console Sync Service
 *
 * Syncs GSC data to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { GSCClient, GSCDateRange, createGSCClient } from './gsc-client';

export interface GSCSyncOptions {
  fullSync?: boolean;
  dateRange?: GSCDateRange;
  syncQueries?: boolean;
  syncPages?: boolean;
  syncDevices?: boolean;
  syncCountries?: boolean;
  syncSitePerformance?: boolean;
}

export interface GSCSyncResult {
  success: boolean;
  syncId?: number;
  recordsSynced: number;
  recordsCreated: number;
  recordsUpdated: number;
  duration: number;
  errors?: string[];
  message: string;
}

export class GSCSync {
  private supabase;
  private gscClient: GSCClient;

  constructor(gscClient: GSCClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.gscClient = gscClient;
  }

  /**
   * Main sync method
   */
  async sync(options: GSCSyncOptions = {}): Promise<GSCSyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsSynced = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Default options
    const {
      fullSync = false,
      dateRange = fullSync
        ? { startDate: '2024-01-01', endDate: this.formatDate(new Date()) }
        : { startDate: this.formatDate(this.getDaysAgo(7)), endDate: this.formatDate(new Date()) },
      syncQueries = true,
      syncPages = true,
      syncDevices = true,
      syncCountries = true,
      syncSitePerformance = true
    } = options;

    console.log('[GSC Sync] Starting sync with options:', { fullSync, dateRange, syncQueries, syncPages, syncDevices, syncCountries, syncSitePerformance });

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await this.supabase
      .from('gsc_sync_log')
      .insert({
        sync_started_at: new Date().toISOString(),
        date_range_start: dateRange.startDate,
        date_range_end: dateRange.endDate,
        status: 'running'
      })
      .select()
      .single();

    if (syncLogError || !syncLog) {
      console.error('[GSC Sync] Failed to create sync log:', syncLogError);
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
      console.log('[GSC Sync] Testing connection...');
      const connectionTest = await this.gscClient.testConnection();
      if (!connectionTest.success) {
        throw new Error(`GSC connection failed: ${connectionTest.error}`);
      }
      console.log('[GSC Sync] Connection successful');

      // Sync site performance (overall daily metrics)
      if (syncSitePerformance) {
        console.log('[GSC Sync] Syncing site performance...');
        const result = await this.syncSitePerformance(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
        console.log('[GSC Sync] Site performance synced:', result);
      }

      // Sync search queries
      if (syncQueries) {
        console.log('[GSC Sync] Syncing search queries...');
        const result = await this.syncSearchQueries(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
        console.log('[GSC Sync] Search queries synced:', result);
      }

      // Sync page performance
      if (syncPages) {
        console.log('[GSC Sync] Syncing page performance...');
        const result = await this.syncPagePerformance(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
        console.log('[GSC Sync] Page performance synced:', result);
      }

      // Sync device breakdown
      if (syncDevices) {
        console.log('[GSC Sync] Syncing device breakdown...');
        const result = await this.syncDeviceBreakdown(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
        console.log('[GSC Sync] Device breakdown synced:', result);
      }

      // Sync country breakdown
      if (syncCountries) {
        console.log('[GSC Sync] Syncing country breakdown...');
        const result = await this.syncCountryBreakdown(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
        console.log('[GSC Sync] Country breakdown synced:', result);
      }

      // Update sync log
      await this.supabase
        .from('gsc_sync_log')
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
      console.error('[GSC Sync] Sync failed:', error);
      // Update sync log with error
      await this.supabase
        .from('gsc_sync_log')
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
   * Sync site performance (overall metrics by date)
   */
  private async syncSitePerformance(dateRange: GSCDateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      const performance = await this.gscClient.getSitePerformance(dateRange);

      let created = 0;

      for (const row of performance) {
        const { error } = await this.supabase
          .from('gsc_site_performance')
          .upsert({
            date: row.date,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'date'
          });

        if (error) {
          console.error('[GSC Sync] Error upserting site performance:', error);
        } else {
          created++;
        }
      }

      return {
        synced: performance.length,
        created,
        updated: performance.length - created
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Site performance sync error: ${error.message}`
      };
    }
  }

  /**
   * Sync search queries
   */
  private async syncSearchQueries(dateRange: GSCDateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      const queries = await this.gscClient.getSearchQueries(dateRange);

      let created = 0;

      // Batch insert for better performance
      const batchSize = 1000;
      for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        const { error } = await this.supabase
          .from('gsc_search_queries')
          .upsert(
            batch.map(row => ({
              date: row.date,
              query: row.query,
              clicks: row.clicks,
              impressions: row.impressions,
              ctr: row.ctr,
              position: row.position,
              synced_at: new Date().toISOString()
            })),
            {
              onConflict: 'date,query'
            }
          );

        if (!error) {
          created += batch.length;
        } else {
          console.error('[GSC Sync] Error upserting queries batch:', error);
        }
      }

      return {
        synced: queries.length,
        created,
        updated: queries.length - created
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Search queries sync error: ${error.message}`
      };
    }
  }

  /**
   * Sync page performance
   */
  private async syncPagePerformance(dateRange: GSCDateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      const pages = await this.gscClient.getPagePerformance(dateRange);

      let created = 0;

      // Batch insert for better performance
      const batchSize = 1000;
      for (let i = 0; i < pages.length; i += batchSize) {
        const batch = pages.slice(i, i + batchSize);
        const { error } = await this.supabase
          .from('gsc_page_performance')
          .upsert(
            batch.map(row => ({
              date: row.date,
              page: row.page,
              clicks: row.clicks,
              impressions: row.impressions,
              ctr: row.ctr,
              position: row.position,
              synced_at: new Date().toISOString()
            })),
            {
              onConflict: 'date,page'
            }
          );

        if (!error) {
          created += batch.length;
        } else {
          console.error('[GSC Sync] Error upserting pages batch:', error);
        }
      }

      return {
        synced: pages.length,
        created,
        updated: pages.length - created
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Page performance sync error: ${error.message}`
      };
    }
  }

  /**
   * Sync device breakdown
   */
  private async syncDeviceBreakdown(dateRange: GSCDateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      const devices = await this.gscClient.getDeviceBreakdown(dateRange);

      let created = 0;

      for (const row of devices) {
        const { error } = await this.supabase
          .from('gsc_device_performance')
          .upsert({
            date: row.date,
            device: row.device || 'unknown',
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'date,device'
          });

        if (!error) {
          created++;
        } else {
          console.error('[GSC Sync] Error upserting device:', error);
        }
      }

      return {
        synced: devices.length,
        created,
        updated: devices.length - created
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Device breakdown sync error: ${error.message}`
      };
    }
  }

  /**
   * Sync country breakdown
   */
  private async syncCountryBreakdown(dateRange: GSCDateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      const countries = await this.gscClient.getCountryBreakdown(dateRange);

      let created = 0;

      // Batch insert for better performance
      const batchSize = 500;
      for (let i = 0; i < countries.length; i += batchSize) {
        const batch = countries.slice(i, i + batchSize);
        const { error } = await this.supabase
          .from('gsc_country_performance')
          .upsert(
            batch.map(row => ({
              date: row.date,
              country: row.country || 'unknown',
              clicks: row.clicks,
              impressions: row.impressions,
              ctr: row.ctr,
              position: row.position,
              synced_at: new Date().toISOString()
            })),
            {
              onConflict: 'date,country'
            }
          );

        if (!error) {
          created += batch.length;
        } else {
          console.error('[GSC Sync] Error upserting countries batch:', error);
        }
      }

      return {
        synced: countries.length,
        created,
        updated: countries.length - created
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Country breakdown sync error: ${error.message}`
      };
    }
  }

  // Helper methods
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}

/**
 * Create GSC sync instance from environment variables
 */
export function createGSCSync(): GSCSync | null {
  const gscClient = createGSCClient();

  if (!gscClient) {
    return null;
  }

  return new GSCSync(gscClient);
}
