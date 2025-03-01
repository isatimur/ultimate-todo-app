-- Add missing columns to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status TEXT;

-- Add missing columns to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS project TEXT;

-- Update project column in tasks when project_id is set
UPDATE tasks 
SET project = (
    SELECT name 
    FROM projects 
    WHERE projects.id = tasks.project_id
)
WHERE project_id IS NOT NULL AND project IS NULL;

-- Create trigger to keep project name in sync
CREATE OR REPLACE FUNCTION update_task_project_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        NEW.project = (SELECT name FROM projects WHERE id = NEW.project_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_task_project_name ON tasks;
CREATE TRIGGER sync_task_project_name
    BEFORE INSERT OR UPDATE OF project_id ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_project_name();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add comments
COMMENT ON COLUMN projects.status IS 'Current status of the project';
COMMENT ON COLUMN tasks.position IS 'Numeric position for manual task ordering';
COMMENT ON COLUMN tasks.project IS 'Denormalized project name for quick access'; 