'use client'

import { useEffect } from 'react'
import { CalendarView } from '@/components/calendar-view'
import { useStore } from '@/store'
import type { Task } from '@/lib/types'
import { toast } from 'sonner'

export function CalendarPageClient() {
  const {
    tasks,
    projects,
    isLoading,
    fetchTasks,
    fetchProjects,
    addTask,
    updateTask,
    deleteTask,
  } = useStore()

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchTasks(), fetchProjects()])
    }
    load()
  }, [fetchTasks, fetchProjects])

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    const updated = await updateTask(taskId, updates)
    if (!updated) toast.error('Failed to update task')
  }

  const handleTaskDelete = async (taskId: string) => {

    try {
      await deleteTask(taskId)
    } catch {
      toast.error('Failed to delete task')
    }

  };

  const handleAddTask = async (task: Partial<Task>) => {
    const created = await addTask(task)
    if (!created) toast.error('Failed to create task')
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <CalendarView
      tasks={tasks}
      projects={projects}
      onTaskUpdate={handleTaskUpdate}
      onTaskDelete={handleTaskDelete}
      onAddTask={handleAddTask}
    />
  )
}
