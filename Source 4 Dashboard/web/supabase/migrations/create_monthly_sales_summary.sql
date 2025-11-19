-- Create materialized view for monthly sales aggregates
-- This dramatically improves dashboard load times by pre-aggregating data

DROP MATERIALIZED VIEW IF EXISTS monthly_sales_summary;

CREATE MATERIALIZED VIEW monthly_sales_summary AS
SELECT
  date_trunc('month', date)::date as month,
  vendor,
  rep,
  SUM(COALESCE(invoice_total, 0)) as revenue,
  SUM(COALESCE(profit_total, 0)) as profit,
  SUM(COALESCE(orders, 0)) as orders,
  SUM(COALESCE(order_quantity, 0)) as order_quantity,
  COUNT(*) as record_count
FROM all_time_sales
WHERE date >= '2022-11-01'
  AND date IS NOT NULL
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

-- Create index for fast filtering
CREATE INDEX idx_monthly_sales_month ON monthly_sales_summary(month);
CREATE INDEX idx_monthly_sales_vendor ON monthly_sales_summary(vendor);
CREATE INDEX idx_monthly_sales_rep ON monthly_sales_summary(rep);

-- Grant access
GRANT SELECT ON monthly_sales_summary TO anon;
GRANT SELECT ON monthly_sales_summary TO authenticated;

-- To refresh this view after data imports, run:
-- REFRESH MATERIALIZED VIEW monthly_sales_summary;