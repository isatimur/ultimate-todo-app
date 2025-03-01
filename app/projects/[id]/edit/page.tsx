import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { EditProjectForm } from '@/components/edit-project-form'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Project | Ultimate Todo App',
  description: 'Edit your project details',
}

async function EditProjectContent({ id }: { id: string }) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select()
    .eq('id', parseInt(id))
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <EditProjectForm project={project} />
    </div>
  )
}

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">
        Edit Project
      </h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <EditProjectContent id={params.id} />
      </Suspense>
    </div>
  )
} 