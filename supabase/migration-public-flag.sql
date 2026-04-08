-- Add public/private and flag columns to subjects
ALTER TABLE subjects ADD COLUMN is_public BOOLEAN DEFAULT false;
ALTER TABLE subjects ADD COLUMN flagged BOOLEAN DEFAULT false;

-- Allow anyone to SELECT public subjects (no auth needed)
CREATE POLICY "Anyone can view public subjects" ON subjects
  FOR SELECT USING (is_public = true);

-- Allow anyone to SELECT cards belonging to public subjects
CREATE POLICY "Anyone can view cards of public subjects" ON cards
  FOR SELECT USING (
    subject_id IN (SELECT id FROM subjects WHERE is_public = true)
  );
