import { createClient } from '@/lib/supabase-server'
import { TaskList } from '@/components/tasks/task-list'
import { Task, Project } from '@/lib/types'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TaskListSkeleton } from '@/components/tasks/task-list-skeleton'

export const metadata: Metadata = {
  title: 'Tasks | Ultimate Todo App',
  description: 'View and manage your tasks',
}

export const revalidate = 0 // disable cache for this route

async function TasksContent() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error('Error getting user:', userError)
    throw userError
  }

  if (!user) {
    redirect('/signin')
  }

  try {
    // Get user's teams
    const { data: userTeams, error: teamsError } = await supabase
      .rpc('get_user_teams', {
        p_user_id: user.id
      })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      throw teamsError
    }

    // Get team IDs including personal team
    const teamIds = (userTeams || []).map((t: any) => t.team_id)

    // Fetch projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('name')

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      throw projectsError
    }

    const safeProjects = projects ?? [] as Project[]
    
    // Fetch tasks with their projects
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*)
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      throw tasksError
    }

    // Transform tasks to include project details
    const transformedTasks = (tasks ?? []).map(task => ({
      ...task,
      project_details: task.project
    })) as unknown as Task[]

    return (
      <TaskList 
        initialTasks={transformedTasks}
        userId={user.id}
        projects={safeProjects}
      />
    )
  } catch (error) {
    console.error('Error in TasksContent:', error)
    throw error
  }
}

export default async function TasksPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="container py-6 px-4 sm:px-6 lg:px-8 mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your tasks
          </p>
        </div>
        
        <Suspense fallback={<TaskListSkeleton />}>
          <TasksContent />
        </Suspense>
      </div>
    </main>
  )
} 