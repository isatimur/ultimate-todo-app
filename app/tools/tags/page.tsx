import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { TagsView } from '@/components/tags-view'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tags | Ultimate Todo App',
  description: 'Manage your task tags',
}

export const revalidate = 0

async function TagsContent() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      redirect('/signin')
    }

    // Fetch tasks with their tags
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('tags')
      .eq('user_id', user.id)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      throw tasksError
    }

    // Extract unique tags from all tasks
    const uniqueTags = Array.from(new Set(
      tasks
        .flatMap(task => task.tags || [])
        .filter(Boolean)
    ))

    return (
      <div className="space-y-8">
        <TagsView 
          userId={user.id}
          initialTags={uniqueTags}
        />
      </div>
    )
  } catch (error) {
    console.error('Error in TagsContent:', error)
    throw error
  }
}

export default async function TagsPage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">
        Tags
      </h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <TagsContent />
      </Suspense>
    </div>
  )
} 