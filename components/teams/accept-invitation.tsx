import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";
import { User } from "@supabase/supabase-js";

export const acceptInvitation = async (token: string, user: User) => {
  if (!user) return;

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !data) {
    console.error('Invalid invitation token:', error);
    toast.error('Invalid or expired invitation.');
  } else {
    const invitation = data;
    if (invitation.status !== 'Pending') {
      toast.error('Invitation has already been responded to.');
      return;
    }

    // Add the user to the team_members table
    const { error: memberError } = await supabase.from('team_members').insert([
      {
        team_id: invitation.team_id,
        user_id: user.id,
        role: 'Member',
        joined_at: new Date().toISOString(),
      },
    ]);

    if (memberError) {
      console.error('Error adding team member:', memberError);
      toast.error('Could not join the team.');
    } else {
      // Update the invitation status
      await supabase
        .from('invitations')
        .update({ status: 'Accepted', responded_at: new Date().toISOString() })
        .eq('id', invitation.id);

      toast.success('You have successfully joined the team.');
      // Update state or fetch teams again
    }
  }
};
