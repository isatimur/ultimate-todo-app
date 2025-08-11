'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { Team, TeamInvitation, TeamMember } from '@/types/team';

interface UseTeamsOptions {
  userId: string;
  userEmail: string;
  initialTeams: Team[];
  initialInvitations: TeamInvitation[];
}

interface MemberTeamResponse {
  id: string;
  team_id: string;
  role: string;
  team: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  };
}

interface TeamMemberResponse {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: Array<{
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
}

export function useTeams({
  userId,
  userEmail, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialTeams,
  initialInvitations,
}: UseTeamsOptions) {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [invitations, setInvitations] = useState<TeamInvitation[]>(initialInvitations);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTeams = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: memberTeams, error: memberTeamsError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          role,
          team:teams!inner (
            id,
            name,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .returns<MemberTeamResponse[]>();

      if (memberTeamsError) throw memberTeamsError;

      const updatedTeams = (memberTeams || []).map((mt) => ({
        ...mt.team,
        role: mt.role,
      }));

      const { data: allMembers, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          joined_at,
          user:profiles!inner (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .in('team_id', updatedTeams.map((t) => t.id))
        .returns<TeamMemberResponse[]>();

      if (membersError) throw membersError;

      const membersByTeam = (allMembers || []).reduce<Record<string, TeamMember[]>>((acc, member) => {
        if (!acc[member.team_id]) {
          acc[member.team_id] = [];
        }
        acc[member.team_id].push({
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role as 'owner' | 'admin' | 'member',
          joined_at: member.joined_at,
          user: member.user[0],
        });
        return acc;
      }, {});

      setTeams(
        updatedTeams.map((team) => ({
          ...team,
          members: membersByTeam[team.id] || [],
        }))
      );
    } catch (error) {
      console.error('Error refreshing teams:', error);
      toast.error('Failed to refresh teams');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  const handleCreateTeam = useCallback(
    async (name: string, description: string) => {
      try {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .insert({
            name,
            description,
            owner_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (teamError) throw teamError;

        const { error: memberError } = await supabase.from('team_members').insert({
          team_id: team.id,
          user_id: userId,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

        if (memberError) {
          await supabase.from('teams').delete().eq('id', team.id);
          throw memberError;
        }

        setTeams((prev) => [...prev, { ...team, members: [] }]);
        toast.success('Team created successfully');
      } catch (error) {
        console.error('Error creating team:', error);
        toast.error('Failed to create team');
      }
    },
    [supabase, userId]
  );

  const handleInviteMember = useCallback(
    async (teamId: string, email: string, role: string) => {
      try {
        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .insert({
            team_id: teamId,
            email,
            role,
            status: 'pending',
            invited_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (invitationError) throw invitationError;

        const team = teams.find((t) => t.id === teamId);
        if (!team) throw new Error('Team not found');

        const inviteLink = `${window.location.origin}/teams/invite/${invitation.id}`;
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'team_invitation',
            data: {
              teamName: team.name,
              inviterName: 'Team Member',
              inviteLink,
              recipientEmail: email,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          await supabase.from('team_invitations').delete().eq('id', invitation.id);
          throw new Error(errorData.error || 'Failed to send invitation email');
        }

        toast.success('Invitation sent successfully');
      } catch (error) {
        console.error('Error inviting member:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to invite member');
      }
    },
    [supabase, teams]
  );

  const handleRemoveMember = useCallback(
    async (teamId: string, memberId: string) => {
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId)
          .eq('user_id', memberId);

        if (error) throw error;

        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? { ...team, members: team.members.filter((m) => m.user_id !== memberId) }
              : team
          )
        );

        toast.success('Member removed successfully');
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove member');
      }
    },
    [supabase]
  );

  const handleInvitationResponse = useCallback(
    async (invitation: TeamInvitation, accept: boolean) => {
      try {
        const { error: invitationError } = await supabase
          .from('team_invitations')
          .update({ status: accept ? 'accepted' : 'rejected' })
          .eq('id', invitation.id);

        if (invitationError) {
          console.error('Error updating invitation:', invitationError);
          toast.error('Failed to process invitation');
          return;
        }

        if (accept) {
          const { error: memberError } = await supabase.rpc('safely_insert_team_member', {
            p_team_id: invitation.team_id,
            p_user_id: userId,
            p_role: invitation.role,
          });

          if (memberError) {
            console.error('Error adding team member:', memberError);
            toast.error('Failed to join team');
            return;
          }

          await refreshTeams();
          toast.success('Successfully joined the team!');
        } else {
          toast.success('Invitation rejected');
        }

        setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
      } catch (error) {
        console.error('Error handling invitation:', error);
        toast.error('Failed to process invitation');
      }
    },
    [supabase, userId, refreshTeams]
  );

  return {
    teams,
    invitations,
    isLoading,
    refreshTeams,
    handleCreateTeam,
    handleInviteMember,
    handleRemoveMember,
    handleInvitationResponse,
  };
}

export type UseTeamsReturn = ReturnType<typeof useTeams>;
