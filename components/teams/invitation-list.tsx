'use client';

import { TeamInvitation } from '@/types/team';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { formatDateWithFallback } from '@/lib/utils';

interface InvitationListProps {
  invitations: TeamInvitation[];
  onRespond: (invitation: TeamInvitation, accept: boolean) => void;
}

export function InvitationList({ invitations, onRespond }: InvitationListProps) {
  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <Card key={`${invitation.id}-${invitation.team_id}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Team Invitation</h3>
                <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invited {formatDateWithFallback(invitation.invited_at)}
                </p>
              </div>
              {invitation.status === 'pending' && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRespond(invitation, true)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => onRespond(invitation, false)}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default InvitationList;
