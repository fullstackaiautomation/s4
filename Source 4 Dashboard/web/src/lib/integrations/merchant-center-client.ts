/**
 * Google Merchant Center Client
 *
 * Handles authentication and data fetching from Google Merchant Center API
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface GMCConfig {
    merchantId: string;
    credentials?: {
        client_email: string;
        private_key: string;
    };
    credentialsPath?: string;
}

export interface GMCDateRange {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

export class MerchantCenterClient {
    private auth: JWT;
    private merchantId: string;
    private content;

    constructor(config: GMCConfig) {
        this.merchantId = config.merchantId;

        if (config.credentials) {
            this.auth = new google.auth.JWT({
                email: config.credentials.client_email,
                key: config.credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/content'],
            });
        } else if (config.credentialsPath) {
            this.auth = new google.auth.JWT({
                keyFile: config.credentialsPath,
                scopes: ['https://www.googleapis.com/auth/content'],
            });
        } else {
            throw new Error('MerchantCenterClient requires either credentials or credentialsPath');
        }

        this.content = google.content({ version: 'v2.1', auth: this.auth });
    }

    /**
     * Get all products
     */
    async getProducts() {
        const products: any[] = [];
        let nextPageToken: string | undefined;

        do {
            const response = await this.content.products.list({
                merchantId: this.merchantId,
                maxResults: 250,
                pageToken: nextPageToken,
            });

            if (response.data.resources) {
                products.push(...response.data.resources);
            }

            nextPageToken = response.data.nextPageToken || undefined;
        } while (nextPageToken);

        return products.map(product => ({
            id: product.id,
            offer_id: product.offerId,
            title: product.title,
            description: product.description,
            link: product.link,
            image_link: product.imageLink,
            price_value: product.price?.value,
            price_currency: product.price?.currency,
            availability: product.availability,
            brand: product.brand,
            google_product_category: product.googleProductCategory,
            product_types: product.productTypes,
            channel: product.channel,
            content_language: product.contentLanguage,
            target_country: product.targetCountry,
            feed_label: product.feedLabel,
        }));
    }

    /**
     * Get product statuses (issues)
     * Note: The 'statuses' endpoint might be needed if 'products.list' doesn't provide enough detail on issues.
     * For v2.1, productstatuses.list provides item-level issues.
     */
    async getProductStatuses() {
        const statuses: any[] = [];
        let nextPageToken: string | undefined;

        do {
            const response = await this.content.productstatuses.list({
                merchantId: this.merchantId,
                maxResults: 250,
                pageToken: nextPageToken,
            });

            if (response.data.resources) {
                statuses.push(...response.data.resources);
            }

            nextPageToken = response.data.nextPageToken || undefined;
        } while (nextPageToken);

        return statuses.map(status => ({
            id: status.productId,
            title: status.title,
            destination_statuses: status.destinationStatuses,
            item_level_issues: status.itemLevelIssues,
        }));
    }

    /**
     * Get performance metrics
     * Uses the Reports service (Search Analytics)
     * Note: The Content API for Shopping has a reports endpoint.
     */
    async getPerformanceMetrics(dateRange: GMCDateRange) {
        // This is a simplified query. You might want to group by product, brand, etc.
        // For now, let's get daily aggregate data.

        const response = await this.content.reports.search({
            merchantId: this.merchantId,
            requestBody: {
                query: `
          SELECT 
            segments.date,
            metrics.clicks,
            metrics.impressions,
            metrics.ctr,
            metrics.conversions,
            metrics.conversion_value
          FROM MerchantPerformanceView
          WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
        `
            }
        });

        return response.data.results?.map(row => ({
            date: row.segments?.date,
            clicks: parseInt(row.metrics?.clicks || '0'),
            impressions: parseInt(row.metrics?.impressions || '0'),
            ctr: parseFloat(row.metrics?.ctr || '0'),
            conversions: parseFloat(row.metrics?.conversions || '0'),
            conversion_value: parseFloat(row.metrics?.conversionValue || '0'),
        })) || [];
    }

    /**
     * Test connection
     */
    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            await this.content.products.list({
                merchantId: this.merchantId,
                maxResults: 1,
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

/**
 * Create GMC client from environment variables
 */
export function createMerchantCenterClient(): MerchantCenterClient | null {
    const merchantId = process.env.GMC_MERCHANT_ID;
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GA4_CREDENTIALS_JSON;

    if (!merchantId) {
        console.warn('GMC_MERCHANT_ID not found in environment variables');
        return null;
    }

    if (!credentialsJson) {
        console.warn('GOOGLE_APPLICATION_CREDENTIALS_JSON not found in environment variables');
        return null;
    }

    try {
        const credentials = JSON.parse(credentialsJson);
        return new MerchantCenterClient({
            merchantId,
            credentials: {
                client_email: credentials.client_email,
                private_key: credentials.private_key,
            },
        });
    } catch (error) {
        console.error('Failed to parse Google credentials:', error);
        return null;
    }
}
