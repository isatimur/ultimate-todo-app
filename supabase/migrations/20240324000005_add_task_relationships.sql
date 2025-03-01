-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, team_id)
);

-- Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(task_id, user_id)
);

-- Add team_id to projects table if it doesn't exist
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add RLS policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Team members policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'team_members' 
        AND policyname = 'Users can view teams they are members of'
    ) THEN
        CREATE POLICY "Users can view teams they are members of"
            ON team_members FOR SELECT
            USING (auth.uid() IN (
                SELECT user_id FROM team_members WHERE team_id = team_members.team_id
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'team_members' 
        AND policyname = 'Team owners and admins can manage team members'
    ) THEN
        CREATE POLICY "Team owners and admins can manage team members"
            ON team_members FOR ALL
            USING (auth.uid() IN (
                SELECT user_id FROM team_members 
                WHERE team_id = team_members.team_id 
                AND role IN ('owner', 'admin')
            ));
    END IF;
END $$;

-- Task assignments policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Users can view task assignments for their teams'
    ) THEN
        CREATE POLICY "Users can view task assignments for their teams"
            ON task_assignments FOR SELECT
            USING (auth.uid() IN (
                SELECT tm.user_id FROM team_members tm
                JOIN projects p ON p.team_id = tm.team_id
                JOIN tasks t ON t.project_id = p.id
                WHERE t.id = task_assignments.task_id
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Users can manage task assignments for their teams'
    ) THEN
        CREATE POLICY "Users can manage task assignments for their teams"
            ON task_assignments FOR ALL
            USING (auth.uid() IN (
                SELECT tm.user_id FROM team_members tm
                JOIN projects p ON p.team_id = tm.team_id
                JOIN tasks t ON t.project_id = p.id
                WHERE t.id = task_assignments.task_id
                AND tm.role IN ('owner', 'admin')
            ));
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_team_members_user_id'
    ) THEN
        CREATE INDEX idx_team_members_user_id ON team_members(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_team_members_team_id'
    ) THEN
        CREATE INDEX idx_team_members_team_id ON team_members(team_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_task_assignments_task_id'
    ) THEN
        CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_task_assignments_user_id'
    ) THEN
        CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_projects_team_id'
    ) THEN
        CREATE INDEX idx_projects_team_id ON projects(team_id);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE team_members IS 'Table storing team membership information';
COMMENT ON TABLE task_assignments IS 'Table storing task assignments to team members'; 