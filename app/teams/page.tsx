import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TeamsView from '@/components/teams/teams-view'
import { Database } from '@/lib/database.types'
import { Team, TeamMember, TeamInvitation } from '@/types/team'

export const dynamic = 'force-dynamic'

interface TeamWithRole extends Team {
  role: string;
  members: TeamMember[];
}

export default async function TeamsPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name)
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Auth error:', userError)
    redirect('/signin')
  }

  try {
    // Get user's teams using the helper function
    const { data: userTeams, error: teamsError } = await supabase
      .rpc('get_user_teams', {
        p_user_id: user.id
      })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      throw new Error('Failed to load teams')
    }

    // Fetch full team details
    const { data: teams, error: teamDetailsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', (userTeams || []).map(t => t.team_id))

    if (teamDetailsError) {
      console.error('Error fetching team details:', teamDetailsError)
      throw new Error('Failed to load team details')
    }

    // Combine team details with roles
    const teamsWithRoles = (teams || []).map(team => {
      const userTeam = userTeams?.find(ut => ut.team_id === team.id)
      return {
        ...team,
        role: userTeam?.team_role || 'member'
      }
    })

    // Fetch team members for all teams
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        role,
        user:profiles!inner (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .in('team_id', teamsWithRoles.map(t => t.id))

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      throw new Error('Failed to load team members')
    }

    // Group members by team
    const membersByTeam = (members || []).reduce<Record<string, TeamMember[]>>((acc, member) => {
      if (!acc[member.team_id]) {
        acc[member.team_id] = []
      }
      acc[member.team_id].push({
        id: member.id,
        team_id: member.team_id,
        role: member.role,
        user: member.user
      })
      return acc
    }, {})

    // Add members to each team
    const teamsWithMembers = teamsWithRoles.map(team => ({
      ...team,
      members: membersByTeam[team.id] || []
    }))

    // Fetch pending invitations
    const { data: invitations, error: invitationsError } = await supabase
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
      .eq('email', user.email)
      .eq('status', 'pending')

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      throw new Error('Failed to load invitations')
    }

    return (
      <TeamsView
        userId={user.id}
        userEmail={user.email!}
        initialTeams={teamsWithMembers}
        initialInvitations={invitations || []}
      />
    )
  } catch (error) {
    console.error('Error loading teams page:', error)
    throw error
  }
} 