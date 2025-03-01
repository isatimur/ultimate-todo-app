import { createClient } from '@/lib/supabase-server'
import { ProjectsView } from '@/components/projects-view'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects | Ultimate Todo App',
  description: 'Manage your projects',
}

export const revalidate = 0

async function ProjectsContent() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/signin')
  }

  try {
    // Fetch projects with their tasks count
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        tasks:tasks(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      throw projectsError
    }

    // Transform projects to include tasks count
    const transformedProjects = projects.map(project => ({
      ...project,
      tasksCount: project.tasks?.[0]?.count || 0
    }))

    return (
      <div className="flex-1 overflow-hidden">
        <ProjectsView 
          userId={user.id} 
          initialProjects={transformedProjects} 
        />
      </div>
    )
  } catch (error) {
    console.error('Error in ProjectsContent:', error)
    throw error
  }
}

export default async function ProjectsPage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">
        Projects
      </h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <ProjectsContent />
      </Suspense>
    </div>
  )
} 