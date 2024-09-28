import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase-browser";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const TeamSwitcher: React.FC = () => {
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('team_members')
        .select('teams(id, name)')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching teams:', error);
        return;
      }

      if (data) {
        const fetchedTeams = data.map(member => ({
          id: member.teams.id,
          name: member.teams.name
        }));
        setTeams(fetchedTeams);
        if (fetchedTeams.length > 0) {
          setSelectedTeam(fetchedTeams[0].id); // Default to first team
        }
      }
    };

    fetchTeams();
  }, []);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(parseInt(teamId));
    // TODO: Redirect or update context based on the selected team
  };

  return (
    <Select value={selectedTeam ? selectedTeam.toString() : ''} onValueChange={handleTeamChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select Team" />
      </SelectTrigger>
      <SelectContent>
        {teams.map(team => (
          <SelectItem key={team.id} value={team.id.toString()}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TeamSwitcher;