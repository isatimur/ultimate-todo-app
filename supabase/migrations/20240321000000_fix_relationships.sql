-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrate existing subtasks from JSON to the new table
DO $$
DECLARE
    task_record RECORD;
    subtask_json JSON;
BEGIN
    FOR task_record IN SELECT id, subtasks FROM tasks WHERE subtasks IS NOT NULL LOOP
        FOR subtask_json IN SELECT json_array_elements(task_record.subtasks::json) LOOP
            INSERT INTO subtasks (title, completed, task_id)
            VALUES (
                (subtask_json->>'title')::TEXT,
                (subtask_json->>'completed')::BOOLEAN,
                task_record.id
            );
        END LOOP;
    END LOOP;
END;
$$;

-- Drop the subtasks JSON column after migration
ALTER TABLE tasks DROP COLUMN IF EXISTS subtasks;

-- Add project_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
        ALTER TABLE tasks ADD COLUMN project_id BIGINT;
        ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey 
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Enable Row Level Security
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subtasks
CREATE POLICY "Users can view their own subtasks" ON subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own subtasks" ON subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own subtasks" ON subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own subtasks" ON subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Update database types
COMMENT ON TABLE subtasks IS 'Table storing subtasks for main tasks';
COMMENT ON COLUMN subtasks.id IS 'The unique identifier for the subtask';
COMMENT ON COLUMN subtasks.title IS 'The title of the subtask';
COMMENT ON COLUMN subtasks.completed IS 'Whether the subtask is completed';
COMMENT ON COLUMN subtasks.task_id IS 'The ID of the parent task';
COMMENT ON COLUMN subtasks.created_at IS 'When the subtask was created';
COMMENT ON COLUMN subtasks.updated_at IS 'When the subtask was last updated'; 