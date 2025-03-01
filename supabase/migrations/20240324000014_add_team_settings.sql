-- Add team settings JSONB column
ALTER TABLE teams ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "default_task_view": "list",
  "task_statuses": ["To Do", "In Progress", "In Review", "Complete"],
  "task_priorities": ["Low", "Medium", "High", "Urgent"]
}'::jsonb;

-- Ensure team_id is required for tasks
ALTER TABLE tasks ALTER COLUMN team_id SET NOT NULL;

-- Add team-based RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their teams"
  ON tasks FOR SELECT
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins and owners can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_id = NEW.team_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Team admins and owners can update tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_id = OLD.team_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_id = NEW.team_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Team admins and owners can delete tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_id = team_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);

-- Add foreign key constraints if not exists
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_team
  FOREIGN KEY (team_id)
  REFERENCES teams(id)
  ON DELETE CASCADE;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_assignee
  FOREIGN KEY (assignee_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Add check constraints for task status and priority
ALTER TABLE tasks
  ADD CONSTRAINT check_task_status
  CHECK (
    status = ANY (ARRAY['To Do', 'In Progress', 'In Review', 'Complete'])
  );

ALTER TABLE tasks
  ADD CONSTRAINT check_task_priority
  CHECK (
    priority = ANY (ARRAY['Low', 'Medium', 'High', 'Urgent'])
  ); 