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

/**
 * Retrieve all tasks belonging to a user from the `tasks` table.
 *
 * @param {string} userId - The identifier of the user whose tasks should be returned.
 * @returns {Promise<Task[]>} Resolves with an array of tasks enriched with optional project details.
 * @throws {Error} Throws if the tasks cannot be fetched after retrying the Supabase request.
 *
 * @example
 * ```ts
 * // The `tasks` table is expected to match the following schema:
 * // create table tasks (
 * //   id uuid primary key,
 * //   user_id uuid references users(id),
 * //   project_id uuid references projects(id),
 * //   title text,
 * //   description text,
 * //   status text,
 * //   priority text,
 * //   due_date timestamp,
 * //   created_at timestamp default now(),
 * //   updated_at timestamp default now()
 * // );
 * const tasks = await getUserTasks('user-123');
 * ```
 */
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

/**
 * Fetch projects owned by a user from the `projects` table.
 *
 * @param {string} userId - The identifier of the user whose projects should be fetched.
 * @returns {Promise<Project[]>} Resolves with an array of projects.
 * @throws {Error} Throws if the projects cannot be retrieved after retrying the Supabase request.
 *
 * @example
 * ```ts
 * // The `projects` table is expected to match the following schema:
 * // create table projects (
 * //   id uuid primary key,
 * //   user_id uuid references users(id),
 * //   name text,
 * //   color text,
 * //   description text,
 * //   created_at timestamp default now(),
 * //   updated_at timestamp default now()
 * // );
 * const projects = await getProjects('user-123');
 * ```
 */
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

