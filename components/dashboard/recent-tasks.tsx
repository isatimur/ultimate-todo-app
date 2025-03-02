'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { Task } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'

interface RecentTasksProps {
  initialTasks: Task[]
  user: User
}

export function RecentTasks({ initialTasks, user }: RecentTasksProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new as Task, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id ? payload.new as Task : task
          ))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const handleCreateTask = async (task: Partial<Task>): Promise<Task> => {
    try {
      // Add user_id to the task
      const taskWithUserId = {
        ...task,
        user_id: user.id,
        status: task.status || 'To Do',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskWithUserId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });

      return data as Task;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

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
                    <p className="text-sm text-muted-foreground">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </p>
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