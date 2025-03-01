import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarItemProps {
  icon: React.ReactNode
  title: string
  href: string
  collapsed?: boolean
  isActive?: boolean
  onClick?: () => void
}

export function SidebarItem({
  icon,
  title,
  href,
  collapsed,
  isActive,
  onClick
}: SidebarItemProps) {
  const pathname = usePathname()
  const active = isActive ?? pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      {!collapsed && <span>{title}</span>}
    </Link>
  )
} 