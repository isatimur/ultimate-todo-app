import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-browser";

const inviteMember = async (teamId, email) => {
    const token = generateUniqueToken(); // Implement a function to generate unique tokens
    const { data, error } = await supabase
      .from('invitations')
      .insert([
        {
          team_id: teamId,
          email: email,
          token: token,
          status: 'Pending',
          invited_at: new Date().toISOString(),
        },
      ])
      .select();
  
    if (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Could not send invitation.',
        variant: 'destructive',
      });
    } else {
      // Optionally send an email to the user with the invitation link
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email}.`,
      });
    }
  };
  