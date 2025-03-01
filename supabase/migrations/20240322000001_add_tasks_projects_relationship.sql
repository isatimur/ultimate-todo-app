-- Add project_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
        ALTER TABLE tasks ADD COLUMN project_id INTEGER;
    END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_project_id_fkey,
    ADD CONSTRAINT tasks_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE SET NULL;

-- Update the RLS policy to allow access to projects through tasks
CREATE POLICY "Users can access projects through tasks" ON projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM tasks WHERE user_id = auth.uid()
        ) OR
        user_id = auth.uid()
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id); 