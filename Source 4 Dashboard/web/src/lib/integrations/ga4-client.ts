/**
 * Google Analytics 4 Client
 *
 * Handles authentication and data fetching from GA4 API
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';

export interface GA4Config {
  propertyId: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
  credentialsPath?: string;
}

export interface GA4DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export class GA4Client {
  private client: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor(config: GA4Config) {
    this.propertyId = config.propertyId;

    if (config.credentials) {
      this.client = new BetaAnalyticsDataClient({
        credentials: config.credentials
      });
    } else if (config.credentialsPath) {
      this.client = new BetaAnalyticsDataClient({
        keyFilename: config.credentialsPath
      });
    } else {
      throw new Error('GA4Client requires either credentials or credentialsPath');
    }
  }

  /**
   * Get daily traffic metrics
   */
  async getDailyTraffic(dateRange: GA4DateRange) {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [dateRange],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViews' }
      ]
    });

    return response.rows?.map(row => ({
      date: row.dimensionValues?.[0].value || '',
      sessions: parseInt(row.metricValues?.[0].value || '0'),
      users: parseInt(row.metricValues?.[1].value || '0'),
      new_users: parseInt(row.metricValues?.[2].value || '0'),
      engaged_sessions: parseInt(row.metricValues?.[3].value || '0'),
      engagement_rate: parseFloat(row.metricValues?.[4].value || '0'),
      bounce_rate: parseFloat(row.metricValues?.[5].value || '0'),
      average_session_duration: parseFloat(row.metricValues?.[6].value || '0'),
      pageviews: parseInt(row.metricValues?.[7].value || '0')
    })) || [];
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(dateRange: GA4DateRange) {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'date' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'conversions' },
        { name: 'totalRevenue' }
      ]
    });

    return response.rows?.map(row => ({
      date: row.dimensionValues?.[0].value || '',
      source: row.dimensionValues?.[1].value || '(not set)',
      medium: row.dimensionValues?.[2].value || '(not set)',
      campaign: row.dimensionValues?.[3].value || '(not set)',
      sessions: parseInt(row.metricValues?.[0].value || '0'),
      users: parseInt(row.metricValues?.[1].value || '0'),
      new_users: parseInt(row.metricValues?.[2].value || '0'),
      conversions: parseInt(row.metricValues?.[3].value || '0'),
      revenue: parseFloat(row.metricValues?.[4].value || '0')
    })) || [];
  }

  /**
   * Get page performance
   */
  async getPagePerformance(dateRange: GA4DateRange) {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'date' },
        { name: 'pagePath' },
        { name: 'pageTitle' }
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'engagementRate' },
        { name: 'bounceRate' }
      ]
    });

    return response.rows?.map(row => {
      const pageviews = parseInt(row.metricValues?.[0].value || '0');
      const engagementRate = parseFloat(row.metricValues?.[1].value || '0');

      return {
        date: row.dimensionValues?.[0].value || '',
        page_path: row.dimensionValues?.[1].value || '',
        page_title: row.dimensionValues?.[2].value || '',
        pageviews,
        avg_time_on_page: 0, // Not available per-page in GA4
        bounce_rate: parseFloat(row.metricValues?.[2].value || '0'),
        exits: 0 // Simplified - exits not available per-page
      };
    }) || [];
  }

  /**
   * Get e-commerce transactions
   */
  async getEcommerceTransactions(dateRange: GA4DateRange) {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'date' },
        { name: 'transactionId' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ],
      metrics: [
        { name: 'totalRevenue' },
        { name: 'taxAmount' },
        { name: 'shippingAmount' },
        { name: 'itemsPurchased' }
      ]
    });

    return response.rows?.map(row => ({
      date: row.dimensionValues?.[0].value || '',
      transaction_id: row.dimensionValues?.[1].value || '',
      source: row.dimensionValues?.[2].value || '(not set)',
      medium: row.dimensionValues?.[3].value || '(not set)',
      campaign: row.dimensionValues?.[4].value || '(not set)',
      revenue: parseFloat(row.metricValues?.[0].value || '0'),
      tax: parseFloat(row.metricValues?.[1].value || '0'),
      shipping: parseFloat(row.metricValues?.[2].value || '0'),
      items_purchased: parseInt(row.metricValues?.[3].value || '0')
    })) || [];
  }

  /**
   * Get conversion events
   */
  async getConversions(dateRange: GA4DateRange) {
    const [response] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [dateRange],
      dimensions: [
        { name: 'date' },
        { name: 'eventName' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ],
      metrics: [
        { name: 'conversions' },
        { name: 'totalRevenue' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['purchase', 'add_to_cart', 'begin_checkout', 'generate_lead']
          }
        }
      }
    });

    return response.rows?.map(row => ({
      date: row.dimensionValues?.[0].value || '',
      conversion_event: row.dimensionValues?.[1].value || '',
      source: row.dimensionValues?.[2].value || '(not set)',
      medium: row.dimensionValues?.[3].value || '(not set)',
      campaign: row.dimensionValues?.[4].value || '(not set)',
      conversions: parseInt(row.metricValues?.[0].value || '0'),
      conversion_value: parseFloat(row.metricValues?.[1].value || '0')
    })) || [];
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        limit: 1
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Create GA4 client from environment variables
 */
export function createGA4Client(): GA4Client | null {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const credentialsJson = process.env.GA4_CREDENTIALS_JSON;

  if (!propertyId) {
    console.warn('GA4_PROPERTY_ID not found in environment variables');
    return null;
  }

  if (!credentialsJson) {
    console.warn('GA4_CREDENTIALS_JSON not found in environment variables');
    return null;
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    return new GA4Client({
      propertyId,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key
      }
    });
  } catch (error) {
    console.error('Failed to parse GA4 credentials:', error);
    return null;
  }
}
