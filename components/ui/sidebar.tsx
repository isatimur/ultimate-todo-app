"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    HomeIcon, 
    ListTodoIcon, 
    FolderIcon, 
    BarChartIcon,
    LogOutIcon,
    Settings2Icon,
    Users2Icon,
    BellIcon,
    CalendarIcon,
    StarIcon,
    SearchIcon,
    ClockIcon,
    BrainIcon,
    LayoutDashboardIcon,
    CheckSquareIcon,
    ListIcon,
    GanttChartIcon,
    TableIcon,
    KanbanIcon,
    TimerIcon,
    TagIcon,
    FilterIcon,
    PlusIcon,
    User,
    Settings,
    LogOut,

    Bell,
    Search,
    Plus,
    Calendar,
    LayoutDashboard,
    CheckSquare,
    FolderKanban,
    BarChart,
    Users,
    Moon,
    Sun,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useMediaQuery } from "@/hooks/use-media-query"
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { signOut } from "@/lib/actions"
import { motion } from "framer-motion"

interface SidebarProps {
    user?: any;
    children?: React.ReactNode;
    className?: string;
    isOpen?: boolean;
    onCollapseChange?: (collapsed: boolean) => void;
}

const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, href: '/' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquareIcon, href: '/tasks' },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, href: '/calendar' },
];

const viewsNavItems = [
    { id: 'list', label: 'List View', icon: ListIcon, href: '/tasks/list' },
    { id: 'board', label: 'Board View', icon: KanbanIcon, href: '/tasks/board' },
    { id: 'gantt', label: 'Gantt View', icon: GanttChartIcon, href: '/tasks/gantt' },
    { id: 'table', label: 'Table View', icon: TableIcon, href: '/tasks/table' },
];

const projectsNavItems = [
    { id: 'projects', label: 'All Projects', icon: FolderIcon, href: '/projects' },
    { id: 'favorites', label: 'Favorites', icon: StarIcon, href: '/projects/favorites' },
];

const teamNavItems = [
    { id: 'teams', label: 'Teams', icon: Users2Icon, href: '/teams' },
    { id: 'analytics', label: 'Analytics', icon: BarChartIcon, href: '/analytics' },
];

const toolsNavItems = [
    { id: 'timer', label: 'Time Tracking', icon: TimerIcon, href: '/tools/timer' },
    { id: 'tags', label: 'Tags', icon: TagIcon, href: '/tools/tags' },
    { id: 'filters', label: 'Filters', icon: FilterIcon, href: '/tools/filters' },
    { id: 'ai', label: 'AI Assistant', icon: BrainIcon, href: '/tools/ai' },
];

export function Sidebar({ user, className, isOpen, onCollapseChange }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [notifications, setNotifications] = React.useState(3)
    const pathname = usePathname()
    const router = useRouter()
    const isDesktop = useMediaQuery("(min-width: 768px)")

    // Handle sidebar state based on screen size
    React.useEffect(() => {
        if (isDesktop) {
            if (!isOpen && !isDesktop) {
                setIsCollapsed(false)
            }
        }
    }, [isDesktop, isOpen])

    // Notify parent component when collapse state changes
    React.useEffect(() => {
        if (onCollapseChange) {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/signin');
            toast.success('Successfully signed out');
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Failed to sign out');
        }
    };

    const NavSection = React.memo(({ title, items, isCollapsed }: { title: string, items: any[], isCollapsed: boolean }) => (
        <div className="px-2 py-1">
            {!isCollapsed && title && (
                <h3 className="mb-3 px-2 text-xs font-semibold text-muted-foreground">
                    {title}
                </h3>
            )}
            <nav className="space-y-2">
                {items.map((item) => (
                    <NavItem key={item.id} item={item} isCollapsed={isCollapsed} />
                ))}
            </nav>
        </div>
    ));
    NavSection.displayName = 'NavSection';

    const NavItem = React.memo(({ item, isCollapsed }: { item: any, isCollapsed: boolean }) => {
        const isActive = pathname === item.href;
        
        return (
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={item.href}>
                            <Button 
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start",
                                    isCollapsed && "justify-center",
                                    "h-10",
                                    isActive && "nav-item font-medium"
                                )}
                                size={isCollapsed ? "icon" : "sm"}
                                data-active={isActive}
                            >
                                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                                {!isCollapsed && item.label}
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                        <TooltipContent side="right">
                            {item.label}
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
    });
    NavItem.displayName = 'NavItem';

    return (
        <motion.div
            className={cn(
                "fixed left-0 top-14 bottom-0 z-30 flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm",
                className
            )}
            initial={false}
            animate={{
                width: isCollapsed ? 64 : 256,
                transition: { duration: 0.2, ease: "easeInOut" }
            }}
        >
            <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30">
                    <div className="space-y-4 p-3 pt-4 pb-16">
                        <NavSection title="MAIN" items={mainNavItems} isCollapsed={isCollapsed} />
                        <NavSection title="VIEWS" items={viewsNavItems} isCollapsed={isCollapsed} />
                        <NavSection title="PROJECTS" items={projectsNavItems} isCollapsed={isCollapsed} />
                        <NavSection title="TEAM" items={teamNavItems} isCollapsed={isCollapsed} />
                        <NavSection title="TOOLS" items={toolsNavItems} isCollapsed={isCollapsed} />
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-3 top-3 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-primary/10"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>
        </motion.div>
    )
}

export function SidebarSection({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("pb-4", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export function SidebarHeader({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("px-4 py-2", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export function SidebarContent({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex flex-1 flex-col gap-2 px-4", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export function SidebarFooter({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("mt-auto", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export function SidebarItem({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function SidebarGroup({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex flex-col gap-2", className)}
            {...props}
        >
            {children}
        </div>
    )
}

export function SidebarSeparator({
    className,
    ...props
}: React.HTMLAttributes<HTMLHRElement>) {
    return (
        <hr
            className={cn("my-2 border-border", className)}
            {...props}
        />
    )
}

export function SidebarTrigger({
    className,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("sidebar-toggle", className)}
            {...props}
        >
            <ChevronRightIcon className="h-4 w-4" />
        </Button>
    )
}

export function SidebarInput({
    className,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    )
}
