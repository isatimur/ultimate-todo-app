'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { CalendarView } from '@/components/calendar-view'
import { Task, Project } from '@/lib/types'
import { toast } from 'sonner'

export function CalendarPageClient() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          redirect('/signin')
        }

        // Fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError
        console.log('Fetched tasks:', tasksData)
        setTasks(tasksData)

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)

        if (projectsError) throw projectsError
        setProjects(projectsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription for tasks
    const tasksSubscription = supabase
      .channel('tasks')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? { ...task, ...payload.new } : task
            ))
          }
        }
      )
      .subscribe()

    return () => {
      tasksSubscription.unsubscribe()
    }
  }, [supabase])

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleTaskDelete = async (taskId: string) => {
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
    }
  }

  const handleAddTask = async (task: Partial<Task>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      if (!task.title) {
        throw new Error('Task title is required')
      }

      // Only include fields that exist in the database
      const newTask = {
        title: task.title,
        description: task.description || '',
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        due_date: task.due_date || new Date().toISOString().split('T')[0],
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: task.project_id,
        time_tracked: task.time_tracked || 0,
        start_time: task.start_time,
        end_time: task.end_time,
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single()

      if (error) throw error
      console.log('Created task:', data)
      toast.success('Task added successfully')
      return data
    } catch (error) {
      console.error('Error adding task:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add task')
      }
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
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