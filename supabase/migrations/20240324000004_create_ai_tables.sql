-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_settings JSONB DEFAULT jsonb_build_object(
        'model', 'gpt-4',
        'temperature', 0.7,
        'maxTokens', 2000,
        'autoSuggest', true,
        'saveHistory', true
    ),
    auto_break BOOLEAN DEFAULT false,
    color_scheme TEXT NOT NULL DEFAULT 'blue',
    compact_mode BOOLEAN DEFAULT false,
    due_date_reminders BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    font_size TEXT NOT NULL DEFAULT 'normal',
    pomodoro_length INTEGER DEFAULT 25,
    push_notifications BOOLEAN DEFAULT true,
    reduced_motion BOOLEAN DEFAULT false,
    sound_enabled BOOLEAN DEFAULT true,
    task_reminders BOOLEAN DEFAULT true,
    team_updates BOOLEAN DEFAULT true,
    theme TEXT NOT NULL DEFAULT 'light',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can create their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can delete their own AI interactions" ON ai_interactions;

-- Create RLS policies
CREATE POLICY "Users can manage their own settings"
    ON user_settings FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own AI interactions"
    ON ai_interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI interactions"
    ON ai_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI interactions"
    ON ai_interactions FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_id ON user_settings(id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at DESC);

-- Add comments
COMMENT ON TABLE user_settings IS 'User preferences and settings';
COMMENT ON COLUMN user_settings.ai_settings IS 'JSON object containing AI assistant settings: { model: string, temperature: number, maxTokens: number, autoSuggest: boolean, saveHistory: boolean }';
COMMENT ON COLUMN user_settings.color_scheme IS 'User interface color scheme preference';
COMMENT ON COLUMN user_settings.font_size IS 'User interface font size preference';
COMMENT ON COLUMN user_settings.theme IS 'User interface theme preference';
COMMENT ON TABLE ai_interactions IS 'Table storing user interactions with the AI assistant'; 