-- Add timestamp columns to team_invitations
ALTER TABLE team_invitations 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_team_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_team_invitation_timestamp ON team_invitations;
CREATE TRIGGER update_team_invitation_timestamp
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_invitation_timestamp();

-- Update existing rows to have timestamps
UPDATE team_invitations 
SET 
  created_at = COALESCE(invited_at, NOW()),
  updated_at = COALESCE(invited_at, NOW())
WHERE created_at IS NULL; 