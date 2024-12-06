'use client';

import {cn} from '@/lib/utils';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
    IconBell,
    IconBrain,
    IconCalendar,
    IconDeviceMobile,
    IconPalette,
    IconPlugConnected,
    IconSettings,
    IconUser,
    IconUsers
} from '@tabler/icons-react';

const settingsNav = [
    {
        title: 'Account',
        items: [
            {
                title: 'Profile',
                href: '/settings/profile',
                icon: IconUser
            },
            {
                title: 'Notifications',
                href: '/settings/notifications',
                icon: IconBell
            },
            {
                title: 'Appearance',
                href: '/settings/appearance',
                icon: IconPalette
            }
        ]
    },
    {
        title: 'Workspace',
        items: [
            {
                title: 'Team',
                href: '/settings/team',
                icon: IconUsers
            },
            {
                title: 'Integrations',
                href: '/settings/integrations',
                icon: IconPlugConnected
            }
        ]
    },
    {
        title: 'App',
        items: [
            {
                title: 'General',
                href: '/settings/general',
                icon: IconSettings
            },
            {
                title: 'AI Planning',
                href: '/settings/ai-planning',
                icon: IconBrain
            },
            {
                title: 'Calendar',
                href: '/settings/calendar',
                icon: IconCalendar
            },
            {
                title: 'Mobile App',
                href: '/settings/mobile',
                icon: IconDeviceMobile
            }
        ]
    }
];

export default function SettingsLayout({children}: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="container mx-auto px-4 py-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Settings Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                    <nav className="space-y-6 sticky top-6">
                        {settingsNav.map((group, idx) => (
                            <div key={idx} className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground px-3">
                                    {group.title}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item, itemIdx) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;

                                        return (
                                            <Link
                                                key={itemIdx}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                                    "hover:bg-accent hover:text-accent-foreground",
                                                    isActive && "bg-accent text-accent-foreground font-medium"
                                                )}
                                            >
                                                <Icon className="h-4 w-4"/>
                                                {item.title}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}