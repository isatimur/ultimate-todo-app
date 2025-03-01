'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TeamInvitation } from '@/lib/types'

export async function getInvitation(invitationId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/signin?redirect=/teams/invite/' + invitationId)
  }

  const { data: invitation, error } = await supabase
    .from('team_invitations')
    .select('*, team:teams(name)')
    .eq('id', invitationId)
    .single()

  if (error || !invitation) {
    console.error('Error fetching invitation:', error)
    redirect('/teams')
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    redirect('/teams?error=invitation-expired')
  }

  // Check if invitation is already accepted
  if (invitation.status === 'accepted') {
    redirect('/teams?error=invitation-already-accepted')
  }

  return invitation as TeamInvitation & { team: { name: string } }
}

export async function acceptInvitation(invitationId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  const { error } = await supabase.rpc('accept_team_invitation', {
    p_invitation_id: invitationId,
    p_user_id: user.id
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/teams')
}

export async function rejectInvitation(invitationId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  const { error } = await supabase
    .from('team_invitations')
    .update({ status: 'rejected' })
    .eq('id', invitationId)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/teams')
} 