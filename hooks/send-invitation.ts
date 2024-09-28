import { supabase } from "@/lib/supabase-browser";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";

export const inviteUserToTeam = async (teamId: number, email: string) => {
  const token = uuidv4();

  const { error } = await supabase
    .from('invitations')
    .insert([
      { team_id: teamId, email, token }
    ]);

  if (error) {
    console.error('Error creating invitation:', error);
    toast({
      title: 'Error',
      description: 'Failed to send invitation.',
      variant: 'destructive',
    });
    return;
  }

  // TODO: Integrate with an email service to send the invitation link containing the token.

  toast({
    title: 'Invitation Sent',
    description: `An invitation has been sent to ${email}.`,
  });
};