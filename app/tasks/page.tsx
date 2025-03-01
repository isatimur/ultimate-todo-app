import { createClient } from '@/lib/supabase-server'
import { TaskList } from '@/components/tasks/task-list'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tasks | Ultimate Todo App',
  description: 'Manage your tasks',
}

export const revalidate = 0

async function TasksContent() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/signin')
  }

  try {
    // Fetch tasks with their projects
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      throw tasksError
    }

    // Transform tasks to include project details
    const transformedTasks = tasks.map(task => ({
      ...task,
      project_details: task.project
    }))

     // Fetch projects
     const { data: projects, error: projectsError } = await supabase
     .from('projects')
     .select('*')
     .order('name')

   if (projectsError) {
     console.error('Error fetching projects:', projectsError)
     throw projectsError
   }

    return (
      <div className="space-y-8">
        <TaskList 
          initialTasks={transformedTasks || []}
          userId={user.id}
          projects={projects || []}
        />
      </div>
    )
  } catch (error) {
    console.error('Error in TasksContent:', error)
    throw error
  }
}

export default async function TasksPage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">
        Tasks
      </h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <TasksContent />
      </Suspense>
    </div>
  )
} 