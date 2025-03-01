-- Ensure teams table exists with all required columns
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_personal BOOLEAN DEFAULT false,
    settings JSONB DEFAULT jsonb_build_object(
        'default_task_view', 'list',
        'task_statuses', ARRAY['To Do', 'In Progress', 'In Review', 'Complete'],
        'task_priorities', ARRAY['Low', 'Medium', 'High', 'Urgent']
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure team_members table exists with correct relationships
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage team members" ON team_members;

-- Create comprehensive RLS policies for teams
CREATE POLICY "Users can view teams they belong to"
    ON teams FOR SELECT
    USING (
        id IN (
            SELECT team_id 
            FROM team_members 
            WHERE user_id = auth.uid()
        )
        OR
        owner_id = auth.uid()
    );

CREATE POLICY "Team owners can update their teams"
    ON teams FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
    ON teams FOR DELETE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create teams"
    ON teams FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Create comprehensive RLS policies for team_members
CREATE POLICY "Users can view team members"
    ON team_members FOR SELECT
    USING (
        team_id IN (
            SELECT id 
            FROM teams 
            WHERE owner_id = auth.uid()
            OR id IN (
                SELECT team_id 
                FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Team owners can manage team members"
    ON team_members FOR ALL
    USING (
        team_id IN (
            SELECT id 
            FROM teams 
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        team_id IN (
            SELECT id 
            FROM teams 
            WHERE owner_id = auth.uid()
        )
    );

-- Create function to get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    team_role TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        tm.role as team_role,
        t.owner_id = p_user_id as is_owner
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    WHERE t.owner_id = p_user_id
    OR tm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get team analytics
CREATE OR REPLACE FUNCTION get_team_analytics(p_team_id UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    in_progress_tasks BIGINT,
    overdue_tasks BIGINT,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_tasks,
        COUNT(*) FILTER (WHERE status = 'Complete')::BIGINT as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'In Progress')::BIGINT as in_progress_tasks,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'Complete')::BIGINT as overdue_tasks,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE status = 'Complete')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as completion_rate
    FROM tasks
    WHERE team_id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 