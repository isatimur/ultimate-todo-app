-- Add timestamp columns to team_members table if they don't exist
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Drop and recreate the function with correct columns
DROP FUNCTION IF EXISTS public.safely_insert_team_member(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.safely_insert_team_member(
    p_team_id uuid,
    p_user_id uuid,
    p_role text
) RETURNS json AS $$
DECLARE
    v_result json;
BEGIN
    -- Try to insert the team member
    INSERT INTO public.team_members (
        team_id,
        user_id,
        role,
        joined_at
    )
    VALUES (
        p_team_id,
        p_user_id,
        p_role,
        NOW()
    )
    ON CONFLICT (team_id, user_id) 
    DO NOTHING
    RETURNING json_build_object(
        'id', id,
        'team_id', team_id,
        'user_id', user_id,
        'role', role,
        'joined_at', joined_at
    ) INTO v_result;

    -- If no insert happened (due to conflict), get existing record
    IF v_result IS NULL THEN
        SELECT json_build_object(
            'id', id,
            'team_id', team_id,
            'user_id', user_id,
            'role', role,
            'joined_at', joined_at
        ) INTO v_result
        FROM public.team_members
        WHERE team_id = p_team_id AND user_id = p_user_id;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.safely_insert_team_member(uuid, uuid, text) TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.safely_insert_team_member(uuid, uuid, text) IS 
'Safely inserts a team member, handling the case where the member already exists'; 