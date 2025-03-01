import { createClient } from '@/lib/supabase-server'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AdvancedTaskForm } from '@/components/tasks/advanced-task-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create New Task | Ultimate Todo App',
  description: 'Create a new task with advanced options'
}

async function NewTaskContent() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Auth error:', userError)
    redirect('/signin')
  }

  // Fetch projects for the project selector
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  // Fetch team members if user is part of a team
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('user_id, teams!inner(*)')
    .eq('user_id', user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <AdvancedTaskForm 
        projects={projects || []}
        teamId={teamMembers?.[0]?.teams?.id}
        userId={user.id}
      />
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <NewTaskContent />
    </Suspense>
  )
} 