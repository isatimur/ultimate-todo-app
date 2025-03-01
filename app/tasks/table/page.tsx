import { createClient } from '@/lib/supabase-server'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { TaskTable } from '@/components/tasks/task-table'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Task Table | Ultimate Todo App',
  description: 'View and manage your tasks in a table format',
}

export const revalidate = 0

async function TaskTableContent() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      redirect('/signin')
    }

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

    return (
      <div className="h-[calc(100vh-10rem)] overflow-hidden">
        <TaskTable 
          initialTasks={transformedTasks}
          userId={user.id}
        />
      </div>
    )
  } catch (error) {
    console.error('Error in TaskTableContent:', error)
    redirect('/tasks')
  }
}

export default async function TaskTablePage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">
        Task Table
      </h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <TaskTableContent />
      </Suspense>
    </div>
  )
} 