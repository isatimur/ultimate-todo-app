-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that depend on task_id and project_id
DROP POLICY IF EXISTS "Users can view task assignments for their teams" ON task_assignments;
DROP POLICY IF EXISTS "Users can manage task assignments for their teams" ON task_assignments;
DROP POLICY IF EXISTS "Users can access projects through tasks" ON projects;

-- Fix project_id references
ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;

ALTER TABLE tasks
    ALTER COLUMN project_id TYPE INTEGER USING project_id::INTEGER,
    ADD CONSTRAINT tasks_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE SET NULL;

-- Recreate project access policy
CREATE POLICY "Users can access projects through tasks"
    ON projects FOR SELECT
    USING (
        id IN (
            SELECT project_id FROM tasks WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

-- Recreate task assignment policies
CREATE POLICY "Users can view task assignments for their teams"
    ON task_assignments FOR SELECT
    USING (auth.uid() IN (
        SELECT tm.user_id FROM team_members tm
        JOIN projects p ON p.team_id = tm.team_id
        JOIN tasks t ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
    ));

CREATE POLICY "Users can manage task assignments for their teams"
    ON task_assignments FOR ALL
    USING (auth.uid() IN (
        SELECT tm.user_id FROM team_members tm
        JOIN projects p ON p.team_id = tm.team_id
        JOIN tasks t ON t.project_id = p.id
        WHERE t.id = task_assignments.task_id
        AND tm.role IN ('owner', 'admin')
    ));

-- Add RLS policies for teams
CREATE POLICY "Team members can view their teams"
    ON teams FOR SELECT
    USING (
        id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners and admins can manage teams"
    ON teams FOR ALL
    USING (
        id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_teams_id ON teams(id);

-- Add comments
COMMENT ON TABLE teams IS 'Table storing team information';
COMMENT ON COLUMN teams.id IS 'The unique identifier for the team';
COMMENT ON COLUMN teams.name IS 'The name of the team';
COMMENT ON COLUMN teams.description IS 'Optional description of the team';
COMMENT ON COLUMN teams.owner_id IS 'The user ID of the team owner';
COMMENT ON COLUMN teams.created_at IS 'When the team was created';
COMMENT ON COLUMN teams.updated_at IS 'When the team was last updated'; 