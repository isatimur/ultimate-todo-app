import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { CalendarView } from './CalendarView'

export function UltimateTodoAppComponent({ user, initialView = 'list' }: UltimateTodoAppComponentProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<'list' | 'board' | 'calendar'>(initialView)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const { data: tasksData, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setTasks(tasksData || [])
      } catch (err) {
        console.error('Error fetching tasks:', err)
        setError('Failed to load tasks')
        toast.error('Failed to load tasks')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      )
      toast.success('Task updated successfully')
    } catch (err) {
      console.error('Error updating task:', err)
      toast.error('Failed to update task')
    }
  }

  const handleTaskDelete = async (taskId: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
      toast.success('Task deleted successfully')
    } catch (err) {
      console.error('Error deleting task:', err)
      toast.error('Failed to delete task')
    }
  }

  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single()

      if (error) throw error

      setTasks(prevTasks => [data, ...prevTasks])
      toast.success('Task added successfully')
    } catch (err) {
      console.error('Error adding task:', err)
      toast.error('Failed to add task')
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full">Loading...</div>
    }

    if (error) {
      return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
    }

    switch (view) {
      case 'calendar':
        return (
          <CalendarView
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onAddTask={handleAddTask}
          />
        )
      // ... existing code for other views ...
    }
  }

  // ... existing code ...
} 