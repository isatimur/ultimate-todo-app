'use client';

import { useState, useCallback, useEffect } from 'react';
import { Team, TeamMember, TeamInvitation } from '@/types/team';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase-browser';
import { CreateTeamDialog } from '../dialogs/create-team-dialog';
import { InviteMemberDialog } from '../dialogs/invite-member-dialog';
import { TeamSettingsDialog } from '../dialogs/team-settings-dialog';
import {
    MoreVertical,
    Users,
    Settings,
    Trash2,
    Check,
    X
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatDateWithFallback } from '@/lib/utils';

interface TeamsViewProps {
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

export default function TeamsView({
    userId,
    userEmail,
    initialTeams,
    initialInvitations
}: TeamsViewProps) {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [invitations, setInvitations] = useState<TeamInvitation[]>(initialInvitations);
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
    const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const refreshTeams = async () => {
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

            const updatedTeams = (memberTeams || []).map(mt => ({
                ...mt.team,
                role: mt.role
            }));

            // Fetch members for each team
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
                .in('team_id', updatedTeams.map(t => t.id))
                .returns<TeamMemberResponse[]>();

            if (membersError) throw membersError;

            // Group members by team
            const membersByTeam = (allMembers || []).reduce<Record<string, TeamMember[]>>((acc, member) => {
                if (!acc[member.team_id]) {
                    acc[member.team_id] = [];
                }
                acc[member.team_id].push({
                    id: member.id,
                    team_id: member.team_id,
                    user_id: member.user_id,
                    role: member.role as "owner" | "admin" | "member",
                    created_at: member.joined_at,
                    user: member.user[0]
                });
                return acc;
            }, {});

            // Add members to each team
            setTeams(updatedTeams.map(team => ({
                ...team,
                members: membersByTeam[team.id] || []
            })));
        } catch (error) {
            console.error('Error refreshing teams:', error);
            toast.error('Failed to refresh teams');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTeam = async (name: string, description: string) => {
        try {
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    name,
                    description,
                    owner_id: userId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (teamError) throw teamError;

            const { error: memberError } = await supabase
                .from('team_members')
                .insert({
                    team_id: team.id,
                    user_id: userId,
                    role: 'owner',
                    joined_at: new Date().toISOString()
                });

            if (memberError) {
                await supabase.from('teams').delete().eq('id', team.id);
                throw memberError;
            }

            setTeams(prev => [...prev, { ...team, members: [] }]);
            toast.success('Team created successfully');
        } catch (error) {
            console.error('Error creating team:', error);
            toast.error('Failed to create team');
        }
    };

    const handleInviteMember = async (teamId: string, email: string, role: string) => {
        try {
            const { data: invitation, error: invitationError } = await supabase
                .from('team_invitations')
                .insert({
                    team_id: teamId,
                    email,
                    role,
                    status: 'pending',
                    invited_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();

            if (invitationError) throw invitationError;

            const team = teams.find(t => t.id === teamId);
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
                        recipientEmail: email
                    }
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
    };

    const handleRemoveMember = async (teamId: string, memberId: string) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('team_id', teamId)
                .eq('user_id', memberId);

            if (error) throw error;

            setTeams(prev =>
                prev.map(team =>
                    team.id === teamId
                        ? { ...team, members: team.members.filter(m => m.user_id !== memberId) }
                        : team
                )
            );

            toast.success('Member removed successfully');
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
        }
    };

    const handleInvitationResponse = async (invitation: TeamInvitation, accept: boolean) => {
        try {
            // First update the invitation status
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
                // Use RPC call to safely insert team member
                const { data: memberData, error: memberError } = await supabase
                    .rpc('safely_insert_team_member', {
                        p_team_id: invitation.team_id,
                        p_user_id: userId,
                        p_role: invitation.role
                    });

                if (memberError) {
                    console.error('Error adding team member:', memberError);
                    toast.error('Failed to join team');
                    return;
                }

                // Refresh teams list
                await refreshTeams();
                toast.success('Successfully joined the team!');
            } else {
                toast.success('Invitation rejected');
            }

            // Remove the invitation from the local state
            setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
        } catch (error) {
            console.error('Error handling invitation:', error);
            toast.error('Failed to process invitation');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Teams</h1>
                    <p className="text-muted-foreground">Manage your teams and collaborations</p>
                </div>
                <Button onClick={() => setIsCreateTeamOpen(true)}>
                    Create Team
                </Button>
            </div>

            <Tabs defaultValue="teams">
                <TabsList>
                    <TabsTrigger value="teams">My Teams</TabsTrigger>
                    <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="teams" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                        <Card key={team.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{team.name}</CardTitle>
                                        <CardDescription>{team.description}</CardDescription>
                                    </div>
                                    {team.members.some(member => member.user_id === userId && member.role === 'owner') && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedTeamId(team.id);
                                                    setIsInviteMemberOpen(true);
                                                }}>
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Invite Member
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedTeamId(team.id);
                                                    setIsTeamSettingsOpen(true);
                                                }}>
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Settings
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleRemoveMember(team.id, userId)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Team
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Members</h4>
                                        <div className="flex -space-x-2">
                                            {team.members.map((member) => (
                                                <Avatar key={member.id} className="border-2 border-background">
                                                    <AvatarImage src={member.user?.avatar_url || ''} />
                                                    <AvatarFallback>
                                                        {getInitials(member.user?.full_name || '')}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Created {formatDateWithFallback(team.created_at)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="invitations">
                    <div className="space-y-4">
                        {invitations.map((invitation) => (
                            <Card key={`${invitation.id}-${invitation.team_id}`}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">Team Invitation</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Role: {invitation.role}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Invited {formatDateWithFallback(invitation.invited_at)}
                                            </p>
                                        </div>
                                        {invitation.status === 'pending' && (
                                            <div className="flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleInvitationResponse(invitation, true)}
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600"
                                                    onClick={() => handleInvitationResponse(invitation, false)}
                                                >
                                                    <X className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <CreateTeamDialog
                open={isCreateTeamOpen}
                onOpenChange={setIsCreateTeamOpen}
                onSubmit={handleCreateTeam}
            />

            {selectedTeamId && (
                <>
                    <TeamSettingsDialog
                        open={isTeamSettingsOpen}
                        onOpenChange={setIsTeamSettingsOpen}
                        teamId={selectedTeamId}
                        onClose={() => {
                            setSelectedTeamId(null);
                            setIsTeamSettingsOpen(false);
                        }}
                    />
                    <InviteMemberDialog
                        open={isInviteMemberOpen}
                        onOpenChange={setIsInviteMemberOpen}
                        teamId={selectedTeamId}
                        onSubmit={(email, role) => handleInviteMember(selectedTeamId, email, role)}
                        onClose={() => {
                            setSelectedTeamId(null);
                            setIsInviteMemberOpen(false);
                        }}
                    />
                </>
            )}
        </div>
    );
} 