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

// Define the type for user teams from RPC
interface UserTeam {
  team_id: string;
  team_role: string;
  [key: string]: any;
}

// Define the type for the member data returned from Supabase
interface MemberData {
  id: string;
  team_id: string;
  role: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
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
      .in('id', (userTeams || []).map((t: UserTeam) => t.team_id))

    if (teamDetailsError) {
      console.error('Error fetching team details:', teamDetailsError)
      throw new Error('Failed to load team details')
    }

    // Combine team details with roles
    const teamsWithRoles = (teams || []).map(team => {
      const userTeam = userTeams?.find((ut: UserTeam) => ut.team_id === team.id)
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
        joined_at,
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
    const membersByTeam = (members || []).reduce<Record<string, TeamMember[]>>((acc, member: any) => {
      if (!acc[member.team_id]) {
        acc[member.team_id] = []
      }
      
      // Check if user is an array and get the first item if it is
      const userInfo = Array.isArray(member.user) ? member.user[0] : member.user;
      
      if (!userInfo) {
        console.warn('Missing user info for team member:', member.id);
        return acc; // Skip this member if no user info
      }
      
      // Ensure we're creating a properly typed TeamMember object
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
          avatar_url: userInfo.avatar_url
        }
      };
      
      acc[member.team_id].push(teamMember);
      return acc;
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

    // Process invitations to match the expected TeamInvitation type
    const processedInvitations: TeamInvitation[] = (invitations || []).map((invitation: any) => {
      // Check if team is an array and get the first item if it is
      const teamInfo = Array.isArray(invitation.team) ? invitation.team[0] : invitation.team;
      
      return {
        id: invitation.id,
        team_id: invitation.team_id,
        email: invitation.email,
        role: invitation.role as 'owner' | 'admin' | 'member',
        status: invitation.status as 'pending' | 'accepted' | 'rejected',
        invited_at: invitation.invited_at,
        expires_at: invitation.expires_at,
        token: invitation.token,
        team: teamInfo ? {
          id: teamInfo.id,
          name: teamInfo.name,
          description: teamInfo.description
        } : undefined
      };
    });

    return (
      <TeamsView
        userId={user.id}
        userEmail={user.email!}
        initialTeams={teamsWithMembers}
        initialInvitations={processedInvitations}
      />
    )
  } catch (error) {
    console.error('Error loading teams page:', error)
    throw error
  }
} 