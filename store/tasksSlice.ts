import { StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase-browser'
import type { Task } from '@/lib/types'

export interface TasksSlice {
  tasks: Task[]
  isLoading: boolean
  fetchTasks: () => Promise<void>
  addTask: (task: Partial<Task>) => Promise<Task | null>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>
  deleteTask: (taskId: string) => Promise<void>
  getTaskById: (id: string) => Task | undefined
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
}

export const createTasksSlice: StateCreator<TasksSlice> = (set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ tasks: data ?? [] })
    } catch (error) {
      console.error('Failed to load tasks', error)
    } finally {
      set({ isLoading: false })
    }
  },

  addTask: async (task) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()

      if (error) throw error
      set((state) => ({ tasks: data ? [data, ...state.tasks] : state.tasks }))
      return data as Task
    } catch (error) {
      console.error('Failed to add task', error)
      return null
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
      }))
      return data as Task
    } catch (error) {
      console.error('Failed to update task', error)
      return null
    }
  },

  deleteTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }))
    } catch (error) {
      console.error('Failed to delete task', error)
    }
  },

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  setTasks: (tasks) =>
    set((state) => ({
      tasks: typeof tasks === 'function' ? tasks(state.tasks) : tasks,
    })),
})

export type { Task }
