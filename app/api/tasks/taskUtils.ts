import { createClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new ApiError('Unauthorized', 401)

  return { supabase, user }
}

export async function verifyTaskOwnership(
  supabase: SupabaseClient,
  taskId: string,
  userId: string
) {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('user_id')
    .eq('id', taskId)
    .single()

  if (error || !task) throw new ApiError('Task not found', 404)

  if (task.user_id !== userId) throw new ApiError('Unauthorized', 403)
}

