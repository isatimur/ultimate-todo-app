'use client';

import { Team } from '@/types/team';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Users, Settings, Trash2 } from 'lucide-react';
import { formatDateWithFallback } from '@/lib/utils';

interface TeamCardProps {
  team: Team;
  userId: string;
  onInvite: (teamId: string) => void;
  onSettings: (teamId: string) => void;
  onDelete: (teamId: string, memberId: string) => void;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export function TeamCard({ team, userId, onInvite, onSettings, onDelete }: TeamCardProps) {
  const isOwner = team.members.some((member) => member.user_id === userId && member.role === 'owner');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{team.name}</CardTitle>
            <CardDescription>{team.description}</CardDescription>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onInvite(team.id)}>
                  <Users className="w-4 h-4 mr-2" /> Invite Member
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSettings(team.id)}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(team.id, userId)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Team
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
                  <AvatarFallback>{getInitials(member.user?.full_name || '')}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Created {formatDateWithFallback(team.created_at)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamCard;
