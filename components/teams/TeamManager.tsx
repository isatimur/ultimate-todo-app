// components/TeamManager.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { inviteUserToTeam } from '@/features/inviteUser';

interface TeamManagerProps {
  teamId: number;
}

const TeamManager: React.FC<TeamManagerProps> = ({ teamId }) => {
  const [email, setEmail] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteUserToTeam(teamId, email);
    setEmail('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite}>
          <Input
            type="email"
            placeholder="User's Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit">Send Invitation</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManager;