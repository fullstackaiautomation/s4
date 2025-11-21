-- Enable RLS
ALTER TABLE gsc_site_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_page_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_device_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_country_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (read-only)
CREATE POLICY "Allow authenticated read access" ON gsc_site_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON gsc_search_queries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON gsc_page_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON gsc_device_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON gsc_country_performance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON gsc_sync_log FOR SELECT TO authenticated USING (true);

-- Create policies for service role (full access)
CREATE POLICY "Allow service role full access" ON gsc_site_performance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON gsc_search_queries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON gsc_page_performance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON gsc_device_performance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON gsc_country_performance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON gsc_sync_log FOR ALL TO service_role USING (true) WITH CHECK (true);
