/**
 * Shopify Admin API Client
 *
 * Handles authentication and data fetching from Shopify Admin API
 */

export interface ShopifyConfig {
  shopDomain: string; // e.g., 'your-store.myshopify.com'
  accessToken: string;
  apiVersion?: string;
}

export interface ShopifyDateRange {
  startDate?: string; // ISO date
  endDate?: string;
}

export class ShopifyClient {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(config: ShopifyConfig) {
    this.shopDomain = config.shopDomain;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2024-01';
  }

  private get baseUrl(): string {
    return `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  /**
   * Make API request to Shopify
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get orders
   */
  async getOrders(params: {
    limit?: number;
    status?: string;
    createdAtMin?: string;
    createdAtMax?: string;
    updatedAtMin?: string;
    sinceId?: string;
  } = {}): Promise<any[]> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.status) queryParams.set('status', params.status);
    if (params.createdAtMin) queryParams.set('created_at_min', params.createdAtMin);
    if (params.createdAtMax) queryParams.set('created_at_max', params.createdAtMax);
    if (params.updatedAtMin) queryParams.set('updated_at_min', params.updatedAtMin);
    if (params.sinceId) queryParams.set('since_id', params.sinceId);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const data = await this.request<{ orders: any[] }>(`/orders.json${query}`);

    return data.orders || [];
  }

  /**
   * Get all orders with pagination
   */
  async getAllOrders(params: {
    status?: string;
    createdAtMin?: string;
    createdAtMax?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const allOrders: any[] = [];
    let hasMore = true;
    let sinceId: string | undefined;

    while (hasMore) {
      const orders = await this.getOrders({
        ...params,
        limit: params.limit || 250,
        sinceId,
      });

      if (orders.length === 0) {
        hasMore = false;
      } else {
        allOrders.push(...orders);
        sinceId = orders[orders.length - 1].id.toString();

        // Rate limit - Shopify allows 2 requests per second
        await new Promise(resolve => setTimeout(resolve, 500));

        // If we got fewer than the limit, we've reached the end
        if (orders.length < (params.limit || 250)) {
          hasMore = false;
        }
      }
    }

    return allOrders;
  }

  /**
   * Get products
   */
  async getProducts(params: {
    limit?: number;
    sinceId?: string;
    status?: string;
    productType?: string;
    vendor?: string;
  } = {}): Promise<any[]> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sinceId) queryParams.set('since_id', params.sinceId);
    if (params.status) queryParams.set('status', params.status);
    if (params.productType) queryParams.set('product_type', params.productType);
    if (params.vendor) queryParams.set('vendor', params.vendor);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const data = await this.request<{ products: any[] }>(`/products.json${query}`);

    return data.products || [];
  }

  /**
   * Get all products with pagination
   */
  async getAllProducts(params: {
    status?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const allProducts: any[] = [];
    let hasMore = true;
    let sinceId: string | undefined;

    while (hasMore) {
      const products = await this.getProducts({
        ...params,
        limit: params.limit || 250,
        sinceId,
      });

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...products);
        sinceId = products[products.length - 1].id.toString();
        await new Promise(resolve => setTimeout(resolve, 500));

        if (products.length < (params.limit || 250)) {
          hasMore = false;
        }
      }
    }

    return allProducts;
  }

  /**
   * Get customers
   */
  async getCustomers(params: {
    limit?: number;
    sinceId?: string;
    createdAtMin?: string;
    createdAtMax?: string;
    updatedAtMin?: string;
  } = {}): Promise<any[]> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sinceId) queryParams.set('since_id', params.sinceId);
    if (params.createdAtMin) queryParams.set('created_at_min', params.createdAtMin);
    if (params.createdAtMax) queryParams.set('created_at_max', params.createdAtMax);
    if (params.updatedAtMin) queryParams.set('updated_at_min', params.updatedAtMin);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const data = await this.request<{ customers: any[] }>(`/customers.json${query}`);

    return data.customers || [];
  }

  /**
   * Get all customers with pagination
   */
  async getAllCustomers(params: {
    limit?: number;
    createdAtMin?: string;
  } = {}): Promise<any[]> {
    const allCustomers: any[] = [];
    let hasMore = true;
    let sinceId: string | undefined;

    while (hasMore) {
      const customers = await this.getCustomers({
        ...params,
        limit: params.limit || 250,
        sinceId,
      });

      if (customers.length === 0) {
        hasMore = false;
      } else {
        allCustomers.push(...customers);
        sinceId = customers[customers.length - 1].id.toString();
        await new Promise(resolve => setTimeout(resolve, 500));

        if (customers.length < (params.limit || 250)) {
          hasMore = false;
        }
      }
    }

    return allCustomers;
  }

  /**
   * Get order count
   */
  async getOrderCount(params: {
    status?: string;
    createdAtMin?: string;
    createdAtMax?: string;
  } = {}): Promise<number> {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.set('status', params.status);
    if (params.createdAtMin) queryParams.set('created_at_min', params.createdAtMin);
    if (params.createdAtMax) queryParams.set('created_at_max', params.createdAtMax);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const data = await this.request<{ count: number }>(`/orders/count.json${query}`);

    return data.count || 0;
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    const data = await this.request<{ count: number }>('/products/count.json');
    return data.count || 0;
  }

  /**
   * Get customer count
   */
  async getCustomerCount(): Promise<number> {
    const data = await this.request<{ count: number }>('/customers/count.json');
    return data.count || 0;
  }

  /**
   * Get shop info
   */
  async getShop(): Promise<any> {
    const data = await this.request<{ shop: any }>('/shop.json');
    return data.shop;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; shop?: any }> {
    try {
      const shop = await this.getShop();
      return { success: true, shop };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Create Shopify client from environment variables
 */
export function createShopifyClient(): ShopifyClient | null {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopDomain) {
    console.warn('SHOPIFY_SHOP_DOMAIN not found in environment variables');
    return null;
  }

  if (!accessToken) {
    console.warn('SHOPIFY_ACCESS_TOKEN not found in environment variables');
    return null;
  }

  return new ShopifyClient({
    shopDomain,
    accessToken,
  });
}
