-- Create saved filters table
CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filters JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved filters"
    ON saved_filters FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved filters"
    ON saved_filters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters"
    ON saved_filters FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters"
    ON saved_filters FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saved_filters_updated_at
    BEFORE UPDATE ON saved_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to document the filters structure
COMMENT ON COLUMN saved_filters.filters IS 'JSON object containing filter criteria: { status: string[], priority: string[], search: string }'; 