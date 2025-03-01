// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import type { CookieOptions } from '@supabase/ssr'

export async function createClient() {
  const cookieStore = await cookies()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  try {
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          async get(name: string) {
            return cookieStore.get(name)?.value ?? ''
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              await cookieStore.set({ 
                name, 
                value,
                ...options,
                sameSite: options.sameSite as 'lax' | 'strict' | 'none' | undefined
              })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              await cookieStore.set({ 
                name, 
                value: '',
                ...options,
                maxAge: 0,
                sameSite: options.sameSite as 'lax' | 'strict' | 'none' | undefined
              })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          }
        }
      }
    )

    // Test the connection
    const { error } = await client.auth.getSession()
    if (error) {
      console.error('Error testing Supabase connection:', error)
      throw error
    }

    return client
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}
