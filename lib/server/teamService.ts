import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../database.types'
import { Team, TeamMember, TeamInvitation } from '@/types/team'

export interface TeamWithRole extends Team {
  role: string
}

interface UserTeam {
  team_id: string
  team_role: string
}

interface MemberData {
  id: string
  team_id: string
  role: string
  joined_at?: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export async function fetchUserTeams(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TeamWithRole[]> {
  const { data: userTeams, error: teamsError } = await supabase
    .rpc('get_user_teams', {
      p_user_id: userId,
    })

  if (teamsError) throw teamsError

  const { data: teams, error: teamDetailsError } = await supabase
    .from('teams')
    .select('*')
    .in('id', (userTeams || []).map((t: UserTeam) => t.team_id))

  if (teamDetailsError) throw teamDetailsError

  return (teams || []).map(team => {
    const userTeam = userTeams?.find((ut: UserTeam) => ut.team_id === team.id)
    return {
      ...team,
      role: userTeam?.team_role || 'member',
      members: [],
    } as TeamWithRole
  })
}

export async function fetchTeamMembers(
  supabase: SupabaseClient<Database>,
  teamIds: string[]
): Promise<Record<string, TeamMember[]>> {
  const { data: members, error } = await supabase
    .from('team_members')
    .select(`
      id,
      team_id,
      role,
      joined_at,
      user:profiles!inner (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .in('team_id', teamIds)

  if (error) throw error

  return (members || []).reduce<Record<string, TeamMember[]>>(
    (acc, member: MemberData) => {
      if (!acc[member.team_id]) {
        acc[member.team_id] = []
      }

      const userInfo = member.user

      const teamMember: TeamMember = {
        id: member.id,
        team_id: member.team_id,
        user_id: userInfo.id,
        role: member.role as 'owner' | 'admin' | 'member',
        joined_at: member.joined_at || new Date().toISOString(),
        user: {
          id: userInfo.id,
          email: userInfo.email,
          full_name: userInfo.full_name,
          avatar_url: userInfo.avatar_url,
        },
      }

      acc[member.team_id].push(teamMember)
      return acc
    },
    {}
  )
}

export async function fetchPendingInvitations(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<TeamInvitation[]> {
  const { data: invitations, error } = await supabase
    .from('team_invitations')
    .select(`
      id,
      team_id,
      email,
      role,
      status,
      invited_at,
      expires_at,
      token,
      team:teams (
        id,
        name,
        description
      )
    `)
    .eq('email', email)
    .eq('status', 'pending')

  if (error) throw error

  return (invitations || []).map((invitation: any) => {
    const teamInfo = Array.isArray(invitation.team)
      ? invitation.team[0]
      : invitation.team

    return {
      id: invitation.id,
      team_id: invitation.team_id,
      email: invitation.email,
      role: invitation.role as 'owner' | 'admin' | 'member',
      status: invitation.status as 'pending' | 'accepted' | 'rejected',
      invited_at: invitation.invited_at,
      expires_at: invitation.expires_at,
      token: invitation.token,
      team: teamInfo
        ? {
            id: teamInfo.id,
            name: teamInfo.name,
            description: teamInfo.description,
          }
        : undefined,
    } as TeamInvitation
  })
}

