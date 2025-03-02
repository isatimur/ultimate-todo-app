import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from './analytics-dashboard'

export const dynamic = 'force-dynamic'

// Define types for team and analytics data
interface Team {
  team_id: string;
  name: string;
  is_owner: boolean;
  role: string;
  [key: string]: any;
}

interface TeamAnalytics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

async function getAnalyticsData() {
  // Await the cookies() function as it returns a Promise in Next.js 15
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: any) {
          // This is a server component, we can't set cookies directly
          // This is just to satisfy the type
        },
        remove(name: string, options: any) {
          // This is a server component, we can't remove cookies directly
          // This is just to satisfy the type
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/signin')
  }

  // Get user's teams using the new function
  const { data: userTeams, error: teamsError } = await supabase
    .rpc('get_user_teams', {
      p_user_id: user.id
    })

  if (teamsError) {
    console.error('Error fetching teams:', teamsError)
    throw new Error('Failed to load analytics data')
  }

  // Get analytics for each team
  const teamsWithAnalytics = await Promise.all(
    (userTeams || []).map(async (team: Team) => {
      const { data: analytics, error: analyticsError } = await supabase
        .rpc('get_team_analytics', {
          p_team_id: team.team_id
        })

      if (analyticsError) {
        console.error('Error fetching team analytics:', analyticsError)
        return {
          ...team,
          analytics: {
            total_tasks: 0,
            completed_tasks: 0,
            in_progress_tasks: 0,
            overdue_tasks: 0,
            completion_rate: 0
          } as TeamAnalytics
        }
      }

      // Get team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          user:profiles!inner (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', team.team_id)

      if (membersError) {
        console.error('Error fetching team members:', membersError)
      }

      return {
        ...team,
        analytics: analytics?.[0] || {
          total_tasks: 0,
          completed_tasks: 0,
          in_progress_tasks: 0,
          overdue_tasks: 0,
          completion_rate: 0
        } as TeamAnalytics,
        members: members || []
      }
    })
  )

  // Find personal team
  const personalTeam = teamsWithAnalytics.find(team => 
    team.team_id === userTeams?.find((t: Team) => t.is_owner)?.team_id
  )

  return {
    teams: teamsWithAnalytics.filter(t => t !== personalTeam),
    personalTeam,
    userId: user.id
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  return <AnalyticsDashboard {...data} />
} 