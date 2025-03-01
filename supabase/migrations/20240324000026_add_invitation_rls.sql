-- Enable RLS for team_invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Team owners can manage invitations" ON team_invitations;

-- Create policies for team_invitations
CREATE POLICY "Users can view their invitations"
    ON team_invitations FOR SELECT
    USING (
        email = auth.jwt()->>'email'
        OR
        team_id IN (
            SELECT id FROM teams
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Team owners can create invitations"
    ON team_invitations FOR INSERT
    WITH CHECK (
        is_team_owner(team_id, auth.uid())
    );

CREATE POLICY "Team owners can update invitations"
    ON team_invitations FOR UPDATE
    USING (
        is_team_owner(team_id, auth.uid())
        OR
        (
            status = 'pending'
            AND email = auth.jwt()->>'email'
        )
    )
    WITH CHECK (
        is_team_owner(team_id, auth.uid())
        OR
        (
            status = 'pending'
            AND email = auth.jwt()->>'email'
        )
    );

CREATE POLICY "Team owners can delete invitations"
    ON team_invitations FOR DELETE
    USING (
        is_team_owner(team_id, auth.uid())
    ); 