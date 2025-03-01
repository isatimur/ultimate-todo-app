import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ProfileView } from '@/components/profile-view'
import type { Database } from '@/lib/database.types'

export const metadata = {
  title: 'Profile | Ultimate Todo App',
  description: 'Manage your profile settings and preferences',
}

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/signin')
  }

  // Fetch user profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select()
    .match({ id: user.id })
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    // If profile doesn't exist, create one
    const newProfileData = {
      id: user.id,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? null,
      username: null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      bio: null,
      website: null,
      company: null,
      job_title: null,
      location: null,
      phone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      date_of_birth: null
    } satisfies Partial<Profile>

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([newProfileData])
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      throw createError
    }

    if (!newProfile) {
      throw new Error('Failed to create profile')
    }

    return (
      <div className="flex-1 p-6 overflow-hidden">
        <ProfileView user={user} initialProfile={newProfile as Profile} />
      </div>
    )
  }

  if (!profile) {
    throw new Error('Failed to fetch profile')
  }

  return (
    <div className="flex-1 p-6 overflow-hidden">
      <ProfileView user={user} initialProfile={profile as Profile} />
    </div>
  )
}