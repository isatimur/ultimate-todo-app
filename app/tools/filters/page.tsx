import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { FiltersView } from '@/components/filters-view'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saved Filters | Ultimate Todo App',
  description: 'Manage your saved task filters',
}

export const revalidate = 0

async function FiltersContent() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      redirect('/signin')
    }

    // Fetch user's saved filters
    const { data: filters, error: filtersError } = await supabase
      .from('saved_filters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filtersError) {
      console.error('Error fetching filters:', filtersError)
      throw filtersError
    }

    return (
      <div className="space-y-8">
        <FiltersView 
          userId={user.id}
          initialFilters={filters || []}
        />
      </div>
    )
  } catch (error) {
    console.error('Error in FiltersContent:', error)
    throw error
  }
}

export default async function FiltersPage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">
        Saved Filters
      </h1>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <FiltersContent />
      </Suspense>
    </div>
  )
} 