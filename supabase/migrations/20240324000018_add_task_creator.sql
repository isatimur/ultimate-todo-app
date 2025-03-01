-- Add creator_id column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);

-- Set creator_id to user_id for existing tasks
UPDATE tasks SET creator_id = user_id WHERE creator_id IS NULL;

-- Make creator_id non-nullable
ALTER TABLE tasks ALTER COLUMN creator_id SET NOT NULL;

-- Function to automatically set creator_id on new tasks
CREATE OR REPLACE FUNCTION set_task_creator()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set creator_id before insert
CREATE TRIGGER set_task_creator_trigger
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_creator();

-- Update RLS policies to allow task deletion in any team where user is a member with appropriate role
DROP POLICY IF EXISTS "Users can delete tasks in their teams" ON tasks;
CREATE POLICY "Users can delete tasks in their teams"
  ON tasks FOR DELETE
  USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND (
        tm.role IN ('owner', 'admin')  -- Admins and owners can delete any task
        OR (
          tm.role = 'member'
          AND tasks.creator_id = auth.uid()  -- Members can only delete their own tasks
        )
      )
    )
  ); 