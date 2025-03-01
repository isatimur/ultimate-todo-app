-- Drop existing update policies
DROP POLICY IF EXISTS "Users can update task positions" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;

-- Create a new comprehensive update policy
CREATE POLICY "Users can update their own tasks"
    ON tasks 
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Ensure the position_key column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'position_key') THEN
        ALTER TABLE tasks ADD COLUMN position_key TEXT;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_position_key ON tasks(position_key);

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION maintain_task_position_key()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set position_key for new tasks
    IF TG_OP = 'INSERT' AND (NEW.position_key IS NULL OR NEW.position_key = '') THEN
        SELECT LPAD((COALESCE(MAX(NULLIF(position_key, '')), '0')::integer + 1)::text, 8, '0')
        INTO NEW.position_key
        FROM tasks
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS set_task_position_key ON tasks;
CREATE TRIGGER set_task_position_key
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION maintain_task_position_key(); 