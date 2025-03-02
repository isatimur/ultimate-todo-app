'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { CalendarView } from '@/components/calendar-view'
import { Task, Project } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Client component for the Calendar page that handles task management operations
 * and real-time data synchronization with Supabase.
 * 
 * Responsible for:
 * - Fetching and managing tasks and projects data
 * - Handling task CRUD operations
 * - Setting up real-time subscriptions for data updates
 * - Rendering the CalendarView component with appropriate props
 */
export function CalendarPageClient() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    /**
     * Fetches initial tasks and projects data from Supabase.
     * Redirects to signin page if user is not authenticated.
     * Sets up real-time subscriptions for task updates.
     */
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

  /**
   * Updates an existing task in the database and local state.
   * 
   * @param {string} taskId - The ID of the task to update
   * @param {Partial<Task>} updates - Object containing the fields to update
   * @returns {Promise<void>} - Promise that resolves when the update is complete
   * 
   * @example
   * // Update a task's status
   * handleTaskUpdate("task-123", { status: "Complete", updated_at: new Date().toISOString() });
   */
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Add updated_at timestamp
      const updatedTask = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Ensure taskId is a string
      const id = String(taskId);
      
      const { error } = await supabase
        .from('tasks')
        .update(updatedTask)
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, ...updatedTask } : task
      ));
      
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  }

  /**
   * Deletes a task from the database and removes it from local state.
   * 
   * @param {string} taskId - The ID of the task to delete
   * @returns {Promise<void>} - Promise that resolves when the deletion is complete
   * 
   * @example
   * // Delete a task
   * handleTaskDelete("task-123");
   */
  const handleTaskDelete = async (taskId: string) => {
    try {
      // Ensure taskId is a string
      const id = String(taskId);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setTasks(tasks.filter(task => task.id !== id));
      
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  }

  /**
   * Creates a new task in the database and adds it to local state.
   * Validates required fields and handles user authentication.
   * 
   * @param {Partial<Task>} task - The task data to create
   * @returns {Promise<Task>} - Promise that resolves to the created task data
   * @throws {Error} - If validation fails or database operation fails
   * 
   * @example
   * // Create a new task
   * handleAddTask({
   *   title: "Complete project",
   *   description: "Finish the project documentation",
   *   status: "To Do",
   *   priority: "High"
   * });
   */
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

      if (error) throw error;
      
      // Update local state
      setTasks([...tasks, data]);
      
      console.log('Created task:', data);
      toast.success('Task added successfully');
      return data;
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