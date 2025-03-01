import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface TeamSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    onClose: () => void;
}

export function TeamSettingsDialog({
    open,
    onOpenChange,
    teamId,
    onClose,
}: TeamSettingsDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleUpdateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!name.trim()) return;

        try {
            setIsLoading(true);
            const { error } = await supabase
                .from('teams')
                .update({
                    name: name.trim(),
                    description: description.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', teamId);

            if (error) throw error;

            toast.success('Team settings updated successfully');
            onClose();
        } catch (error) {
            console.error('Error updating team:', error);
            toast.error('Failed to update team settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        try {
            setIsLoading(true);
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);

            if (error) throw error;

            toast.success('Team deleted successfully');
            onClose();
        } catch (error) {
            console.error('Error deleting team:', error);
            toast.error('Failed to delete team');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Team Settings</DialogTitle>
                    <DialogDescription>
                        Manage your team settings and configurations.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general">
                        <form onSubmit={handleUpdateTeam} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Enter team name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="Enter team description"
                                />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="danger" className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-destructive">Delete Team</h4>
                                <p className="text-sm text-muted-foreground">
                                    Once you delete a team, there is no going back. Please be certain.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteTeam}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Deleting...' : 'Delete Team'}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
} 