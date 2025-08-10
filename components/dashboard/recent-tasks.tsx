'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { Task } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import { useStore } from '@/store'

interface RecentTasksProps {
  user: User
}

export function RecentTasks({ user }: RecentTasksProps) {
  const { tasks, fetchTasks, addTask } = useStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleCreateTask = async (task: Partial<Task>): Promise<Task> => {
    const created = await addTask({ ...task, user_id: user.id })
    return created as Task
  }

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Tasks</CardTitle>
        <CreateTaskButton onCreateTask={handleCreateTask} />
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{task.title}</p>
                    {task.due_date && (
                      <p className="text-sm text-muted-foreground">
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
