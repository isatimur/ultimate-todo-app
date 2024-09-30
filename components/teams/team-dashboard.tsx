import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import CreateTeamDialog from './create-team-dialog';
import { supabase } from '@/lib/supabase-browser';

type Team = {
    id: string;
    name: string;
    description: string;
    member_count: number;
};

export default function TeamDashboard() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);

    useEffect(() => {
        // Fetch teams the user is a member of
        const fetchTeams = async () => {
            const { data, error } = await supabase
                .from('team_members')
                .select('teams(*)')
                .eq('user_id', (await supabase.auth.getUser()).data?.user?.id);

            if (error) {
                console.error('Error fetching teams:', error);
            } else {
                const userTeams = data.map((tm) => tm.teams);
                setTeams(userTeams as unknown as Team[]);
            }
        };

        fetchTeams();
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">My Teams</h1>
                <Button onClick={() => setCreateTeamDialogOpen(true)}>Create New Team</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {teams.map((team) => (
                    <Card key={team.id}>
                        <CardHeader>
                            <h2 className="text-lg font-semibold">{team.name}</h2>
                        </CardHeader>
                        <CardContent>
                            <p>{team.description}</p>
                            <p>Members: {team.member_count}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <CreateTeamDialog
                open={createTeamDialogOpen}
                onClose={() => setCreateTeamDialogOpen(false)}
            />
        </div>
    );
}
