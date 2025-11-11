-- Supabase Schema for All Time Sales Data
-- Table to store complete sales transaction data from ALL TIME SALES DATABASE
-- Data from: All Time Data/ALL TIME SALES DATABASE (1).xlsx

CREATE TABLE IF NOT EXISTS all_time_sales (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Information
  customer TEXT,  -- Customer name
  rep TEXT,  -- Sales representative name
  online_local TEXT,  -- 'Online' or 'Local' sales channel
  user_email TEXT,  -- Email of user who processed sale

  -- Temporal Information
  month TEXT NOT NULL,  -- Format: YYYY-MM (e.g., "2024-10")
  year INTEGER NOT NULL,  -- Year extracted from date
  tracked_month TEXT,  -- 'X' or 'Y' or NULL
  date TIMESTAMP WITH TIME ZONE,  -- Full transaction date

  -- Transaction Information
  invoice_number TEXT,  -- Invoice identifier (e.g., "#33126")
  sku TEXT NOT NULL,  -- Product SKU identifier
  description TEXT,  -- Product description/title

  -- Product Information
  product_category TEXT,  -- Specific product category
  overall_product_category TEXT,  -- Broad product category
  vendor TEXT NOT NULL,  -- Vendor/manufacturer name

  -- Order Details
  order_quantity DECIMAL(10, 2),  -- Quantity ordered
  sales_each DECIMAL(10, 2),  -- Price per unit
  sales_total DECIMAL(10, 2),  -- Total sales amount for this line
  cost_each DECIMAL(10, 2),  -- Cost per unit
  cost_total DECIMAL(10, 2),  -- Total cost for this line

  -- Financial Metrics
  orders DECIMAL(10, 2),  -- Number of orders
  shipping DECIMAL(10, 2),  -- Shipping cost
  discount DECIMAL(10, 2),  -- Discount amount
  refunds DECIMAL(10, 2),  -- Refund amount
  invoice_total DECIMAL(10, 2),  -- Total invoice amount
  profit_total DECIMAL(10, 2),  -- Total profit
  roi DECIMAL(8, 4),  -- Return on investment ratio
  ad_spend DECIMAL(10, 2),  -- Associated advertising spend

  -- Location Information
  state TEXT,  -- State code
  region TEXT,  -- Region classification

  -- Shipping Information
  shipping_method TEXT,  -- Shipping method used
  route DECIMAL(10, 2),  -- Route code/number

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_month_format CHECK (month ~ '^\d{4}-\d{2}$')
  -- Note: Removed strict positive constraints to allow for returns/credits (negative values)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_all_time_sales_month ON all_time_sales(month DESC);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_year ON all_time_sales(year DESC);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_sku ON all_time_sales(sku);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_vendor ON all_time_sales(vendor);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_category ON all_time_sales(product_category);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_rep ON all_time_sales(rep);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_customer ON all_time_sales(customer);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_month_vendor ON all_time_sales(month, vendor);
CREATE INDEX IF NOT EXISTS idx_all_time_sales_month_category ON all_time_sales(month, product_category);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_all_time_sales_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER all_time_sales_updated_at_trigger
  BEFORE UPDATE ON all_time_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_all_time_sales_timestamp();

-- Create helpful views for common queries

-- View: Monthly sales summary
CREATE OR REPLACE VIEW monthly_sales_summary AS
SELECT
  month,
  year,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT invoice_number) as unique_invoices,
  COUNT(DISTINCT customer) as unique_customers,
  COUNT(DISTINCT sku) as unique_skus,
  COUNT(DISTINCT vendor) as unique_vendors,
  SUM(order_quantity) as total_quantity,
  SUM(sales_total) as total_sales,
  SUM(cost_total) as total_cost,
  SUM(shipping) as total_shipping,
  SUM(discount) as total_discount,
  SUM(refunds) as total_refunds,
  SUM(invoice_total) as total_revenue,
  SUM(profit_total) as total_profit,
  SUM(ad_spend) as total_ad_spend,
  ROUND(AVG(roi), 4) as avg_roi,
  ROUND(SUM(profit_total) / NULLIF(SUM(ad_spend), 0), 2) as profit_per_ad_dollar
FROM all_time_sales
GROUP BY month, year
ORDER BY month DESC;

-- View: Vendor sales performance
CREATE OR REPLACE VIEW vendor_sales_performance AS
SELECT
  vendor,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT month) as months_active,
  COUNT(DISTINCT sku) as unique_skus,
  COUNT(DISTINCT customer) as unique_customers,
  SUM(order_quantity) as total_quantity,
  SUM(sales_total) as total_sales,
  SUM(cost_total) as total_cost,
  SUM(shipping) as total_shipping,
  SUM(profit_total) as total_profit,
  SUM(ad_spend) as total_ad_spend,
  ROUND(AVG(roi), 4) as avg_roi,
  ROUND(SUM(profit_total) / NULLIF(SUM(sales_total), 0), 4) as profit_margin
FROM all_time_sales
WHERE vendor IS NOT NULL
GROUP BY vendor
ORDER BY total_sales DESC;

-- View: Product category sales performance
CREATE OR REPLACE VIEW category_sales_performance AS
SELECT
  product_category,
  overall_product_category,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT sku) as unique_skus,
  COUNT(DISTINCT vendor) as unique_vendors,
  COUNT(DISTINCT month) as months_active,
  SUM(order_quantity) as total_quantity,
  SUM(sales_total) as total_sales,
  SUM(cost_total) as total_cost,
  SUM(profit_total) as total_profit,
  SUM(ad_spend) as total_ad_spend,
  ROUND(SUM(profit_total) / NULLIF(SUM(sales_total), 0), 4) as profit_margin,
  ROUND(AVG(roi), 4) as avg_roi
FROM all_time_sales
WHERE product_category IS NOT NULL
GROUP BY product_category, overall_product_category
ORDER BY total_sales DESC;

-- View: Sales by channel (Online vs Local)
CREATE OR REPLACE VIEW sales_by_channel AS
SELECT
  month,
  online_local,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT customer) as unique_customers,
  SUM(sales_total) as total_sales,
  SUM(profit_total) as total_profit,
  SUM(ad_spend) as total_ad_spend,
  ROUND(AVG(roi), 4) as avg_roi
FROM all_time_sales
WHERE online_local IS NOT NULL
GROUP BY month, online_local
ORDER BY month DESC, online_local;
