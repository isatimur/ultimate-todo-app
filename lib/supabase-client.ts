import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Creates a new Supabase browser client instance
 * 
 * This function creates a typed Supabase client for browser environments
 * using environment variables for the Supabase URL and anonymous key.
 * 
 * @returns {ReturnType<typeof createBrowserClient<Database>>} A typed Supabase client instance
 * 
 * @example
 * // Create a new client instance
 * const supabase = createClient();
 * 
 * // Use the client to query data
 * const { data, error } = await supabase
 *   .from('tasks')
 *   .select('*');
 */
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Default Supabase client instance for browser environments
 * 
 * This is a singleton instance that can be imported and used
 * throughout the application for Supabase operations.
 */
export const supabase = createClient() 