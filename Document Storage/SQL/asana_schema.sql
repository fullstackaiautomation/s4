-- =====================================================
-- ASANA INTEGRATION DATABASE SCHEMA
-- Source 4 Industries Dashboard
-- =====================================================
-- Created: 2025-01-18
-- Purpose: Store Asana tasks, projects, and custom fields
--          for sales pipeline, customer service, and operations tracking
-- =====================================================

-- =====================================================
-- 1. ASANA WORKSPACES
-- =====================================================
CREATE TABLE IF NOT EXISTS asana_workspaces (
  id SERIAL PRIMARY KEY,
  gid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_organization BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asana_workspaces_gid ON asana_workspaces(gid);

-- =====================================================
-- 2. ASANA PROJECTS
-- =====================================================
CREATE TABLE IF NOT EXISTS asana_projects (
  id SERIAL PRIMARY KEY,
  gid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  workspace_gid TEXT,
  team_gid TEXT,
  archived BOOLEAN DEFAULT FALSE,
  color TEXT,
  notes TEXT,
  created_at TIMESTAMP,
  modified_at TIMESTAMP,
  synced_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_workspace
    FOREIGN KEY (workspace_gid)
    REFERENCES asana_workspaces(gid)
    ON DELETE CASCADE
);

CREATE INDEX idx_asana_projects_gid ON asana_projects(gid);
CREATE INDEX idx_asana_projects_workspace ON asana_projects(workspace_gid);
CREATE INDEX idx_asana_projects_archived ON asana_projects(archived);

-- =====================================================
-- 3. ASANA USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS asana_users (
  id SERIAL PRIMARY KEY,
  gid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  photo_url TEXT,
  workspace_gids TEXT[],
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asana_users_gid ON asana_users(gid);
CREATE INDEX idx_asana_users_email ON asana_users(email);

-- =====================================================
-- 4. ASANA TASKS (MAIN TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS asana_tasks (
  id SERIAL PRIMARY KEY,
  gid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,

  -- Relationships
  project_gid TEXT,
  project_name TEXT,
  parent_task_gid TEXT,
  assignee_gid TEXT,
  assignee_name TEXT,
  workspace_gid TEXT,

  -- Status & Timing
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  due_on DATE,
  due_at TIMESTAMP,
  start_on DATE,

  -- Metadata
  created_at TIMESTAMP,
  modified_at TIMESTAMP,
  tags TEXT[],
  followers_count INTEGER DEFAULT 0,
  num_subtasks INTEGER DEFAULT 0,
  num_likes INTEGER DEFAULT 0,

  -- Custom Fields (stored as JSONB for flexibility)
  custom_fields JSONB DEFAULT '{}'::JSONB,

  -- Parsed Custom Fields (for easy querying)
  -- These will be populated based on your Asana setup
  quote_amount NUMERIC,
  customer_name TEXT,
  close_probability NUMERIC,
  task_status TEXT,
  rep_name TEXT,
  deal_stage TEXT,
  lead_source TEXT,
  follow_up_date DATE,
  priority TEXT,

  -- Tracking
  synced_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_project
    FOREIGN KEY (project_gid)
    REFERENCES asana_projects(gid)
    ON DELETE SET NULL,
  CONSTRAINT fk_assignee
    FOREIGN KEY (assignee_gid)
    REFERENCES asana_users(gid)
    ON DELETE SET NULL,
  CONSTRAINT fk_workspace_task
    FOREIGN KEY (workspace_gid)
    REFERENCES asana_workspaces(gid)
    ON DELETE CASCADE
);

CREATE INDEX idx_asana_tasks_gid ON asana_tasks(gid);
CREATE INDEX idx_asana_tasks_project ON asana_tasks(project_gid);
CREATE INDEX idx_asana_tasks_assignee ON asana_tasks(assignee_gid);
CREATE INDEX idx_asana_tasks_completed ON asana_tasks(completed);
CREATE INDEX idx_asana_tasks_due_on ON asana_tasks(due_on);
CREATE INDEX idx_asana_tasks_created_at ON asana_tasks(created_at);
CREATE INDEX idx_asana_tasks_modified_at ON asana_tasks(modified_at);
CREATE INDEX idx_asana_tasks_quote_amount ON asana_tasks(quote_amount) WHERE quote_amount IS NOT NULL;
CREATE INDEX idx_asana_tasks_task_status ON asana_tasks(task_status);
CREATE INDEX idx_asana_tasks_custom_fields ON asana_tasks USING GIN (custom_fields);

-- =====================================================
-- 5. ASANA CUSTOM FIELD DEFINITIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS asana_custom_field_definitions (
  id SERIAL PRIMARY KEY,
  gid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  resource_type TEXT, -- text, number, enum, multi_enum, date, people
  field_type TEXT,
  description TEXT,
  precision INTEGER, -- for number fields
  enum_options JSONB, -- for enum/multi_enum fields
  workspace_gid TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asana_custom_field_defs_gid ON asana_custom_field_definitions(gid);
CREATE INDEX idx_asana_custom_field_defs_workspace ON asana_custom_field_definitions(workspace_gid);

-- =====================================================
-- 6. ASANA TASK STORIES (COMMENTS & ACTIVITY)
-- =====================================================
CREATE TABLE IF NOT EXISTS asana_task_stories (
  id SERIAL PRIMARY KEY,
  gid TEXT UNIQUE NOT NULL,
  task_gid TEXT NOT NULL,
  created_by_gid TEXT,
  created_by_name TEXT,
  created_at TIMESTAMP,
  resource_subtype TEXT, -- comment_added, task_status_changed, etc.
  text TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_task_story
    FOREIGN KEY (task_gid)
    REFERENCES asana_tasks(gid)
    ON DELETE CASCADE
);

CREATE INDEX idx_asana_stories_task ON asana_task_stories(task_gid);
CREATE INDEX idx_asana_stories_created_at ON asana_task_stories(created_at);

-- =====================================================
-- 7. ASANA SYNC LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS asana_sync_log (
  id SERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'projects', 'tasks'
  sync_started_at TIMESTAMP NOT NULL,
  sync_completed_at TIMESTAMP,
  records_synced INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors TEXT[],
  status TEXT NOT NULL, -- 'running', 'success', 'partial', 'failed'
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_asana_sync_log_started ON asana_sync_log(sync_started_at);
CREATE INDEX idx_asana_sync_log_status ON asana_sync_log(status);

-- =====================================================
-- 8. MATERIALIZED VIEW: SALES PIPELINE
-- =====================================================
-- Aggregated view of quotes/opportunities for sales dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS asana_sales_pipeline AS
SELECT
  t.gid,
  t.name AS deal_name,
  t.customer_name,
  t.quote_amount,
  t.close_probability,
  t.task_status AS deal_status,
  t.deal_stage,
  t.assignee_name AS sales_rep,
  t.lead_source,
  t.created_at,
  t.due_on AS expected_close_date,
  t.completed_at AS closed_date,
  t.completed,

  -- Calculated fields
  CASE
    WHEN t.completed = TRUE AND t.task_status ILIKE '%won%' THEN 'won'
    WHEN t.completed = TRUE AND t.task_status ILIKE '%lost%' THEN 'lost'
    WHEN t.due_on < CURRENT_DATE AND t.completed = FALSE THEN 'overdue'
    ELSE 'open'
  END AS pipeline_status,

  COALESCE(t.quote_amount, 0) * COALESCE(t.close_probability, 0) / 100 AS weighted_value,

  CASE
    WHEN t.due_on IS NOT NULL THEN t.due_on - CURRENT_DATE
    ELSE NULL
  END AS days_until_close,

  EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at)) / 86400 AS days_in_pipeline,

  p.name AS project_name,
  t.synced_at
FROM asana_tasks t
LEFT JOIN asana_projects p ON t.project_gid = p.gid
WHERE
  t.quote_amount IS NOT NULL
  OR p.name ILIKE '%quote%'
  OR p.name ILIKE '%sales%'
  OR p.name ILIKE '%pipeline%';

CREATE INDEX idx_asana_pipeline_rep ON asana_sales_pipeline(sales_rep);
CREATE INDEX idx_asana_pipeline_status ON asana_sales_pipeline(pipeline_status);
CREATE INDEX idx_asana_pipeline_stage ON asana_sales_pipeline(deal_stage);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_asana_sales_pipeline()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY asana_sales_pipeline;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. MATERIALIZED VIEW: REP PERFORMANCE
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS asana_rep_performance AS
SELECT
  sales_rep AS rep_name,
  COUNT(*) FILTER (WHERE pipeline_status = 'open') AS open_deals,
  COUNT(*) FILTER (WHERE pipeline_status = 'won') AS won_deals,
  COUNT(*) FILTER (WHERE pipeline_status = 'lost') AS lost_deals,
  COUNT(*) FILTER (WHERE pipeline_status = 'overdue') AS overdue_deals,

  SUM(quote_amount) FILTER (WHERE pipeline_status = 'open') AS open_pipeline_value,
  SUM(quote_amount) FILTER (WHERE pipeline_status = 'won') AS won_revenue,
  SUM(weighted_value) FILTER (WHERE pipeline_status = 'open') AS weighted_pipeline,

  ROUND(
    COUNT(*) FILTER (WHERE pipeline_status = 'won')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE pipeline_status IN ('won', 'lost'))::NUMERIC, 0) * 100,
    1
  ) AS close_rate_percent,

  ROUND(AVG(days_in_pipeline) FILTER (WHERE pipeline_status = 'won'), 1) AS avg_days_to_close,
  ROUND(AVG(quote_amount) FILTER (WHERE pipeline_status = 'won'), 2) AS avg_deal_size,

  MAX(synced_at) AS last_synced
FROM asana_sales_pipeline
WHERE sales_rep IS NOT NULL
GROUP BY sales_rep;

CREATE INDEX idx_asana_rep_perf_name ON asana_rep_performance(rep_name);

-- =====================================================
-- 10. MATERIALIZED VIEW: CUSTOMER SERVICE METRICS
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS asana_customer_service_metrics AS
SELECT
  DATE_TRUNC('day', t.created_at) AS date,
  COUNT(*) AS total_issues,
  COUNT(*) FILTER (WHERE t.completed = TRUE) AS resolved_issues,
  COUNT(*) FILTER (WHERE t.completed = FALSE) AS open_issues,
  COUNT(*) FILTER (WHERE t.due_on < CURRENT_DATE AND t.completed = FALSE) AS overdue_issues,

  ROUND(
    AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 3600)
    FILTER (WHERE t.completed = TRUE),
    1
  ) AS avg_resolution_time_hours,

  ROUND(
    COUNT(*) FILTER (WHERE t.completed = TRUE)::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100,
    1
  ) AS resolution_rate_percent,

  MAX(t.synced_at) AS last_synced
