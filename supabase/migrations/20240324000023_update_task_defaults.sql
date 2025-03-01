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
CREATE OR REPLACE FUNCTION set_task_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Set creator_id if not provided
  IF NEW.creator_id IS NULL THEN
    NEW.creator_id := auth.uid();
  END IF;

  -- Set user_id if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  -- If team_id is not set, use personal team
  IF NEW.team_id IS NULL THEN
    NEW.team_id := get_personal_team_id(auth.uid());
  END IF;

  -- Set default status if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'To Do';
  END IF;

  -- Set default priority if not provided
  IF NEW.priority IS NULL THEN
    NEW.priority := 'Medium';
  END IF;

  -- Set timestamps
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  
  NEW.updated_at := NOW();

  -- If status is Complete and completed_at is not set
  IF NEW.status = 'Complete' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;

  -- If status is not Complete, ensure completed_at and completed are NULL/false
  IF NEW.status != 'Complete' THEN
    NEW.completed_at := NULL;
    NEW.completed := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task defaults
DROP TRIGGER IF EXISTS set_task_defaults_trigger ON tasks;
CREATE TRIGGER set_task_defaults_trigger
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_defaults(); 