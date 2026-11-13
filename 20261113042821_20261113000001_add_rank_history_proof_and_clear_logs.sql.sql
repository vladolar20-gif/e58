/*
# Rank History, Proof Columns, Clear Logs, Clock-in Log Type

1. New Tables
- `rank_history` — Tracks every promotion/demotion with old rank, new rank, reason, who made the change, and timestamp.

2. Modified Tables
- `sanctions` — Add `proof_url` (text, nullable) for optional evidence link.
- `staff_sanctions` — Add `proof_url` (text, nullable) for optional evidence link.
- `logs` — Add `clock_in` and `clock_out` and `shift_delete` and `shift_reset` log types (data only, no schema change needed since log_type is text).

3. Data Changes
- DELETE all rows from `logs` table to start fresh.
- DELETE all rows from `rank_history` if any (new table).

4. Security
- Enable RLS on `rank_history`.
- Grant SELECT, INSERT to authenticated.
- Policies: any authenticated can read (for transparency), authenticated can insert (the app controls who inserts via frontend permission checks).
*/

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

-- Add proof_url to sanctions and staff_sanctions (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sanctions' AND column_name = 'proof_url') THEN
    ALTER TABLE sanctions ADD COLUMN proof_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_sanctions' AND column_name = 'proof_url') THEN
    ALTER TABLE staff_sanctions ADD COLUMN proof_url text;
  END IF;
END $$;

-- Clear all existing logs to start fresh
DELETE FROM logs;

-- Grant select on the new columns (implicit since table-level grant exists, but ensure)
GRANT SELECT ON sanctions TO authenticated;
GRANT SELECT ON staff_sanctions TO authenticated;
