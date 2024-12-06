import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team } from '@/types/team';

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: Team;
    onInviteMember: (teamId: string, email: string, role: string) => Promise<void>;
}

export default function InviteMemberDialog({
    open,
    onOpenChange,
    team,
    onInviteMember,
}: InviteMemberDialogProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onInviteMember(team.id, email, role);
            onOpenChange(false);
            setEmail('');
            setRole('member');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

