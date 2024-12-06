'use client';

import {User} from '@supabase/supabase-js';
import {Avatar, AvatarFallback, AvatarImage} from './avatar';
import {Badge} from './badge';
import {Card} from './card';
import {motion} from 'framer-motion';
import {IconArrowUp, IconBrain, IconClock, IconFlame, IconNotebook, IconTrophy} from '@tabler/icons-react';

interface ProfileSidebarProps {
    user: User | null;
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface Badge {
    icon: JSX.Element;
    label: string;
    description: string;
}

const badges: Badge[] = [
    {
        icon: <IconFlame className="h-4 w-4 text-orange-500"/>,
        label: "2 Day Streak",
        description: "Completed tasks two days in a row"
    },
    {
        icon: <IconNotebook className="h-4 w-4 text-blue-500"/>,
        label: "Good Planner",
        description: "Creates detailed task plans"
    },
    {
        icon: <IconClock className="h-4 w-4 text-green-500"/>,
        label: "Best Time Tracker",
        description: "Tracks time consistently"
    },
    {
        icon: <IconBrain className="h-4 w-4 text-purple-500"/>,
        label: "Productivity Hacker",
        description: "Uses advanced productivity features"
    },
    {
        icon: <IconTrophy className="h-4 w-4 text-yellow-500"/>,
        label: "Self Improver",
        description: "Consistently completes personal goals"
    }
];

export function ProfileSidebar({user, open, setOpen}: ProfileSidebarProps) {
    return (
        <>
            {open && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 0.4}}
                    exit={{opacity: 0}}
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <motion.div
                initial={{x: 300}}
                animate={{x: open ? 0 : 300}}
                transition={{duration: 0.3, ease: [0.4, 0, 0.2, 1]}}
                className={`fixed right-0 top-0 z-50 h-screen w-[300px] border-l bg-background/80 backdrop-blur-xl p-6 shadow-xl`}
            >
                <div className="flex flex-col h-full">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center space-y-4 pb-6 border-b">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={user?.user_metadata?.avatar_url}/>
                            <AvatarFallback className="text-xl bg-primary/10">
                                {user?.email?.[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h2 className="text-xl font-semibold">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                            </h2>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <IconArrowUp className="h-3 w-3"/> 0/100
                        </Badge>
                    </div>

                    {/* Badges Section */}
                    <div className="py-6">
                        <h3 className="text-sm font-semibold mb-4">My Badges</h3>
                        <div className="space-y-3">
                            {badges.map((badge, index) => (
                                <Card key={index} className="p-3 hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            {badge.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{badge.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {badge.description}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="mt-auto border-t pt-6">
                        <h3 className="text-sm font-semibold mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="p-3">
                                <p className="text-xs text-muted-foreground">Tasks Completed</p>
                                <p className="text-2xl font-bold">24</p>
                            </Card>
                            <Card className="p-3">
                                <p className="text-xs text-muted-foreground">Time Tracked</p>
                                <p className="text-2xl font-bold">12h</p>
                            </Card>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
} 