-- Add settings column to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "default_task_view": "list",
  "task_statuses": ["To Do", "In Progress", "In Review", "Complete"],
  "task_priorities": ["Low", "Medium", "High", "Urgent"]
}'::jsonb;

-- Update existing teams with default settings if null
UPDATE teams 
SET settings = '{
  "default_task_view": "list",
  "task_statuses": ["To Do", "In Progress", "In Review", "Complete"],
  "task_priorities": ["Low", "Medium", "High", "Urgent"]
}'::jsonb
WHERE settings IS NULL; 