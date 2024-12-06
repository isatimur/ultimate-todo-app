'use client';

import { useState, useCallback, useEffect } from 'react';
import { Team } from '@/types/team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { PlusIcon, ArrowLeft, Settings2 } from 'lucide-react';
import CreateTeamDialog from './create-team-dialog';
import TeamManagementDialog from './team-management-dialog';
import { Badge } from '@/components/ui/badge';
import TeamDashboard from './team-dashboard';
import { TaskType } from '../tasks';
import { ProjectType } from '../projects';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface TeamsViewProps {
    teams: Team[];
    currentUser: { id: string; email: string };
    tasks: TaskType[];
    projects: ProjectType[];
    onCreateTeam: (name: string, description: string) => Promise<void>;
    onInviteMember: (teamId: string, email: string, role: string) => Promise<void>;
    onRemoveMember: (teamId: string, userId: string) => Promise<void>;
    onCancelInvitation: (invitationId: string) => Promise<void>;
    onResendInvitation: (invitationId: string) => Promise<void>;
}

export default function TeamsView({
    teams,
    currentUser,
    tasks,
    projects,
    onCreateTeam,
    onInviteMember,
    onRemoveMember,
    onCancelInvitation,
    onResendInvitation,
}: TeamsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);
    const [selectedView, setSelectedView] = useState<'list' | 'dashboard'>('list');
    const [activeTeam, setActiveTeam] = useState<Team | null>(null);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

    const fetchPendingInvitations = useCallback(async (teamId: string) => {
        const { data, error } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('team_id', teamId)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching invitations:', error);
            return;
        }

        setPendingInvitations(data || []);
    }, []);

    useEffect(() => {
        if (selectedTeam) {
            fetchPendingInvitations(selectedTeam.id);
        }
    }, [selectedTeam, fetchPendingInvitations]);

    return (
        <div className="space-y-6">
            {activeTeam ? (
                <>
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTeam(null)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Teams
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedTeam(activeTeam);
                                setIsManageTeamOpen(true);
                            }}
                        >
                            <Settings2 className="h-4 w-4 mr-2" />
                            Manage Team
                        </Button>
                    </div>
                    <TeamDashboard
                        team={activeTeam}
                        tasks={tasks}
                        projects={projects}
                    />
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
                            <p className="text-muted-foreground">
                                Manage your teams and team members
                            </p>
                        </div>
                        <Button onClick={() => setIsCreateTeamOpen(true)}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            New Team
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map((team) => (
                            <Card
                                key={team.id}
                                className="hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => {
                                    setSelectedTeam(team);
                                    setIsManageTeamOpen(true);
                                }}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            {team.name}
                                            {team.owner_id === currentUser.id && (
                                                <Badge variant="secondary">Owner</Badge>
                                            )}
                                        </span>
                                        <Badge variant="outline">
                                            {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            {team.description || 'No description'}
                                        </p>
                                        <div className="flex -space-x-2">
                                            {team.members.slice(0, 5).map((member) => (
                                                <div
                                                    key={member.id}
                                                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-background"
                                                >
                                                    {member.profiles?.avatar_url ? (
                                                        <Image
                                                            src={member.profiles.avatar_url}
                                                            alt={member.profiles.full_name || member.profiles.email}
                                                            width={32}
                                                            height={32}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span>
                                                            {member.profiles?.full_name?.[0] || member.profiles?.email?.[0] || '?'}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            {team.members.length > 5 && (
                                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-background">
                                                    <span className="text-xs">+{team.members.length - 5}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            <CreateTeamDialog
                open={isCreateTeamOpen}
                onOpenChange={setIsCreateTeamOpen}
                onCreateTeam={onCreateTeam}
            />

            {selectedTeam && (
                <TeamManagementDialog
                    team={selectedTeam}
                    open={isManageTeamOpen}
                    onOpenChange={setIsManageTeamOpen}
                    onInviteMember={onInviteMember}
                    onRemoveMember={onRemoveMember}
                    currentUser={currentUser}
                    pendingInvitations={pendingInvitations}
                    onCancelInvitation={async (invitationId) => {
                        const { error } = await supabase
                            .from('team_invitations')
                            .delete()
                            .eq('id', invitationId);

                        if (error) {
                            toast.error('Failed to cancel invitation');
                            return;
                        }

                        toast.success('Invitation cancelled');
                        fetchPendingInvitations(selectedTeam.id);
                    }}
                    onResendInvitation={async (invitationId) => {
                        const { data, error } = await supabase
                            .from('team_invitations')
                            .update({
                                invited_at: new Date().toISOString(),
                                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                            })
                            .eq('id', invitationId)
                            .select()
                            .single();

                        if (error) {
                            toast.error('Failed to resend invitation');
                            return;
                        }

                        // TODO: Send invitation email
                        toast.success('Invitation resent');
                    }}
                />
            )}
        </div>
    );
} 