-- Enable Trigram for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  csc_code TEXT UNIQUE NOT NULL,
  suspicion_index INT DEFAULT 0
);

CREATE TABLE applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID REFERENCES operators(id),
  full_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  dob DATE NOT NULL,
  district TEXT NOT NULL,
  income_declared NUMERIC,
  income_extracted NUMERIC,
  scheme TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  fraud_score NUMERIC DEFAULT 0,
  flag_reason TEXT,
  cert_hash TEXT, -- Deprecated in favor of file_hash + certificate_id
  file_hash TEXT, -- Exact SHA-256 of the PDF/Image uploaded
  certificate_id TEXT, -- The extracted alphanumeric ID (e.g. RD1219003014905)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STATE DATABASE MOCK (DigiLocker / e-District Registry)
-- =====================================================
CREATE TABLE government_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id TEXT UNIQUE NOT NULL,
  doc_type TEXT NOT NULL,
  issued_to_name TEXT NOT NULL,
  issued_to_father TEXT NOT NULL,
  income_level NUMERIC,
  date_issued DATE,
  status TEXT DEFAULT 'active'
);

-- =====================================================
-- IMPROVED: Cross-District Duplicate Detection
-- Catches: Same person applying from DIFFERENT districts
-- Ignores: The record we just inserted (< 5 sec old)
-- =====================================================
CREATE OR REPLACE FUNCTION check_fraud_duplicate(
  p_name TEXT, p_father TEXT, p_dob DATE, p_district TEXT
) RETURNS NUMERIC AS $$
DECLARE
  highest_score NUMERIC := 0;
BEGIN
  SELECT MAX(
    (similarity(full_name, p_name) * 0.4) + 
    (similarity(father_name, p_father) * 0.4) +
    (CASE WHEN dob = p_dob THEN 0.2 ELSE 0 END)
  ) INTO highest_score
  FROM applicants
  WHERE created_at < NOW() - INTERVAL '5 seconds'  -- Exclude the record we JUST inserted
    AND (
      -- CASE 1: Same district, fuzzy name match (simple repeat application)
      (district = p_district AND similarity(full_name, p_name) > 0.6)
      OR
      -- CASE 2: DIFFERENT district, high name match (cross-district fraud!)
      (district != p_district AND similarity(full_name, p_name) > 0.7 AND dob = p_dob)
    );
  
  RETURN COALESCE(highest_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT (the operator portal submits)
CREATE POLICY "Allow public insert" ON applicants
  FOR INSERT TO anon WITH CHECK (true);

-- Policy: Anyone can SELECT (the BDO dashboard reads)
CREATE POLICY "Allow public select" ON applicants
  FOR SELECT TO anon USING (true);

-- Policy: Only authenticated users can DELETE (protects against anon API abuse)
-- For hackathon, we also allow anon delete so the "Clear All" button works
CREATE POLICY "Allow public delete" ON applicants
  FOR DELETE TO anon USING (true);
