import { cn } from '@/lib/utils'

/**
 * Props for the VersionIndicator component
 * @interface VersionIndicatorProps
 */
interface VersionIndicatorProps {
  /** Optional className for styling customization */
  className?: string
}

/**
 * VersionIndicator Component
 * 
 * A minimal component that displays the application version and codename.
 * Designed to be non-intrusive while providing important version information.
 * 
 * Features:
 * - Displays app codename
 * - Shows semantic version number
 * - Semi-transparent background
 * - Blur effect for modern look
 * - Responsive design
 * 
 * Version Format: v[MAJOR].[MINOR].[PATCH]
 * - MAJOR: Breaking changes
 * - MINOR: New features
 * - PATCH: Bug fixes
 * 
 * @component
 * @param {VersionIndicatorProps} props - Component props
 * @returns {JSX.Element} Rendered version indicator
 */
export function VersionIndicator({ className }: VersionIndicatorProps) {
  /** Current version number following semantic versioning */
  const version = 'v2.2.0'
  /** Application codename */
  const codename = 'Ultima'

  return (
    <div className={cn(
      "flex items-center justify-center py-2 px-3",
      "text-xs font-medium text-muted-foreground/60",
      "border-t bg-background/50 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center gap-1.5">
        <span className="text-primary/40">{codename}</span>
        <span className="h-3 w-px bg-muted-foreground/20" />
        <span className="font-mono">{version}</span>
      </div>
    </div>
  )
} 