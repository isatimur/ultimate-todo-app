'use client'

import { useState, useEffect } from 'react'
import { Task, Project, TaskStatus, TaskPriority } from '@/lib/types'
import { TaskCard } from './task-card'
import { TaskFilters } from './task-filters'
import { TaskSort } from './task-sort'
import { CreateTaskButton } from './create-task-button'
import { VoiceTaskSidebar } from '@/components/voice-task-sidebar'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'

interface TaskListProps {
  initialTasks: Task[]
  userId: string
  projects: Project[]
}

export function TaskList({ initialTasks, userId, projects }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks)
  const [filters, setFilters] = useState({
    status: [] as TaskStatus[],
    priority: [] as TaskPriority[],
    search: ''
  })
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc' as 'asc' | 'desc'
  })
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((current) => [...current, payload.new as Task])
          } else if (payload.eventType === 'UPDATE') {
            setTasks((current) =>
              current.map((task) =>
                task.id === payload.new.id ? { ...task, ...payload.new } : task
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTasks((current) =>
              current.filter((task) => task.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    let result = [...tasks]

    // Apply filters
    if (filters.status.length > 0) {
      result = result.filter((task) => filters.status.includes(task.status))
    }
    if (filters.priority.length > 0) {
      result = result.filter((task) => filters.priority.includes(task.priority))
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Task]
      const bValue = b[sortConfig.key as keyof Task]

      if (!aValue || !bValue) return 0

      const comparison =
        typeof aValue === 'string'
          ? aValue.localeCompare(bValue as string)
          : (aValue as number) - (bValue as number)

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    setFilteredTasks(result)
  }, [tasks, filters, sortConfig])

  const handleCreateTask = async (task: Partial<Task>) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: userId }])
        .select()
        .single()

      if (error) throw error

      toast.success('Task created successfully')
      return data
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/50 p-4 rounded-lg border shadow-sm">
          <TaskFilters filters={filters} onFiltersChange={setFilters} />
          <div className="flex items-center gap-3">
            <TaskSort sortConfig={sortConfig} onSortChange={setSortConfig} />
            <CreateTaskButton
              onCreateTask={handleCreateTask}
              projects={projects}
              disabled={isLoading}
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
          </div>
        )}

        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                onDelete={handleDeleteTask}
              />
            ))
          ) : (
            <div className="text-center bg-card/50 rounded-lg border p-8 shadow-sm">
              <div className="text-muted-foreground mb-2">No tasks match your filters</div>
              <CreateTaskButton
                onCreateTask={handleCreateTask}
                projects={projects}
                disabled={isLoading}
                variant="outline"
                className="mt-2"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Voice Task Sidebar */}
      <VoiceTaskSidebar onAddTask={handleCreateTask} />
    </>
  )
} 