-- Migration 003: Create Text Presets
-- Type: DDL
-- Description: Creates a table to store reusable text snippets (favorites) for various system categories.

CREATE TABLE IF NOT EXISTS text_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- e.g., 'budget_condition', 'anamnesis_obs'
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookup by category
CREATE INDEX IF NOT EXISTS idx_text_presets_category ON text_presets(category);

-- RLS Policies
ALTER TABLE text_presets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage their tenant's presets
-- (In a real multi-tenant setup with shared DB, we would filter by tenant_id. 
-- Here, with 1 DB per tenant, 'authenticated' implies access to the tenant's data.)

CREATE POLICY "Allow all authenticated access to text_presets" ON text_presets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
