"use client"

import * as React from "react"
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from "@/lib/hooks/useMediaQuery"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarClientProps {
    onSignOut: () => Promise<void>;
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
}

export function SidebarClient({ 
    onSignOut,
    activeSection,
    onSectionChange,
}: SidebarClientProps) {
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleSignOut = async () => {
        try {
            await onSignOut();
            router.refresh();
            router.push('/signin');
            toast.success('Successfully signed out');
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Failed to sign out');
        }
    };

    React.useEffect(() => {
        const savedSection = localStorage.getItem('activeSection');
        if (savedSection) {
            onSectionChange(savedSection);
        }
    }, [onSectionChange]);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    Sign Out
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
} 