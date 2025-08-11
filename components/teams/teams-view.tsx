'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CreateTeamDialog } from '../dialogs/create-team-dialog';
import { InviteMemberDialog } from '../dialogs/invite-member-dialog';
import { TeamSettingsDialog } from '../dialogs/team-settings-dialog';
import { Team, TeamInvitation } from '@/types/team';
import { TeamCard } from './team-card';
import { InvitationList } from './invitation-list';
import { useTeams } from './useTeams';

interface TeamsViewProps {
  userId: string;
  userEmail: string;
  initialTeams: Team[];
  initialInvitations: TeamInvitation[];
}

export default function TeamsView({
  userId,
  userEmail,
  initialTeams,
  initialInvitations,
}: TeamsViewProps) {
  const {
    teams,
    invitations,
    handleCreateTeam,
    handleInviteMember,
    handleRemoveMember,
    handleInvitationResponse,
  } = useTeams({ userId, userEmail, initialTeams, initialInvitations });

  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);

  const openInvite = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsInviteMemberOpen(true);
  };

  const openSettings = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsTeamSettingsOpen(true);
  };

  const closeDialogs = () => {
    setSelectedTeamId(null);
    setIsInviteMemberOpen(false);
    setIsTeamSettingsOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage your teams and collaborations</p>
        </div>
        <Button onClick={() => setIsCreateTeamOpen(true)}>Create Team</Button>
      </div>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent
          value="teams"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              userId={userId}
              onInvite={openInvite}
              onSettings={openSettings}
              onDelete={handleRemoveMember}
            />
          ))}
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationList
            invitations={invitations}
            onRespond={handleInvitationResponse}
          />
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
            onClose={closeDialogs}
          />
          <InviteMemberDialog
            open={isInviteMemberOpen}
            onOpenChange={setIsInviteMemberOpen}
            teamId={selectedTeamId}
            onSubmit={(email, role) =>
              handleInviteMember(selectedTeamId, email, role)
            }
            onClose={closeDialogs}
          />
        </>
      )}
    </div>
  );
}
