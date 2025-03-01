-- Add completed_at column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing completed tasks to have a completed_at timestamp
UPDATE tasks 
SET completed_at = updated_at 
WHERE status = 'Complete' AND completed_at IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was marked as complete'; 