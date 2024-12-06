'use client';

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {IconCheckbox, IconFolders, IconLayoutDashboard, IconSettings, IconX,} from '@tabler/icons-react';

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const navigation = [
    {name: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard},
    {name: 'Tasks', href: '/tasks', icon: IconCheckbox},
    {name: 'Projects', href: '/projects', icon: IconFolders},
    {name: 'Settings', href: '/settings', icon: IconSettings},
];

export function Sidebar({open, onClose}: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden',
                    {'hidden': !open}
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg lg:static',
                    {'-translate-x-full': !open, 'translate-x-0': open},
                    'transform transition-transform duration-200 ease-in-out lg:translate-x-0'
                )}
            >
                <div className="flex h-16 items-center justify-between px-4">
                    <Link href="/dashboard" className="text-xl font-semibold">
                        Ultima Todo
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={onClose}
                    >
                        <IconX className="h-5 w-5"/>
                    </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-4rem)] px-3">
                    <nav className="flex flex-col gap-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                        'hover:bg-accent hover:text-accent-foreground',
                                        pathname === item.href
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <Icon className="h-5 w-5"/>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>
            </div>
        </>
    );
}