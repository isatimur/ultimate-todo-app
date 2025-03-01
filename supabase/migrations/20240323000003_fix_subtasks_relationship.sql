-- Drop existing subtasks table if it exists
DROP TABLE IF EXISTS subtasks;

-- Create subtasks table with proper types
CREATE TABLE subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
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

-- Create indexes for better performance
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);

-- Add trigger for updated_at
CREATE TRIGGER set_subtasks_updated_at
    BEFORE UPDATE ON subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 