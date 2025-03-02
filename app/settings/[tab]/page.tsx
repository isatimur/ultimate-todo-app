import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import SettingsLayout from '@/components/settings/settings-layout';
import GeneralSettings from '@/components/settings/general-settings';
import AppearanceSettings from '@/components/settings/appearance-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { IntegrationSettings } from '@/components/settings/integration-settings';
import { TeamSettings } from '@/components/settings/team-settings';
import { AIPlanningSettings } from '@/components/settings/ai-planning-settings';
import { MobileSettings } from '@/components/settings/mobile-settings';
import { CalendarSettings } from '@/components/settings/calendar-settings';

// This helps Next.js understand the structure of the params
export async function generateStaticParams() {
  return [
    { tab: 'general' },
    { tab: 'appearance' },
    { tab: 'notifications' },
    { tab: 'integrations' },
    { tab: 'team' },
    { tab: 'ai-planning' },
    { tab: 'mobile' },
    { tab: 'calendar' }
  ]
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

export default async function SettingsTabPage(props: any) {
  const { tab } = props.params;

  // Validate tab parameter
  if (!validTabs.includes(tab)) {
    redirect('/settings/general');
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin');
  }

  // Render the appropriate settings component based on the tab
  const renderSettingsContent = () => {
    switch (tab) {
      case 'general':
        return <GeneralSettings user={user} />;
      case 'appearance':
        return <AppearanceSettings user={user} />;
      case 'notifications':
        return <NotificationSettings user={user} />;
      case 'integrations':
        return <IntegrationSettings user={user} />;
      case 'team':
        return <TeamSettings user={user} />;
      case 'ai-planning':
        return <AIPlanningSettings user={user} />;
      case 'mobile':
        return <MobileSettings user={user} />;
      case 'calendar':
        return <CalendarSettings user={user} />;
      default:
        return <GeneralSettings user={user} />;
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <SettingsLayout currentTab={tab}>
        {renderSettingsContent()}
      </SettingsLayout>
    </main>
  );
} 