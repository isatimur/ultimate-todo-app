import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { TimerView } from '@/components/timer-view'

export const metadata = {
  title: 'Timer | Ultimate Todo App',
  description: 'Track your time and stay focused with Pomodoro timer',
}

interface TimerSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
}

interface TimeEntry {
  id: string
  user_id: string
  task_id?: string
  start_time: string
  end_time?: string
  duration: number
  type: 'pomodoro' | 'break' | 'manual'
  notes?: string
}

export default async function TimerPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/signin')
  }

  // Fetch user's timer settings and time entries
  const { data: settings } = await supabase
    .from('user_settings')
    .select('timer_settings')
    .eq('user_id', user.id)
    .single()

  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Convert time entries to the correct type
  const typedTimeEntries = timeEntries?.map(entry => ({
    ...entry,
    type: entry.type || 'manual' // Default to manual if type is not set
  })) as TimeEntry[] | undefined

  return (
    <div className="flex-1 overflow-hidden">
      <TimerView 
        userId={user.id} 
        initialSettings={settings?.timer_settings as TimerSettings | undefined} 
        initialTimeEntries={typedTimeEntries || []}
      />
    </div>
  )
} 