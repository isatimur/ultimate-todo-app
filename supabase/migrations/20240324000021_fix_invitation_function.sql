-- Drop existing function if it exists
DROP FUNCTION IF EXISTS accept_team_invitation(UUID, UUID);

-- Create function to accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  p_invitation_id UUID,
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_team_id UUID;
  v_role TEXT;
BEGIN
  -- Get invitation details and lock the row
  SELECT team_id, role INTO v_team_id, v_role
  FROM team_invitations
  WHERE id = p_invitation_id
  AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already processed invitation';
  END IF;

  -- Check if user is already a team member
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = v_team_id
    AND user_id = p_user_id
  ) THEN
    -- Just update the invitation status
    UPDATE team_invitations
    SET status = 'accepted'
    WHERE id = p_invitation_id;
    RETURN;
  END IF;

  -- Insert team member
  INSERT INTO team_members (
    team_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    v_team_id,
    p_user_id,
    v_role,
    NOW()
  );

  -- Update invitation status
  UPDATE team_invitations
  SET status = 'accepted'
  WHERE id = p_invitation_id;

  -- Create notification for team owner
  INSERT INTO notifications (
    user_id,
    type,
    data,
    created_at
  )
  SELECT 
    owner_id,
    'team_member_joined',
    jsonb_build_object(
      'team_id', t.id,
      'team_name', t.name,
      'user_id', p_user_id,
      'role', v_role
    ),
    NOW()
  FROM teams t
  WHERE t.id = v_team_id;

EXCEPTION
  WHEN unique_violation THEN
    -- User is already a team member (race condition)
    UPDATE team_invitations
    SET status = 'accepted'
    WHERE id = p_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 