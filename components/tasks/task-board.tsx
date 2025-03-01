'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/lib/types'
import { TaskCard } from './task-card'
import { CreateTaskButton } from './create-task-button'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TaskBoardProps {
  initialTasks: Task[]
  userId: string
}

type Column = {
  id: string
  title: string
  status: Task['status']
}

const columns: Column[] = [
  { id: 'todo', title: 'To Do', status: 'To Do' },
  { id: 'in-progress', title: 'In Progress', status: 'In Progress' },
  { id: 'in-review', title: 'In Review', status: 'In Review' },
  { id: 'complete', title: 'Complete', status: 'Complete' }
]

export function TaskBoard({ initialTasks, userId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Refresh tasks from the server
  const refreshTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const transformedTasks = data.map(task => ({
          ...task,
          project_details: task.project
        }))
        setTasks(transformedTasks)
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error)
      toast.error('Failed to refresh tasks')
    }
  }

  useEffect(() => {
    // Initial tasks setup
    setTasks(initialTasks)

    // Subscribe to real-time changes
    const channel = supabase
      .channel('tasks-board')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        console.log('Real-time update received:', payload)

        try {
          if (payload.eventType === 'INSERT') {
            // Fetch the complete task data including project details
            const { data: newTask, error } = await supabase
              .from('tasks')
              .select(`
                *,
                project:projects(*)
              `)
              .eq('id', payload.new.id)
              .single()

            if (error) throw error

            if (newTask) {
              setTasks(prev => [{
                ...newTask,
                project_details: newTask.project
              }, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            // Fetch the updated task with project details
            const { data: updatedTask, error } = await supabase
              .from('tasks')
              .select(`
                *,
                project:projects(*)
              `)
              .eq('id', payload.new.id)
              .single()

            if (error) throw error

            if (updatedTask) {
              setTasks(prev => prev.map(task => 
                task.id === payload.new.id 
                  ? { ...updatedTask, project_details: updatedTask.project }
                  : task
              ))
            }
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id))
          }
        } catch (error) {
          console.error('Error handling real-time update:', error)
          // If there's an error handling the update, refresh all tasks
          await refreshTasks()
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to real-time updates')
          toast.error('Real-time updates unavailable')
        }
      })

    return () => {
      console.log('Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, initialTasks])

  const handleCreateTask = async (task: Partial<Task>) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          ...task, 
          user_id: userId,
          status: task.status || 'To Do',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          project:projects(*)
        `)
        .single()

      if (error) throw error

      if (data) {
        // Immediately update the local state
        const newTask = {
          ...data,
          project_details: data.project
        }
        setTasks(prev => [newTask, ...prev])
        toast.success('Task created successfully')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
      // Refresh tasks in case of error
      await refreshTasks()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Immediately update local state
      setTasks(prev => prev.filter(task => task.id !== taskId))
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
      // Refresh tasks in case of error
      await refreshTasks()
    }
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Add filters here if needed */}
        </div>
        <CreateTaskButton onCreateTask={handleCreateTask} disabled={isLoading} />
      </div>

      <div className="h-[calc(100%-3rem)] flex gap-4 overflow-x-auto">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-1 min-w-[300px] bg-muted/10 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{column.title}</h3>
              <span className="text-sm text-muted-foreground">
                {tasks.filter(t => t.status === column.status).length}
              </span>
            </div>

            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-4 pr-4">
                {tasks
                  .filter(task => task.status === column.status)
                  .map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task}
                      onDelete={handleDeleteTask}
                    />
                  ))
                }
                {tasks.filter(t => t.status === column.status).length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  )
} 