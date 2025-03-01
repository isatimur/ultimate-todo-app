-- Fix project_id type to match the database schema
ALTER TABLE tasks 
    ALTER COLUMN project_id TYPE TEXT;

-- Enable RLS on tasks and projects tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can access projects through tasks" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

-- Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (
        user_id = auth.uid() OR
        id IN (
            SELECT project_id FROM tasks 
            WHERE user_id = auth.uid() AND project_id IS NOT NULL
        )
    );

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (user_id = auth.uid()); 