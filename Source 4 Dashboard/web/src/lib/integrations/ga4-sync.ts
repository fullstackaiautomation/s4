/**
 * Google Analytics 4 Sync Service
 *
 * Syncs GA4 data to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { GA4Client, GA4DateRange, createGA4Client } from './ga4-client';

export interface GA4SyncOptions {
  fullSync?: boolean;
  dateRange?: GA4DateRange;
  syncTraffic?: boolean;
  syncSources?: boolean;
  syncPages?: boolean;
  syncEcommerce?: boolean;
  syncConversions?: boolean;
}

export interface GA4SyncResult {
  success: boolean;
  syncId?: number;
  recordsSynced: number;
  recordsCreated: number;
  recordsUpdated: number;
  duration: number;
  errors?: string[];
  message: string;
}

export class GA4Sync {
  private supabase;
  private ga4Client: GA4Client;

  constructor(ga4Client: GA4Client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.ga4Client = ga4Client;
  }

  /**
   * Main sync method
   */
  async sync(options: GA4SyncOptions = {}): Promise<GA4SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsSynced = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;

    // Default options
    const {
      fullSync = false,
      dateRange = fullSync
        ? { startDate: '2024-01-01', endDate: 'today' }
        : { startDate: 'yesterday', endDate: 'today' },
      syncTraffic = true,
      syncSources = true,
      syncPages = true,
      syncEcommerce = true,
      syncConversions = true
    } = options;

    // Convert relative dates to actual dates for storage
    const resolveDate = (dateStr: string): string => {
      const today = new Date();
      if (dateStr === 'today') {
        return today.toISOString().split('T')[0];
      } else if (dateStr === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      } else if (dateStr.endsWith('daysAgo')) {
        const days = parseInt(dateStr.replace('daysAgo', ''));
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - days);
        return pastDate.toISOString().split('T')[0];
      }
      return dateStr; // Already in YYYY-MM-DD format
    };

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await this.supabase
      .from('ga4_sync_log')
      .insert({
        sync_started_at: new Date().toISOString(),
        date_range_start: resolveDate(dateRange.startDate),
        date_range_end: resolveDate(dateRange.endDate),
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
      const connectionTest = await this.ga4Client.testConnection();
      if (!connectionTest.success) {
        throw new Error(`GA4 connection failed: ${connectionTest.error}`);
      }

      // Sync daily traffic
      if (syncTraffic) {
        const result = await this.syncDailyTraffic(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
      }

      // Sync traffic sources
      if (syncSources) {
        const result = await this.syncTrafficSources(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
      }

      // Sync page performance
      if (syncPages) {
        const result = await this.syncPagePerformance(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
      }

      // Sync e-commerce transactions
      if (syncEcommerce) {
        const result = await this.syncEcommerceTransactions(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
      }

      // Sync conversions
      if (syncConversions) {
        const result = await this.syncConversions(dateRange);
        recordsSynced += result.synced;
        recordsCreated += result.created;
        recordsUpdated += result.updated;
        if (result.error) errors.push(result.error);
      }

      // Update sync log
      await this.supabase
        .from('ga4_sync_log')
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
        .from('ga4_sync_log')
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
   * Sync daily traffic metrics
   */
  private async syncDailyTraffic(dateRange: GA4DateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      const traffic = await this.ga4Client.getDailyTraffic(dateRange);

      let created = 0;
      let updated = 0;

      for (const row of traffic) {
        const { error } = await this.supabase
          .from('ga4_daily_traffic')
          .upsert({
            date: row.date,
            sessions: row.sessions,
            users: row.users,
            new_users: row.new_users,
            engaged_sessions: row.engaged_sessions,
            engagement_rate: row.engagement_rate,
            bounce_rate: row.bounce_rate,
            average_session_duration: row.average_session_duration,
            pageviews: row.pageviews,
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'date'
          });

        if (error) {
          console.error('Error upserting traffic:', error);
        } else {
          created++;
        }
      }

      return {
        synced: traffic.length,
        created,
        updated: traffic.length - created
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Traffic sync error: ${error.message}`
      };
    }
  }

  /**
   * Sync traffic sources
   */
  private async syncTrafficSources(dateRange: GA4DateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      // Delete existing records for this date range to prevent duplicates
      const { error: deleteError } = await this.supabase
        .from('ga4_traffic_sources')
        .delete()
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (deleteError) {
        console.error('Error clearing old traffic sources:', deleteError);
      }

      const sources = await this.ga4Client.getTrafficSources(dateRange);

      let created = 0;

      // Batch insert
      const chunkSize = 100;
      for (let i = 0; i < sources.length; i += chunkSize) {
        const chunk = sources.slice(i, i + chunkSize).map(row => ({
          date: row.date,
          source: row.source,
          medium: row.medium,
          campaign: row.campaign,
          sessions: row.sessions,
          users: row.users,
          new_users: row.new_users,
          conversions: row.conversions,
          revenue: row.revenue,
          synced_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('ga4_traffic_sources')
          .insert(chunk);

        if (!error) {
          created += chunk.length;
        } else {
          console.error('Error inserting traffic sources chunk:', error);
        }
      }

      return {
        synced: sources.length,
        created,
        updated: 0
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Traffic sources sync error: ${error.message}`
      };
    }
  }

  /**
   * Sync page performance
   */
  private async syncPagePerformance(dateRange: GA4DateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      // Delete existing records
      const { error: deleteError } = await this.supabase
        .from('ga4_page_performance')
        .delete()
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (deleteError) {
        console.error('Error clearing old page performance:', deleteError);
      }

      const pages = await this.ga4Client.getPagePerformance(dateRange);

      let created = 0;

      const chunkSize = 100;
      for (let i = 0; i < pages.length; i += chunkSize) {
        const chunk = pages.slice(i, i + chunkSize).map(row => ({
          date: row.date,
          page_path: row.page_path,
          page_title: row.page_title,
          pageviews: row.pageviews,
          avg_time_on_page: row.avg_time_on_page,
          bounce_rate: row.bounce_rate,
          exits: row.exits,
          synced_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('ga4_page_performance')
          .insert(chunk);

        if (!error) {
          created += chunk.length;
        } else {
          console.error('Error inserting page performance chunk:', error);
        }
      }

      return {
        synced: pages.length,
        created,
        updated: 0
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
   * Sync e-commerce transactions
   */
  private async syncEcommerceTransactions(dateRange: GA4DateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      // Delete existing records
      const { error: deleteError } = await this.supabase
        .from('ga4_ecommerce_transactions')
        .delete()
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (deleteError) {
        console.error('Error clearing old transactions:', deleteError);
      }

      const transactions = await this.ga4Client.getEcommerceTransactions(dateRange);

      let created = 0;

      const chunkSize = 100;
      for (let i = 0; i < transactions.length; i += chunkSize) {
        const chunk = transactions.slice(i, i + chunkSize).map(row => ({
          date: row.date,
          transaction_id: row.transaction_id,
          source: row.source,
          medium: row.medium,
          campaign: row.campaign,
          revenue: row.revenue,
          tax: row.tax,
          shipping: row.shipping,
          items_purchased: row.items_purchased,
          synced_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('ga4_ecommerce_transactions')
          .insert(chunk);

        if (!error) {
          created += chunk.length;
        } else {
          console.error('Error inserting transactions chunk:', error);
        }
      }

      return {
        synced: transactions.length,
        created,
        updated: 0
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `E-commerce sync error: ${error.message}`
      };
    }
  }

  /**
   * Sync conversions
   */
  private async syncConversions(dateRange: GA4DateRange): Promise<{
    synced: number;
    created: number;
    updated: number;
    error?: string;
  }> {
    try {
      // Delete existing records
      const { error: deleteError } = await this.supabase
        .from('ga4_conversions')
        .delete()
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (deleteError) {
        console.error('Error clearing old conversions:', deleteError);
      }

      const conversions = await this.ga4Client.getConversions(dateRange);

      let created = 0;

      const chunkSize = 100;
      for (let i = 0; i < conversions.length; i += chunkSize) {
        const chunk = conversions.slice(i, i + chunkSize).map(row => ({
          date: row.date,
          conversion_event: row.conversion_event,
          source: row.source,
          medium: row.medium,
          campaign: row.campaign,
          conversions: row.conversions,
          conversion_value: row.conversion_value,
          synced_at: new Date().toISOString()
        }));

        const { error } = await this.supabase
          .from('ga4_conversions')
          .insert(chunk);

        if (!error) {
          created += chunk.length;
        } else {
          console.error('Error inserting conversions chunk:', error);
        }
      }

      return {
        synced: conversions.length,
        created,
        updated: 0
      };
    } catch (error: any) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        error: `Conversions sync error: ${error.message}`
      };
    }
  }
}

/**
 * Create GA4 sync instance from environment variables
 */
export function createGA4Sync(): GA4Sync | null {
  const ga4Client = createGA4Client();

  if (!ga4Client) {
    return null;
  }

  return new GA4Sync(ga4Client);
}
