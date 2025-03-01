'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { IconAlertCircle, IconCheck, IconClock, IconFlag } from '@tabler/icons-react'

interface DashboardStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  highPriority: number
}

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0

  const inProgressRate = stats.total > 0 
    ? Math.round((stats.inProgress / stats.total) * 100) 
    : 0

  const overdueRate = stats.total > 0 
    ? Math.round((stats.overdue / stats.total) * 100) 
    : 0

  const highPriorityRate = stats.total > 0 
    ? Math.round((stats.highPriority / stats.total) * 100) 
    : 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Complete</CardTitle>
          <IconCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {completionRate}% of total tasks
          </p>
          <Progress value={completionRate} className="mt-3 h-2" />
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <IconClock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {inProgressRate}% of total tasks
          </p>
          <Progress value={inProgressRate} className="mt-3 h-2" />
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <IconAlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.overdue}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {overdueRate}% of total tasks
          </p>
          <Progress value={overdueRate} className="mt-3 h-2" />
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <IconFlag className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.highPriority}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {highPriorityRate}% of total tasks
          </p>
          <Progress value={highPriorityRate} className="mt-3 h-2" />
        </CardContent>
      </Card>
    </div>
  )
} 