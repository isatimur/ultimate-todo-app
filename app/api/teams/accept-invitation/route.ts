import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const invitationId = body.invitationId

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*, team:teams(name)')
      .eq('id', invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { error: 'Invitation already accepted' },
        { status: 400 }
      )
    }

    // Check if user is already a team member
    const { data: existingMember, error: memberError } = await supabase
      .from('team_members')
      .select()
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberError) {
      return NextResponse.json(
        { error: 'Failed to check team membership' },
        { status: 500 }
      )
    }

    if (existingMember) {
      // Update invitation status
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)

      return NextResponse.json(
        { message: 'Already a team member' },
        { status: 200 }
      )
    }

    // Begin transaction
    const { error: transactionError } = await supabase.rpc('accept_team_invitation', {
      p_invitation_id: invitationId,
      p_user_id: user.id
    })

    if (transactionError) {
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Invitation accepted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 