-- =====================================================
-- SHOPIFY INTEGRATION DATABASE SCHEMA
-- Source 4 Industries Dashboard
-- =====================================================
-- Created: 2025-11-18
-- Purpose: Store Shopify orders, products, customers, and analytics
-- =====================================================

-- =====================================================
-- 1. SHOPIFY ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_orders (
  id SERIAL PRIMARY KEY,
  order_id BIGINT UNIQUE NOT NULL,
  order_number TEXT,
  name TEXT, -- Order name like #1001
  email TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  closed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  processed_at TIMESTAMP,

  -- Financial
  currency TEXT DEFAULT 'USD',
  total_price NUMERIC(12,2),
  subtotal_price NUMERIC(12,2),
  total_tax NUMERIC(12,2),
  total_discounts NUMERIC(12,2),
  total_shipping NUMERIC(12,2),

  -- Status
  financial_status TEXT, -- pending, paid, refunded, voided
  fulfillment_status TEXT, -- fulfilled, partial, null (unfulfilled)

  -- Customer info
  customer_id BIGINT,
  customer_email TEXT,
  customer_first_name TEXT,
  customer_last_name TEXT,

  -- Shipping
  shipping_address_city TEXT,
  shipping_address_province TEXT,
  shipping_address_country TEXT,
  shipping_address_zip TEXT,

  -- Billing
  billing_address_city TEXT,
  billing_address_province TEXT,
  billing_address_country TEXT,

  -- Source
  source_name TEXT, -- web, pos, api
  landing_site TEXT,
  referring_site TEXT,

  -- Items
  line_items_count INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT,
  note TEXT,

  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopify_orders_order_id ON shopify_orders(order_id);
CREATE INDEX idx_shopify_orders_created ON shopify_orders(created_at);
CREATE INDEX idx_shopify_orders_customer ON shopify_orders(customer_id);
CREATE INDEX idx_shopify_orders_financial_status ON shopify_orders(financial_status);
CREATE INDEX idx_shopify_orders_fulfillment ON shopify_orders(fulfillment_status);

-- =====================================================
-- 2. SHOPIFY ORDER LINE ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_order_line_items (
  id SERIAL PRIMARY KEY,
  line_item_id BIGINT UNIQUE NOT NULL,
  order_id BIGINT NOT NULL,

  -- Product info
  product_id BIGINT,
  variant_id BIGINT,
  title TEXT,
  variant_title TEXT,
  sku TEXT,
  vendor TEXT,

  -- Quantities and pricing
  quantity INTEGER DEFAULT 1,
  price NUMERIC(12,2),
  total_discount NUMERIC(12,2) DEFAULT 0,

  -- Fulfillment
  fulfillment_status TEXT,
  fulfillable_quantity INTEGER,

  -- Tax
  taxable BOOLEAN DEFAULT TRUE,

  synced_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (order_id) REFERENCES shopify_orders(order_id) ON DELETE CASCADE
);

CREATE INDEX idx_shopify_line_items_order ON shopify_order_line_items(order_id);
CREATE INDEX idx_shopify_line_items_product ON shopify_order_line_items(product_id);
CREATE INDEX idx_shopify_line_items_sku ON shopify_order_line_items(sku);

-- =====================================================
-- 3. SHOPIFY PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_products (
  id SERIAL PRIMARY KEY,
  product_id BIGINT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body_html TEXT,
  vendor TEXT,
  product_type TEXT,
  handle TEXT,
  status TEXT, -- active, archived, draft
  tags TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP,

  -- Inventory summary
  total_inventory INTEGER DEFAULT 0,

  -- Pricing
  variants_count INTEGER DEFAULT 0,

  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopify_products_product_id ON shopify_products(product_id);
CREATE INDEX idx_shopify_products_vendor ON shopify_products(vendor);
CREATE INDEX idx_shopify_products_type ON shopify_products(product_type);
CREATE INDEX idx_shopify_products_status ON shopify_products(status);

-- =====================================================
-- 4. SHOPIFY PRODUCT VARIANTS
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_product_variants (
  id SERIAL PRIMARY KEY,
  variant_id BIGINT UNIQUE NOT NULL,
  product_id BIGINT NOT NULL,

  title TEXT,
  sku TEXT,
  barcode TEXT,

  price NUMERIC(12,2),
  compare_at_price NUMERIC(12,2),

  inventory_quantity INTEGER DEFAULT 0,
  inventory_policy TEXT, -- deny, continue

  weight NUMERIC(10,2),
  weight_unit TEXT,

  option1 TEXT,
  option2 TEXT,
  option3 TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  synced_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (product_id) REFERENCES shopify_products(product_id) ON DELETE CASCADE
);

CREATE INDEX idx_shopify_variants_product ON shopify_product_variants(product_id);
CREATE INDEX idx_shopify_variants_sku ON shopify_product_variants(sku);

-- =====================================================
-- 5. SHOPIFY CUSTOMERS
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_customers (
  id SERIAL PRIMARY KEY,
  customer_id BIGINT UNIQUE NOT NULL,

  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,

  state TEXT, -- enabled, disabled, invited, declined
  verified_email BOOLEAN DEFAULT FALSE,
  tax_exempt BOOLEAN DEFAULT FALSE,

  tags TEXT,
  note TEXT,

  -- Default address
  default_city TEXT,
  default_province TEXT,
  default_country TEXT,

  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopify_customers_customer_id ON shopify_customers(customer_id);
CREATE INDEX idx_shopify_customers_email ON shopify_customers(email);
CREATE INDEX idx_shopify_customers_created ON shopify_customers(created_at);

-- =====================================================
-- 6. SHOPIFY DAILY SALES SUMMARY
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_daily_sales (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,

  orders_count INTEGER DEFAULT 0,
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_tax NUMERIC(12,2) DEFAULT 0,
  total_shipping NUMERIC(12,2) DEFAULT 0,
  total_discounts NUMERIC(12,2) DEFAULT 0,

  average_order_value NUMERIC(12,2) DEFAULT 0,

  items_sold INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,

  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopify_daily_sales_date ON shopify_daily_sales(date);

-- =====================================================
-- 7. SHOPIFY SYNC LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_sync_log (
  id SERIAL PRIMARY KEY,
  sync_started_at TIMESTAMP NOT NULL,
  sync_completed_at TIMESTAMP,
  sync_type TEXT, -- orders, products, customers, all
  date_range_start TIMESTAMP,
  date_range_end TIMESTAMP,
  records_synced INTEGER DEFAULT 0,
  errors TEXT[],
  status TEXT NOT NULL, -- running, success, partial, failed
  UNIQUE(sync_started_at)
);

CREATE INDEX idx_shopify_sync_started ON shopify_sync_log(sync_started_at);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Sales by product
CREATE OR REPLACE VIEW shopify_product_sales AS
SELECT
  li.product_id,
  p.title as product_title,
  p.vendor,
  p.product_type,
  COUNT(DISTINCT li.order_id) as orders_count,
  SUM(li.quantity) as units_sold,
  SUM(li.price * li.quantity) as total_revenue,
  AVG(li.price) as avg_price
FROM shopify_order_line_items li
JOIN shopify_orders o ON li.order_id = o.order_id
LEFT JOIN shopify_products p ON li.product_id = p.product_id
WHERE o.financial_status = 'paid'
GROUP BY li.product_id, p.title, p.vendor, p.product_type;

-- Sales by customer
CREATE OR REPLACE VIEW shopify_customer_sales AS
SELECT
  o.customer_id,
  c.email,
  c.first_name,
  c.last_name,
  COUNT(DISTINCT o.order_id) as orders_count,
  SUM(o.total_price) as total_spent,
  AVG(o.total_price) as avg_order_value,
  MIN(o.created_at) as first_order,
  MAX(o.created_at) as last_order
FROM shopify_orders o
LEFT JOIN shopify_customers c ON o.customer_id = c.customer_id
WHERE o.financial_status = 'paid'
GROUP BY o.customer_id, c.email, c.first_name, c.last_name;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
