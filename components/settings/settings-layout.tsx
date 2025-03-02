"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  IconAdjustments,
  IconBell,
  IconBrush,
  IconCalendar,
  IconDeviceMobile,
  IconPlugConnected,
  IconRobot,
  IconUsers
} from "@tabler/icons-react";

/**
 * Props interface for the SettingsLayout component
 * 
 * @interface SettingsLayoutProps
 * @property {ReactNode} children - Child components to render in the main content area
 * @property {string} currentTab - Current active settings tab ID
 */
interface SettingsLayoutProps {
  children: ReactNode;
  currentTab: string;
}

/**
 * Array of available settings tabs with their metadata
 * 
 * @type {Array<{id: string, label: string, icon: JSX.Element, description: string}>}
 */
const settingsTabs = [
  {
    id: 'general',
    label: 'General',
    icon: <IconAdjustments className="h-5 w-5" />,
    description: 'Basic settings and preferences'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <IconBrush className="h-5 w-5" />,
    description: 'Customize the look and feel'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <IconBell className="h-5 w-5" />,
    description: 'Configure alerts and reminders'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: <IconPlugConnected className="h-5 w-5" />,
    description: 'Connect with other services'
  },
  {
    id: 'team',
    label: 'Team',
    icon: <IconUsers className="h-5 w-5" />,
    description: 'Manage team members and roles'
  },
  {
    id: 'ai-planning',
    label: 'AI Planning',
    icon: <IconRobot className="h-5 w-5" />,
    description: 'Configure AI task planning features'
  },
  {
    id: 'mobile',
    label: 'Mobile',
    icon: <IconDeviceMobile className="h-5 w-5" />,
    description: 'Mobile app settings and sync'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <IconCalendar className="h-5 w-5" />,
    description: 'Calendar integration settings'
  }
];

/**
 * Layout component for the settings pages
 * Provides a consistent layout with a sidebar navigation and main content area
 * 
 * @param {SettingsLayoutProps} props - Component props
 * @param {ReactNode} props.children - Child components to render in the main content area
 * @param {string} props.currentTab - Current active settings tab ID
 * @returns {JSX.Element} The rendered settings layout
 * 
 * @example
 * <SettingsLayout currentTab="general">
 *   <GeneralSettingsContent />
 * </SettingsLayout>
 */
export default function SettingsLayout({ children, currentTab }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="space-y-1">
            {settingsTabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/settings/${tab.id}`}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-muted transition-colors",
                  currentTab === tab.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-foreground"
                )}
              >
                <span className="mr-3">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          <Card className="p-6">
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}