import { createClient } from '@/lib/supabase-server'
import { TaskList } from '@/components/tasks/task-list'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getUserTasks, getProjects } from '@/lib/task-service'

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
    const [tasks, projects] = await Promise.all([
      getUserTasks(user.id),
      getProjects(user.id)
    ])

    return (
      <div className="space-y-8">
        <TaskList
          initialTasks={tasks}
          userId={user.id}
          projects={projects}
        />
      </div>
    )
  } catch (error) {
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