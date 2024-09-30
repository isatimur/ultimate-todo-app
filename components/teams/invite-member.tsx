
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";

export const inviteMember = async (teamId: string, email: string) => {
  const token = generateUniqueToken();
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
    toast.error('Could not send invitation.');
  } else {
    // Optionally send an email to the user with the invitation link
    toast.success(`An invitation has been sent to ${data[0].email}.`);
  }
};
function generateUniqueToken() {
  throw new Error("Function not implemented.");
}

