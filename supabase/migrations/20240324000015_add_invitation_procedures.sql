-- Create function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(
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
  SET 
    status = 'accepted',
    updated_at = NOW()
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
    -- User is already a team member
    UPDATE team_invitations
    SET 
      status = 'accepted',
      updated_at = NOW()
    WHERE id = p_invitation_id;
END;
$$ LANGUAGE plpgsql; 