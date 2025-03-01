import { createClient } from '@/lib/supabase-server'
import { DashboardView } from '@/components/dashboard-view'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { TaskList } from '@/components/tasks/task-list'
import { Task, Project } from '@/lib/types'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Database } from '@/lib/database.types'
import { Suspense } from 'react'
import { PageContainer, PageHeader } from '@/components/page-container'

export const metadata: Metadata = {
  title: 'Dashboard | Ultimate Todo App',
  description: 'View and manage your tasks and projects',
}

export const revalidate = 0 // disable cache for this route

async function DashboardContent() {
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
    console.log('Fetching data for user:', user.id)

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
        id,
        title,
        description,
        status,
        priority,
        due_date,
        created_at,
        updated_at,
        project_id,
        user_id,
        team_id,
        time_tracked,
        tags,
        project:projects(
          id,
          name,
          color,
          description
        )
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })


    // Transform and type the data
    const safeTasks = (tasks ?? []) as unknown as (Database['public']['Tables']['tasks']['Row'] & {
      project: Database['public']['Tables']['projects']['Row'] | null
    })[]


    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      throw tasksError
    }



    console.log('Data fetched successfully:', {
      tasksCount: tasks?.length ?? 0,
      projectsCount: projects?.length ?? 0,
      teamsCount: teamIds.length
    })
    // Calculate dashboard statistics
    const now = new Date()
    const stats = {
      total: safeTasks.length,
      completed: safeTasks.filter(t => t.status === 'Complete').length,
      inProgress: safeTasks.filter(t => t.status === 'In Progress').length,
      pending: safeTasks.filter(t => t.status === 'To Do' && (!t.due_date || new Date(t.due_date).toISOString() > now.toISOString())).length,
      overdue: safeTasks.filter(t => t.status !== 'Complete' && t.due_date && new Date(t.due_date).toISOString() < now.toISOString()).length,
      highPriority: safeTasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').length
    }

    // Transform tasks to include project details
    const transformedTasks = safeTasks.map(task => ({
      ...task,
      project_details: task.project
    })) as unknown as Task[]

    return (
      <div className="space-y-8">
        <DashboardView 
          initialTasks={transformedTasks}
          initialProjects={safeProjects}
          stats={stats}
          user={user}
        />

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            All Tasks
          </h2>
          <TaskList 
            initialTasks={transformedTasks}
            userId={user.id}
            projects={safeProjects}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in DashboardContent:', error)
    throw error
  }
}

export default function Home() {
  return (
    <PageContainer>
      <PageHeader 
        title="Dashboard" 
        description="Welcome to your personal dashboard"
      />
      
      <div className="mt-6">
        <Suspense fallback={<div>Loading dashboard...</div>}>
          <DashboardContent />
        </Suspense>
      </div>
    </PageContainer>
  )
}
