import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TeamsView from '@/components/teams/teams-view'
import { Database } from '@/lib/database.types'
import {
  fetchUserTeams,
  fetchTeamMembers,
  fetchPendingInvitations,
} from '@/lib/server/teamService'

export const dynamic = 'force-dynamic'

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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Auth error:', userError)
    redirect('/signin')
  }

  try {
    const teamsWithRoles = await fetchUserTeams(supabase, user.id)

    const membersByTeam = await fetchTeamMembers(
      supabase,
      teamsWithRoles.map(t => t.id)
    )

    const teamsWithMembers = teamsWithRoles.map(team => ({
      ...team,
      members: membersByTeam[team.id] || [],
    }))

    const processedInvitations = await fetchPendingInvitations(
      supabase,
      user.email!
    )

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

