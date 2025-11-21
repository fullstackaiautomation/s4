/**
 * Google Search Console Client
 *
 * Handles authentication and data fetching from GSC API
 */

import { google } from 'googleapis';

export interface GSCConfig {
  siteUrl: string; // e.g., "sc-domain:source4industries.com" or "https://www.source4industries.com"
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

export interface GSCDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface GSCSearchQuery {
  date: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  country?: string;
  device?: string;
}

export interface GSCPageData {
  date: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class GSCClient {
  private searchConsole;
  private siteUrl: string;

  constructor(config: GSCConfig) {
    this.siteUrl = config.siteUrl;

    if (!config.credentials) {
      throw new Error('GSCClient requires credentials');
    }

    // Create JWT auth client
    const auth = new google.auth.JWT({
      email: config.credentials.client_email,
      key: config.credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });

    this.searchConsole = google.searchconsole({ version: 'v1', auth });
  }

  /**
   * Get search analytics data (queries)
   */
  async getSearchQueries(dateRange: GSCDateRange, options: {
    dimensions?: string[];
    rowLimit?: number;
  } = {}): Promise<GSCSearchQuery[]> {
    const {
      dimensions = ['date', 'query'],
      rowLimit = 25000
    } = options;

    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          dimensions,
          rowLimit,
          dataState: 'final' // Use final data only
        }
      });

      if (!response.data.rows) {
        return [];
      }

      return response.data.rows.map(row => {
        const dimensionIndex = dimensions.reduce((acc, dim, idx) => {
          acc[dim] = idx;
          return acc;
        }, {} as Record<string, number>);

        return {
          date: row.keys?.[dimensionIndex['date']] || '',
          query: row.keys?.[dimensionIndex['query']] || '',
          country: dimensions.includes('country') ? row.keys?.[dimensionIndex['country']] : undefined,
          device: dimensions.includes('device') ? row.keys?.[dimensionIndex['device']] : undefined,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0
        };
      });
    } catch (error: any) {
      console.error('GSC getSearchQueries error:', error.message);
      throw error;
    }
  }

  /**
   * Get page performance data
   */
  async getPagePerformance(dateRange: GSCDateRange, options: {
    rowLimit?: number;
  } = {}): Promise<GSCPageData[]> {
    const { rowLimit = 25000 } = options;

    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          dimensions: ['date', 'page'],
          rowLimit,
          dataState: 'final'
        }
      });

      if (!response.data.rows) {
        return [];
      }

      return response.data.rows.map(row => ({
        date: row.keys?.[0] || '',
        page: row.keys?.[1] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }));
    } catch (error: any) {
      console.error('GSC getPagePerformance error:', error.message);
      throw error;
    }
  }

  /**
   * Get search analytics by device (desktop, mobile, tablet)
   */
  async getDeviceBreakdown(dateRange: GSCDateRange): Promise<GSCSearchQuery[]> {
    return this.getSearchQueries(dateRange, {
      dimensions: ['date', 'device'],
      rowLimit: 1000
    });
  }

  /**
   * Get search analytics by country
   */
  async getCountryBreakdown(dateRange: GSCDateRange, options: {
    rowLimit?: number;
  } = {}): Promise<GSCSearchQuery[]> {
    return this.getSearchQueries(dateRange, {
      dimensions: ['date', 'country'],
      rowLimit: options.rowLimit || 1000
    });
  }

  /**
   * Get overall site performance (aggregated)
   */
  async getSitePerformance(dateRange: GSCDateRange) {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          dimensions: ['date'],
          dataState: 'final'
        }
      });

      if (!response.data.rows) {
        return [];
      }

      return response.data.rows.map(row => ({
        date: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }));
    } catch (error: any) {
      console.error('GSC getSitePerformance error:', error.message);
      throw error;
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to fetch last 7 days of data with minimal results
      await this.searchConsole.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: '2024-01-01',
          endDate: '2024-01-02',
          dimensions: ['date'],
          rowLimit: 1
        }
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Create GSC client from environment variables
 */
export function createGSCClient(): GSCClient | null {
  const siteUrl = process.env.GSC_SITE_URL;
  const credentialsJson = process.env.GSC_CREDENTIALS_JSON || process.env.GA4_CREDENTIALS_JSON;

  if (!siteUrl) {
    console.warn('GSC_SITE_URL not found in environment variables');
    return null;
  }

  if (!credentialsJson) {
    console.warn('GSC_CREDENTIALS_JSON (or GA4_CREDENTIALS_JSON) not found in environment variables');
    return null;
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    return new GSCClient({
      siteUrl,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key
      }
    });
  } catch (error) {
    console.error('Failed to parse GSC credentials:', error);
    return null;
  }
}