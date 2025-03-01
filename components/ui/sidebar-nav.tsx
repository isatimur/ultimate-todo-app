"use client"

import * as React from "react"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { toast } from 'sonner'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarNavProps {
    items: {
        id: string
        label: string
        icon: React.ElementType
        href: string
    }[]
    signOut: () => Promise<void>
}

export function SidebarNav({ items, signOut }: SidebarNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [activeSection, setActiveSection] = React.useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('activeSection') || 'dashboard'
        }
        return 'dashboard'
    })

    const handleSignOut = async () => {
        try {
            await signOut()
            router.push('/signin')
            toast.success('Successfully signed out')
        } catch (error) {
            console.error('Error signing out:', error)
            toast.error('Failed to sign out')
        }
    }

    const handleSectionChange = (sectionId: string) => {
        setActiveSection(sectionId)
        localStorage.setItem('activeSection', sectionId)
    }

    return (
        <>
            <div className="px-3 py-2">
                <div className="space-y-1">
                    {items.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <TooltipProvider key={item.id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href={item.href}>
                                            <Button 
                                                variant={isActive ? "secondary" : "ghost"}
                                                className="w-full justify-start"
                                                onClick={() => handleSectionChange(item.id)}
                                            >
                                                <item.icon className="mr-2 h-4 w-4" />
                                                {item.label}
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    })}
                </div>
            </div>
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Settings
                </h2>
                <div className="space-y-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="w-full justify-start" 
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                Sign Out
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </>
    )
} 