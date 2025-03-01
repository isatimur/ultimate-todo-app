-- Drop existing policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON team_members;

-- Create helper function for team membership check
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = team_uuid
        AND (
            t.owner_id = user_uuid
            OR EXISTS (
                SELECT 1 FROM team_members tm
                WHERE tm.team_id = team_uuid
                AND tm.user_id = user_uuid
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function for team ownership check
CREATE OR REPLACE FUNCTION is_team_owner(team_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = team_uuid
        AND t.owner_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams policies
CREATE POLICY "Users can view their teams"
    ON teams FOR SELECT
    USING (
        owner_id = auth.uid()
        OR
        id IN (
            SELECT team_id
            FROM team_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create teams"
    ON teams FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update teams"
    ON teams FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete teams"
    ON teams FOR DELETE
    USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Users can view team members"
    ON team_members FOR SELECT
    USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Team owners can insert members"
    ON team_members FOR INSERT
    WITH CHECK (is_team_owner(team_id, auth.uid()));

CREATE POLICY "Team owners can update members"
    ON team_members FOR UPDATE
    USING (is_team_owner(team_id, auth.uid()))
    WITH CHECK (is_team_owner(team_id, auth.uid()));

CREATE POLICY "Team owners can delete members"
    ON team_members FOR DELETE
    USING (is_team_owner(team_id, auth.uid())); 