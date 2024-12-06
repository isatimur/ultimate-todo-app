import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task } from '@/lib/types'

interface TaskStatisticsProps {
  tasks: Task[]
}

export function TaskStatistics({ tasks }: TaskStatisticsProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.completed).length
  const highPriorityTasks = tasks.filter(task => task.priority === 'High').length
  const averageProgress = tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{highPriorityTasks}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageProgress.toFixed(0)}%</div>
        </CardContent>
      </Card>
    </div>
  )
}

