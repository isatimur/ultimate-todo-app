import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import UltimateTodoAppComponent from '@/components/ultima-todo-app-component';

interface SettingsTabPageProps {
  params: {
    tab: string;
  };
}

const validTabs = [
  'general',
  'appearance',
  'notifications',
  'integrations',
  'team',
  'ai-planning',
  'mobile',
  'calendar'
];

export default async function SettingsTabPage({ params }: SettingsTabPageProps) {
  const { tab } = params;

  // Validate tab parameter
  if (!validTabs.includes(tab)) {
    redirect('/settings/general');
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin');
  }

  return (
    <main className="flex min-h-screen flex-col">
      <UltimateTodoAppComponent user={user} initialView="settings" />
    </main>
  );
} 