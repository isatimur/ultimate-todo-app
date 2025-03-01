-- Add timer_settings column to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS timer_settings JSONB DEFAULT jsonb_build_object(
  'workDuration', 25,
  'breakDuration', 5,
  'longBreakDuration', 15,
  'sessionsUntilLongBreak', 4,
  'autoStartBreaks', false,
  'autoStartPomodoros', false,
  'soundEnabled', true
);

-- Add type column to time_entries table
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('pomodoro', 'break', 'manual')) DEFAULT 'manual';

-- Add comment explaining the timer_settings structure
COMMENT ON COLUMN user_settings.timer_settings IS 'JSON object containing timer preferences like work duration, break duration, etc.';

-- Add comment explaining the time_entry types
COMMENT ON COLUMN time_entries.type IS 'Type of time entry: pomodoro (focused work session), break (rest period), or manual (user-tracked time)'; 