-- Create all_quotes table for Source 4 Industries quotes data
-- This table stores historical and current quote/order data from Asana exports

CREATE TABLE IF NOT EXISTS all_quotes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Asana metadata
  assignee TEXT,
  name TEXT,
  created_at_year INTEGER,
  created_at_ym TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  task_id TEXT UNIQUE NOT NULL, -- Unique identifier from Asana
  completed_at TIMESTAMP WITH TIME ZONE,
  last_modified TIMESTAMP WITH TIME ZONE,
  section_column TEXT,
  assignee_email TEXT,
  start_date DATE,
  due_date DATE,
  tags TEXT,
  notes TEXT,
  projects TEXT,
  parent_task TEXT,
  blocked_by TEXT,
  blocking TEXT,

  -- Quote/Order fields
  quote_number TEXT,
  amount NUMERIC(12, 2),
  follow_up_via TEXT,
  follow_up TEXT,
  quote_sent TIMESTAMP WITH TIME ZONE,
  status_of_quote TEXT,
  inquiry_date DATE,
  turned_to_order TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  shipping_address TEXT,
  delivery TEXT,
  rep TEXT,
  inquiry_type TEXT,
  vendor TEXT,
  customer_po TEXT,
  terms TEXT,
  freight TEXT,
  ships_from TEXT,
  notes_field TEXT,
  payment_info TEXT,
  customer_first_name TEXT,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  quote_status TEXT,

  -- Audit timestamps
  created_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_all_quotes_task_id ON all_quotes(task_id);
CREATE INDEX IF NOT EXISTS idx_all_quotes_quote_number ON all_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_all_quotes_rep ON all_quotes(rep);
CREATE INDEX IF NOT EXISTS idx_all_quotes_vendor ON all_quotes(vendor);
CREATE INDEX IF NOT EXISTS idx_all_quotes_status ON all_quotes(quote_status);
CREATE INDEX IF NOT EXISTS idx_all_quotes_created_at ON all_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_all_quotes_inquiry_date ON all_quotes(inquiry_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE all_quotes ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to all_quotes" ON all_quotes
  FOR SELECT
  USING (true);

-- Allow insert for service role only (via scripts)
CREATE POLICY "Allow insert for service role" ON all_quotes
  FOR INSERT
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_all_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at_db = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER all_quotes_updated_at
  BEFORE UPDATE ON all_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_all_quotes_updated_at();

-- Add comments for documentation
COMMENT ON TABLE all_quotes IS 'Historical and current quote/order data from Asana exports';
COMMENT ON COLUMN all_quotes.task_id IS 'Unique task identifier from Asana - used to prevent duplicates';
COMMENT ON COLUMN all_quotes.quote_number IS 'Quote number from the quote tracking system';
COMMENT ON COLUMN all_quotes.amount IS 'Quote value in USD';
COMMENT ON COLUMN all_quotes.quote_status IS 'Current status of the quote (open, won, lost, etc.)';
