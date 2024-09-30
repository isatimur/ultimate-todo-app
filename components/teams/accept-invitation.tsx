const acceptInvitation = async (token) => {
    if (!user) return;
  
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();
  
    if (error || !data) {
      console.error('Invalid invitation token:', error);
      toast({
        title: 'Error',
        description: 'Invalid or expired invitation.',
        variant: 'destructive',
      });
    } else {
      const invitation = data;
      if (invitation.status !== 'Pending') {
        toast({
          title: 'Error',
          description: 'Invitation has already been responded to.',
          variant: 'destructive',
        });
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
        toast({
          title: 'Error',
          description: 'Could not join the team.',
          variant: 'destructive',
        });
      } else {
        // Update the invitation status
        await supabase
          .from('invitations')
          .update({ status: 'Accepted', responded_at: new Date().toISOString() })
          .eq('id', invitation.id);
  
        toast({
          title: 'Joined Team',
          description: 'You have successfully joined the team.',
        });
        // Update state or fetch teams again
      }
    }
  };
  