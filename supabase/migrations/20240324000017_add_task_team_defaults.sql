-- Function to get user's personal team
CREATE OR REPLACE FUNCTION get_personal_team_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id
  FROM teams
  WHERE owner_id = p_user_id
  AND is_personal = true
  LIMIT 1;

  RETURN v_team_id;
END;
$$ LANGUAGE plpgsql;

-- Function to set default team for new tasks
CREATE OR REPLACE FUNCTION set_default_team()
RETURNS TRIGGER AS $$
BEGIN
  -- If team_id is not set, use personal team
  IF NEW.team_id IS NULL THEN
    NEW.team_id := get_personal_team_id(auth.uid());
  END IF;

  -- If still null (shouldn't happen due to trigger), raise error
  IF NEW.team_id IS NULL THEN
    RAISE EXCEPTION 'No team specified and no personal team found';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set default team before insert
CREATE TRIGGER set_default_team_trigger
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_default_team();

-- Update RLS policies to allow task creation in any team where user is a member
DROP POLICY IF EXISTS "Users can create tasks in their personal team" ON tasks;
CREATE POLICY "Users can create tasks in their teams"
  ON tasks FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update RLS policies to allow task updates in any team where user is a member
DROP POLICY IF EXISTS "Users can update tasks in their personal team" ON tasks;
CREATE POLICY "Users can update tasks in their teams"
  ON tasks FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update RLS policies to allow task deletion in any team where user is a member with appropriate role
DROP POLICY IF EXISTS "Users can delete tasks in their personal team" ON tasks;
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
          AND EXISTS (  -- Members can only delete their own tasks
            SELECT 1 FROM tasks t
            WHERE t.id = tasks.id
            AND t.creator_id = auth.uid()
          )
        )
      )
    )
  ); 