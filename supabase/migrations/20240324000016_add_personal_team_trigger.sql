-- Function to create personal team
CREATE OR REPLACE FUNCTION create_personal_team()
RETURNS TRIGGER AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Create personal team
  INSERT INTO teams (
    name,
    description,
    owner_id,
    created_at,
    updated_at,
    settings
  ) VALUES (
    NEW.raw_user_meta_data->>'full_name' || '''s Personal Team',
    'Personal workspace for ' || NEW.raw_user_meta_data->>'full_name',
    NEW.id,
    NOW(),
    NOW(),
    '{
      "default_task_view": "list",
      "task_statuses": ["To Do", "In Progress", "In Review", "Complete"],
      "task_priorities": ["Low", "Medium", "High", "Urgent"],
      "is_personal": true
    }'::jsonb
  ) RETURNING id INTO v_team_id;

  -- Add user as team owner
  INSERT INTO team_members (
    team_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    v_team_id,
    NEW.id,
    'owner',
    NOW()
  );

  -- Update existing tasks without team_id to use the new personal team
  UPDATE tasks
  SET team_id = v_team_id
  WHERE user_id = NEW.id
  AND team_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users
CREATE OR REPLACE TRIGGER create_personal_team_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_team();

-- Add is_personal flag to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT false;

-- Update RLS policies to allow task creation in personal team
CREATE POLICY "Users can create tasks in their personal team"
  ON tasks FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT t.id 
      FROM teams t
      WHERE t.owner_id = auth.uid()
      AND t.is_personal = true
    )
  );

-- Update RLS policies to allow task updates in personal team
CREATE POLICY "Users can update tasks in their personal team"
  ON tasks FOR UPDATE
  USING (
    team_id IN (
      SELECT t.id 
      FROM teams t
      WHERE t.owner_id = auth.uid()
      AND t.is_personal = true
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT t.id 
      FROM teams t
      WHERE t.owner_id = auth.uid()
      AND t.is_personal = true
    )
  );

-- Update RLS policies to allow task deletion in personal team
CREATE POLICY "Users can delete tasks in their personal team"
  ON tasks FOR DELETE
  USING (
    team_id IN (
      SELECT t.id 
      FROM teams t
      WHERE t.owner_id = auth.uid()
      AND t.is_personal = true
    )
  );

-- Create personal teams for existing users
DO $$
DECLARE
  user_record RECORD;
  v_team_id UUID;
BEGIN
  FOR user_record IN SELECT * FROM auth.users
  LOOP
    -- Check if user already has a personal team
    IF NOT EXISTS (
      SELECT 1 FROM teams 
      WHERE owner_id = user_record.id 
      AND is_personal = true
    ) THEN
      -- Create personal team
      INSERT INTO teams (
        name,
        description,
        owner_id,
        created_at,
        updated_at,
        settings,
        is_personal
      ) VALUES (
        COALESCE(user_record.raw_user_meta_data->>'full_name', 'User') || '''s Personal Team',
        'Personal workspace for ' || COALESCE(user_record.raw_user_meta_data->>'full_name', 'User'),
        user_record.id,
        NOW(),
        NOW(),
        '{
          "default_task_view": "list",
          "task_statuses": ["To Do", "In Progress", "In Review", "Complete"],
          "task_priorities": ["Low", "Medium", "High", "Urgent"],
          "is_personal": true
        }'::jsonb,
        true
      ) RETURNING id INTO v_team_id;

      -- Add user as team owner
      INSERT INTO team_members (
        team_id,
        user_id,
        role,
        joined_at
      ) VALUES (
        v_team_id,
        user_record.id,
        'owner',
        NOW()
      );

      -- Update existing tasks without team_id
      UPDATE tasks
      SET team_id = v_team_id
      WHERE user_id = user_record.id
      AND team_id IS NULL;
    END IF;
  END LOOP;
END;
$$; 