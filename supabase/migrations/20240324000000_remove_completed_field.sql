-- Remove the redundant completed field from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS completed;

-- Add a comment to document the change
COMMENT ON TABLE tasks IS 'Task completion is tracked through status="Complete" and completed_at timestamp'; 