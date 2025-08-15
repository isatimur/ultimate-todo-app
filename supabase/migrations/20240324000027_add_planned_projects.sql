-- Create table for planned projects
CREATE TABLE planned_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    goal TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE planned_projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their planned projects" ON planned_projects
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Table for tasks within planned projects
CREATE TABLE planned_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES planned_projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES planned_tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE planned_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their planned tasks" ON planned_tasks
    USING (
        EXISTS (
            SELECT 1 FROM planned_projects p
            WHERE p.id = planned_tasks.project_id
            AND p.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM planned_projects p
            WHERE p.id = planned_tasks.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Indexes for faster lookups
CREATE INDEX idx_planned_tasks_project_id ON planned_tasks(project_id);
CREATE INDEX idx_planned_tasks_parent_id ON planned_tasks(parent_id);

-- Triggers for updated_at
CREATE TRIGGER set_planned_projects_updated_at
    BEFORE UPDATE ON planned_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_planned_tasks_updated_at
    BEFORE UPDATE ON planned_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
