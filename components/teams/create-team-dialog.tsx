import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateTeam: (name: string, description: string) => Promise<void>;
}

export default function CreateTeamDialog({
    open,
    onOpenChange,
    onCreateTeam,
}: CreateTeamDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Team name is required');
            return;
        }

        setIsLoading(true);
        try {
            await onCreateTeam(name.trim(), description.trim());
            setName('');
            setDescription('');
            onOpenChange(false);
            toast.success('Team created successfully');
        } catch (error) {
            console.error('Error creating team:', error);
            toast.error('Failed to create team');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter team name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your team's purpose"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Team'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
