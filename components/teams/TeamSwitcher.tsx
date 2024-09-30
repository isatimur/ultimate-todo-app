import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase-browser";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Database } from "@/lib/database.types";

type Team = Database['public']['Tables']['teams']['Row'];

const TeamSwitcher: React.FC = () => {
  const [teams] = useState<Team[]>([]);
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
        //   const fetchedTeams = data.map(member => ({
        //     id: member.teams?.id,
        //     name: member.teams?.name
        //   })).filter((team): team is Team => team.id !== undefined && team.name !== undefined);

        // setTeams(fetchedTeams as Team[]);
        // if (fetchedTeams.length > 0) {
        //   setSelectedTeam(fetchedTeams[0].id as number) ; // Default to first team
        // }
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