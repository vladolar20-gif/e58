CREATE TABLE IF NOT EXISTS rank_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  old_rank text NOT NULL,
  new_rank text NOT NULL,
  reason text NOT NULL,
  changed_by text,
  changed_by_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON rank_history TO authenticated;

DROP POLICY IF EXISTS "select_rank_history" ON rank_history;
CREATE POLICY "select_rank_history"
ON rank_history FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_rank_history" ON rank_history;
CREATE POLICY "insert_rank_history"
ON rank_history FOR INSERT
TO authenticated WITH CHECK (true);

-- Add proof_url to sanctions and staff_sanctions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sanctions' AND column_name = 'proof_url') THEN
    ALTER TABLE sanctions ADD COLUMN proof_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_sanctions' AND column_name = 'proof_url') THEN
    ALTER TABLE staff_sanctions ADD COLUMN proof_url text;
  END IF;
END $$;