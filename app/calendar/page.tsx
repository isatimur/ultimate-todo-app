import { Metadata } from 'next'
import { CalendarPageClient } from '@/components/calendar-page-client'
import { PageContainer, PageHeader } from '@/components/page-container'

export const metadata: Metadata = {
  title: 'Calendar | Ultimate Todo App',
  description: 'View and manage your tasks in a calendar view',
}

export default function CalendarPage() {
  return (
    <PageContainer fullWidth>
      <PageHeader 
        title="Calendar" 
        description="View and manage your tasks in a calendar"
      />
      
      <div className="mt-6">
        <CalendarPageClient />
      </div>
    </PageContainer>
  )
} 