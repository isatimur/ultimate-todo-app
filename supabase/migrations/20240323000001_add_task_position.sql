-- Add position_key column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position_key TEXT;

-- Update existing tasks with position based on created_at
WITH indexed_tasks AS (
  SELECT 
    id, 
    LPAD(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at)::text, 8, '0') as new_position
  FROM tasks
)
UPDATE tasks
SET position_key = indexed_tasks.new_position
FROM indexed_tasks
WHERE tasks.id = indexed_tasks.id;

-- Create index for better performance when sorting by position
CREATE INDEX IF NOT EXISTS idx_tasks_position_key ON tasks(position_key);

-- Add RLS policy for position updates
CREATE POLICY "Users can update task positions"
    ON tasks FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add trigger to maintain position_key order
CREATE OR REPLACE FUNCTION maintain_task_position_key()
RETURNS TRIGGER AS $$
BEGIN
  -- For new tasks, set position_key to the highest position + 1
  IF TG_OP = 'INSERT' THEN
    SELECT LPAD((COALESCE(MAX(NULLIF(position_key, '')), '0')::integer + 1)::text, 8, '0')
    INTO NEW.position_key
    FROM tasks
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_position_key
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION maintain_task_position_key(); 