FROM asana_tasks t
JOIN asana_projects p ON t.project_gid = p.gid
WHERE
  p.name ILIKE '%customer service%'
  OR p.name ILIKE '%support%'
  OR p.name ILIKE '%issue%'
GROUP BY DATE_TRUNC('day', t.created_at);

CREATE INDEX idx_asana_cs_metrics_date ON asana_customer_service_metrics(date);

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to parse custom fields from JSONB into typed columns
CREATE OR REPLACE FUNCTION parse_asana_custom_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Parse quote amount (look for fields named "Quote Amount", "Deal Value", "Amount", etc.)
  NEW.quote_amount := COALESCE(
    (NEW.custom_fields->'Quote Amount'->>'number_value')::NUMERIC,
    (NEW.custom_fields->'Deal Value'->>'number_value')::NUMERIC,
    (NEW.custom_fields->'Amount'->>'number_value')::NUMERIC,
    NEW.quote_amount
  );

  -- Parse customer name
  NEW.customer_name := COALESCE(
    NEW.custom_fields->'Customer Name'->>'text_value',
    NEW.custom_fields->'Customer'->>'text_value',
    NEW.custom_fields->'Company'->>'text_value',
    NEW.customer_name
  );

  -- Parse close probability
  NEW.close_probability := COALESCE(
    (NEW.custom_fields->'Close Probability'->>'number_value')::NUMERIC,
    (NEW.custom_fields->'Probability'->>'number_value')::NUMERIC,
    NEW.close_probability
  );

  -- Parse status
  NEW.task_status := COALESCE(
    NEW.custom_fields->'Status'->>'text_value',
    NEW.custom_fields->'Deal Status'->>'text_value',
    NEW.task_status
  );

  -- Parse deal stage
  NEW.deal_stage := COALESCE(
    NEW.custom_fields->'Stage'->>'text_value',
    NEW.custom_fields->'Deal Stage'->>'text_value',
    NEW.deal_stage
  );

  -- Parse rep name (might be in custom fields instead of assignee)
  NEW.rep_name := COALESCE(
    NEW.custom_fields->'Sales Rep'->>'text_value',
    NEW.custom_fields->'Rep'->>'text_value',
    NEW.assignee_name,
    NEW.rep_name
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-parse custom fields on insert/update
DROP TRIGGER IF EXISTS trigger_parse_custom_fields ON asana_tasks;
CREATE TRIGGER trigger_parse_custom_fields
  BEFORE INSERT OR UPDATE ON asana_tasks
  FOR EACH ROW
  EXECUTE FUNCTION parse_asana_custom_fields();

-- =====================================================
-- 12. ROW LEVEL SECURITY (OPTIONAL)
-- =====================================================
-- Uncomment if you want to restrict access to Asana data

-- ALTER TABLE asana_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE asana_projects ENABLE ROW LEVEL SECURITY;

-- Example policy: Only allow authenticated users to read
-- CREATE POLICY "Allow authenticated users to read tasks"
--   ON asana_tasks FOR SELECT
--   TO authenticated
--   USING (true);

-- =====================================================
-- 13. REFRESH SCHEDULE (RUN MANUALLY OR VIA CRON)
-- =====================================================
-- Refresh materialized views after sync completes
-- Run this after each Asana sync:

-- SELECT refresh_asana_sales_pipeline();
-- REFRESH MATERIALIZED VIEW CONCURRENTLY asana_rep_performance;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY asana_customer_service_metrics;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Grant permissions (adjust role name as needed)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
