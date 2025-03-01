import { createClient } from '@/lib/supabase-server'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { TaskDetails } from '@/components/tasks/task-details'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'

interface TaskPageProps {
  params: {
    id: string
  }
}

// This is a dynamic metadata function
export async function generateMetadata({ params }: TaskPageProps): Promise<Metadata> {
  // Ensure params is fully resolved before destructuring
  const resolvedParams = await Promise.resolve(params)
  const { id } = resolvedParams
  
  if (!id || id === 'new') return { title: 'New Task | Ultimate Todo App' }

  const supabase = await createClient()
  
  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', id)
      .single()

    return {
      title: task?.title ? `${task.title} | Ultimate Todo App` : 'Task Details',
      description: `View and manage task: ${task?.title || 'Not found'}`
    }
  } catch (error) {
    console.error('Error fetching task metadata:', error)
    return {
      title: 'Task Details | Ultimate Todo App',
      description: 'View and manage task details'
    }
  }
}

async function TaskContent({ params }: TaskPageProps) {
  // Ensure params is fully resolved before destructuring
  const resolvedParams = await Promise.resolve(params)
  const { id } = resolvedParams
  
  if (!id) notFound()
  if (id === 'new') redirect('/tasks/new')

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      redirect('/signin')
    }

    // Fetch task with all its data (including the subtasks JSON field)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      console.error('Task error:', taskError)
      notFound()
    }

    // No need to fetch subtasks separately - they're already in the task.subtasks field
    // Transform task to include project details
    const transformedTask = {
      ...task,
      project_details: task.project,
      // Make sure subtasks exists and is an array
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <TaskDetails task={transformedTask} />
      </div>
    )
  } catch (error) {
    console.error('Error in TaskContent:', error)
    notFound()
  }
}

export default function TaskPage(props: TaskPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TaskContent params={props.params} />
    </Suspense>
  )
} 