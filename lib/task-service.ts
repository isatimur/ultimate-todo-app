import { createClient } from '@/lib/supabase-server'
import type { Task, Project } from '@/lib/types'

const MAX_RETRIES = 3

async function withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation()
    } catch (error) {
      console.error(`${context} attempt ${attempt} failed:`, error)
      if (attempt === MAX_RETRIES) throw error
    }
  }
  throw new Error(`Failed to ${context}`)
}

export async function getUserTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient()
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(task => ({
      ...task,
      project_details: (task as any).project
    })) as Task[]
  }, 'fetch user tasks')
}

export async function getProjects(userId: string): Promise<Project[]> {
  const supabase = await createClient()
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return (data || []) as Project[]
  }, 'fetch projects')
}

