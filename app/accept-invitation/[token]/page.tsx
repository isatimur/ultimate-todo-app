// pages/accept-invitation/[token].tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { toast } from '@/hooks/useToast';

const AcceptInvitation = () => {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!token) return;

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data || data.status !== 'pending') {
        toast({
          title: 'Invalid Invitation',
          description: 'This invitation is invalid or has already been used.',
          variant: 'destructive',
        });
        return;
      }

      const { error: joinError } = await supabase
        .from('team_members')
        .insert([{ team_id: data.team_id, user_id: (await supabase.auth.getUser()).data.user?.id, role: 'member' }]);

      if (joinError) {
        toast({
          title: 'Error',
          description: 'Failed to join the team.',
          variant: 'destructive',
        });
        return;
      }

      await supabase
        .from('invitations')
        .update({ status: 'accepted', responded_at: new Date() })
        .eq('id', data.id);

      toast({
        title: 'Joined Team',
        description: 'You have successfully joined the team.',
      });

      router.push('/teams'); // Redirect to teams page
    };

    acceptInvitation();
  }, [token, router]);

  return <p>Accepting your invitation...</p>;
};

export default AcceptInvitation;