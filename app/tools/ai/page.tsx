import { Metadata } from 'next'
import { PageContainer, PageHeader } from '@/components/page-container'
import { AIAssistant } from '@/components/ai/ai-assistant'

export const metadata: Metadata = {
  title: 'AI Assistant | Ultimate Todo App',
  description: 'Get help with your tasks and projects',
}

export default function AIAssistantPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="AI Assistant" 
        description="Get help with your tasks and projects"
      />
      
      <div className="mt-8">
        <AIAssistant />
      </div>
    </PageContainer>
  )
} 