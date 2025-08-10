// components/TeamManager.tsx
import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {useToast} from '@/components/ui/use-toast';
import {inviteUserToTeam} from '@/features/inviteUser';

interface TeamManagerProps {
    teamId: number;
}

const TeamManager: React.FC<TeamManagerProps> = ({teamId}) => {
    const [email, setEmail] = useState('');
    const {toast} = useToast();

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await inviteUserToTeam(teamId, email);
            if (result.success) {
                toast({
                    title: 'Invitation sent',
                    description: result.message,
                });
                setEmail('');
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send invitation';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        }
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