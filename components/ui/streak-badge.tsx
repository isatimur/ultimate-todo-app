import { motion } from 'framer-motion'
import { Badge } from './badge'

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const milestone = streak > 0 && streak % 5 === 0
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-block"
      data-testid="streak-badge-wrapper"
    >
      <Badge variant={milestone ? 'success' : 'secondary'} data-testid="streak-badge">
        {streak} day streak{milestone ? ' 🎉' : ''}
      </Badge>
    </motion.div>
  )
}

export default StreakBadge
