"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { ThemeSwitcherButton } from './themeswitcher';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

const sidebarVariants = {
    open: {
        width: 280,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            staggerChildren: 0.1
        }
    },
    closed: {
        width: 72,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    open: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
        }
    },
    closed: {
        x: -10,
        opacity: 0,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
        }
    }
};

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    open: boolean;
    setOpen: (open: boolean) => void;
    children: React.ReactNode;
    user: User | null;
}

export function Sidebar({ open, setOpen, children, className, user }: SidebarProps) {

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial="closed"
                animate={open ? "open" : "closed"}
                variants={sidebarVariants}
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen",
                    "border-r bg-background/80 backdrop-blur-xl",
                    "flex flex-col",
                    className
                )}
            >
                {/* Logo Section */}
                <div className="flex h-16 items-center px-4 border-b">
                    <Image
                        src="/logo.webp"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="mr-2"
                    />
                    {open && (
                        <motion.span
                            variants={itemVariants}
                            className="text-xl font-semibold"
                        >
                            Ultima
                        </motion.span>
                    )}
                </div>

                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-4 top-4 h-8 w-8 rounded-full border bg-background shadow-sm z-50"
                    onClick={() => setOpen(!open)}
                >
                    <ChevronLeft className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        !open && "rotate-180"
                    )} />
                </Button>

                {/* Main Content */}
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {children}
                </div>

                {/* Theme and User Section */}
                <div className="border-t py-2">
                    <div className="px-2 space-y-1">
                        <ThemeSwitcherButton
                            collapsed={!open}
                            className={cn(
                                "w-full h-11",
                                "hover:bg-accent"
                            )}
                        />

                        {user && (
                            <div className={cn(
                                "flex items-center h-11",
                                open ? "px-3" : "justify-center"
                            )}>
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.user_metadata?.avatar_url} />
                                    <AvatarFallback>
                                        {user.email?.[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                {open && (
                                    <motion.div
                                        variants={itemVariants}
                                        className="ml-3 overflow-hidden"
                                    >
                                        <p className="text-sm font-medium leading-none truncate">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-1">
                                            {user.email}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
}

interface SidebarLinkProps {
    link: {
        label: string;
        href: string;
        icon: React.ReactNode;
        description: string;
    };
    isActive: boolean;
    collapsed: boolean;
    onClick: () => void;
}

export function SidebarLink({ link, isActive, collapsed, onClick }: SidebarLinkProps) {
    const isExternalLink = link.href.startsWith('/');

    return (
        <Link
            href={link.href}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            )}
            onClick={(e) => {
                if (!isExternalLink) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            {link.icon}
            {!collapsed && <span>{link.label}</span>}
        </Link>
    );
}
