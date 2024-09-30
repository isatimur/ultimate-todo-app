import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateTeamDialog({ open, onClose }: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');

  const createTeam = useCallback(async (teamName: string, description: string) => {
    const user = (await supabase.auth.getUser()).data.user || null;

    if (!user) return;

    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          name: teamName,
          description: description,
          owner_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating team:', error);
      toast.error('Could not create team.');
    } else {
      const team = data[0];
      // Add the owner as a team member
      await supabase.from('team_members').insert([
        {
          team_id: team.id,
          user_id: user.id,
          role: 'Owner',
          joined_at: new Date().toISOString(),
        },
      ]);
      toast.success(`Team "${teamName}" has been created successfully.`);
      // Update state or fetch teams again
    }

  }, []);



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Team Name"
            value={teamName}
            required
            onChange={(e) => setTeamName(e.target.value)}
          />
          <Textarea
            placeholder="Description"
            value={description}
            required
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => createTeam(teamName, description)}>Create Team</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
