import { createClient } from '@/lib/supabase-server'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Database } from '@/lib/database.types'
import { ProjectView } from '@/components/projects/project-view'

type Project = Database['public']['Tables']['projects']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

// This helps Next.js understand the structure of the params
export async function generateStaticParams() {
  return []
}

type ProjectWithTasks = Project & {
  tasks: Task[]
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const supabase = await createClient()
  const projectId = parseInt(params.id)
  
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    return {
      title: project?.name || 'Project Details',
      description: `View and manage tasks for ${project?.name || 'this project'}`
    }
  } catch (error) {
    console.error('Error fetching project metadata:', error)
    return {
      title: 'Project Details',
      description: 'View and manage project tasks'
    }
  }
}

async function ProjectContent({ id }: { id: string }) {
  try {
    const supabase = await createClient()
    const projectId = parseInt(id)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError)
      redirect('/signin')
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        tasks (*)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.error('Project error:', projectError)
      redirect('/projects')
    }

    const typedProject = project as ProjectWithTasks

    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectView project={typedProject} />
      </div>
    )
  } catch (error) {
    console.error('Error in ProjectContent:', error)
    redirect('/projects')
  }
}

export default function ProjectPage(props: any) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ProjectContent id={props.params.id} />
    </Suspense>
  )
} 