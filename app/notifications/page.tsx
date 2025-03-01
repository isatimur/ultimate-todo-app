import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { NotificationsView } from '@/components/notifications-view'

export const metadata = {
  title: 'Notifications | Ultimate Todo App',
  description: 'View and manage your notifications',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin')
  }

  // Fetch notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 overflow-hidden">
      <NotificationsView 
        userId={user.id} 
      />
    </div>
  )
} 