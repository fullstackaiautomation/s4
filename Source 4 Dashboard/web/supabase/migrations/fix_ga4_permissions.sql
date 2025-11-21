-- Enable RLS on GA4 tables
ALTER TABLE ga4_daily_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_page_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_ecommerce_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read data
CREATE POLICY "Allow read access for authenticated users" ON ga4_daily_traffic
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON ga4_traffic_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON ga4_page_performance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON ga4_ecommerce_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON ga4_conversions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access for authenticated users" ON ga4_sync_log
  FOR SELECT TO authenticated USING (true);
