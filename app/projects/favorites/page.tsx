import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ProjectsView } from '@/components/projects-view'

export const metadata = {
  title: 'Favorite Projects | Ultimate Todo App',
  description: 'View and manage your favorite projects',
}

export default async function FavoriteProjectsPage() {
  const supabase = createClient()
  
  const { data: { session }, error } = await (await supabase).auth.getSession()
  
  if (error || !session?.user) {
    redirect('/signin')
  }

  // Fetch favorite projects
  const { data: projects } = await (await supabase)
    .from('projects')
    .select('*')
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 overflow-hidden">
      <ProjectsView 
        userId={session.user.id} 
        initialProjects={projects || []} 
      />
    </div>
  )
}