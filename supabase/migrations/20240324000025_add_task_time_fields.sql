-- Add start_time and end_time columns to tasks table
ALTER TABLE tasks
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;

-- Add comment explaining the new columns
COMMENT ON COLUMN tasks.start_time IS 'The scheduled start time of the task (HH:MM)';
COMMENT ON COLUMN tasks.end_time IS 'The scheduled end time of the task (HH:MM)';

-- Create an index for efficient time-based queries
CREATE INDEX idx_tasks_time ON tasks (start_time, end_time);

-- Add validation to ensure end_time is after start_time
CREATE OR REPLACE FUNCTION validate_task_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if both times are set
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    IF NEW.end_time <= NEW.start_time THEN
      RAISE EXCEPTION 'End time must be after start time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_task_times_trigger
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION validate_task_times();

-- Update RLS policies to include new columns
ALTER POLICY "Users can view their own tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

ALTER POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); 