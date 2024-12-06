import {useEffect} from 'react';
import {supabase} from '@/lib/supabase-browser';
import {Database} from '@/lib/database.types';

type Team = Database['public']['Tables']['teams']['Row'];

export default function TeamSwitcher({teams, setTeams, currentTeam, setCurrentTeam}: {
    teams: Team[],
    setTeams: (teams: Team[]) => void,
    currentTeam: Team | null,
    setCurrentTeam: (team: Team | null) => void
}) {


    useEffect(() => {
        const fetchTeams = async () => {
            const {data: user} = await supabase.auth.getUser();
            if (!user) {
                console.error('User not authenticated');
                return;
            }

            const {data, error} = await supabase
                .from('team_members')
                .select('team_id, teams(name)')
                .eq('user_id', user.user?.id);

            if (error) {
                console.error('Error fetching teams:', error);
            } else if (data) {
                const teamList = data.map((tm) => ({
                    id: tm.team_id,
                    name: tm.teams[0].name,
                }));
                setTeams(teamList as Team[]);
                setCurrentTeam(teamList[0] as Team | null);
            }
        };

        fetchTeams();
    }, [teams, currentTeam]);

    const handleTeamChange = (teamId: string) => {
        const selectedTeam = teams.find((team) => team.id === teamId) || null;
        setCurrentTeam(selectedTeam);
        // Additional logic to update the context or state
    };

    return (
        <div>
            <select
                value={currentTeam?.id || ''}
                onChange={(e) => handleTeamChange(e.target.value)}
            >
                {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                        {team.name}
                    </option>
                ))}
            </select>
        </div>
    );
}