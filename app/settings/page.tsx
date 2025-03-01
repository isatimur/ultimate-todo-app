import { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/page-container'
import { SettingsPageClient } from '@/components/settings-page-client'

export const metadata: Metadata = {
  title: 'Settings | Ultimate Todo App',
  description: 'Manage your account settings and preferences',
}

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="Settings" 
        description="Manage your account settings and preferences"
      />
      
      <div className="mt-6">
        <SettingsPageClient />
      </div>
    </PageContainer>
  )
} 