'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function createTeam(name: string, description: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
            name,
            description,
            owner_id: user.id,
        })
        .select()
        .single();

    if (teamError) throw teamError;

    // Add creator as team owner
    await supabase
        .from('team_members')
        .insert({
            team_id: team.id,
            user_id: user.id,
            role: 'owner',
        });

    return team;
}

export async function inviteTeamMember(teamId: string, email: string, role: 'admin' | 'member') {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Check if user has permission to invite
    const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('Not authorized to invite members');
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { error } = await supabase
        .from('team_invitations')
        .insert({
            team_id: teamId,
            email,
            role,
            token,
            expires_at: expiresAt.toISOString(),
        });

    if (error) throw error;

    // TODO: Send invitation email
}

export async function removeTeamMember(teamId: string, userId: string) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Check if user has permission to remove members
    const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('Not authorized to remove members');
    }

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

    if (error) throw error;
} 