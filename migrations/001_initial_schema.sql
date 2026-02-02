-- Migration 001: Initial Patients Module
-- Author: Antigravity
-- Date: 2026-02-02

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  document_id text, -- CPF/RG
  birth_date date,
  contact_phone text,
  contact_email text,
  address jsonb, -- { street, number, city, state, zip }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Clinical Records (Anamnesis, Certificates, etc.)
CREATE TABLE IF NOT EXISTS clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('anamnesis', 'certificate', 'exam_upload')),
  title text, -- Optional title
  content jsonb DEFAULT '{}', -- Flexible content for forms
  created_at timestamptz DEFAULT now(),
  created_by uuid -- Reference to auth.users (optional if not strict enforced yet)
);

-- 3. Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('draft', 'presented', 'approved', 'rejected')) DEFAULT 'draft',
  total_value numeric(10, 2) DEFAULT 0,
  items jsonb DEFAULT '[]', -- Array of { name, value, obs }
  valid_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Patient Documents
CREATE TABLE IF NOT EXISTS patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL, -- Path in Storage Bucket
  file_type text,
  size_bytes bigint,
  uploaded_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_budgets_patient ON budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);

-- RLS Policies (Basic V1 - Authenticated Access)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Note: In a single-tenant database (one DB per client), "authenticated" means "user of this tenant".
-- So we can allow all authenticated users to read/write, or refine by role.
-- For V1, we simply allow access to authenticated users.

CREATE POLICY "Allow all authenticated access to patients" ON patients
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated access to clinical_records" ON clinical_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated access to budgets" ON budgets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated access to patient_documents" ON patient_documents
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
