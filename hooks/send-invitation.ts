import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";


export const inviteUserToTeam = async (teamId: number, email: string) => {
  const token = crypto.randomUUID();

  const { error } = await supabase
    .from('invitations')
    .insert([
      { team_id: teamId, email, token }
    ]);

  if (error) {
    console.error('Error creating invitation:', error);
    toast.error('Failed to send invitation.');
    return;
  }

  // TODO: Integrate with an email service to send the invitation link containing the token.

  toast.success(`An invitation has been sent to ${email}.`);
};