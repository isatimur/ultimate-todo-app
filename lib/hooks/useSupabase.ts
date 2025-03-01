"use client"

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export function useSupabase(): SupabaseClient<Database> {
  const [supabase] = useState(() => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables')
      }

      return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    } catch (error) {
      console.error('Error initializing Supabase client:', error)
      throw error
    }
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear any cached data or handle sign out
        localStorage.removeItem('supabase.auth.token')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return supabase
} 