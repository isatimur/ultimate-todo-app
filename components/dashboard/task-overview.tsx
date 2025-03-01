'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Task } from '@/lib/types'

interface TaskOverviewProps {
  tasks: Task[]
}

export function TaskOverview({ tasks }: TaskOverviewProps) {
  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    const status = task.status || 'To Do'
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Task Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{status}</span>
                <span className="text-sm text-muted-foreground">
                  {statusTasks.length} tasks
                </span>
              </div>
              <Progress 
                value={tasks.length > 0 ? (statusTasks.length / tasks.length) * 100 : 0} 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 