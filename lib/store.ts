import { create } from 'zustand'
import { supabase } from './supabase'
import { Task, TaskType, ProjectType, Template, Team, UserProfile } from './types'
import { toast } from 'sonner'

interface TaskStore {
  // State
  tasks: TaskType[]
  projects: ProjectType[]
  templates: Template[]
  teams: Team[]
  currentTeam: Team | null
  editingTask: TaskType | null
  activeTimer: string | null
  activeTask: TaskType | null
  isPomodoro: boolean
  pomodoroTime: number
  selectedProject: string | null
  aiSuggestion: string
  
  // Actions
  setTasks: (tasks: TaskType[]) => void
  setProjects: (projects: ProjectType[]) => void
  setTemplates: (templates: Template[]) => void
  setTeams: (teams: Team[]) => void
  setCurrentTeam: (team: Team | null) => void
  setEditingTask: (task: TaskType | null) => void
  setActiveTimer: (taskId: string | null) => void
  setActiveTask: (task: TaskType | null) => void
  setIsPomodoro: (isPomodoro: boolean) => void
  setPomodoroTime: (time: number) => void
  setSelectedProject: (projectId: string | null) => void
  setAiSuggestion: (suggestion: string) => void

  // API Actions
  fetchTasks: () => Promise<void>
  fetchProjects: () => Promise<void>
  fetchTemplates: () => Promise<void>
  addTask: (task: Partial<Task>) => Promise<void>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  toggleTaskStatus: (taskId: string) => Promise<void>
  addProject: (name: string, color: string, description: string) => Promise<void>
  updateProject: (id: string, name: string, color: string, description: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addTemplate: (name: string, tasks: Omit<TaskType, 'id' | 'time_tracked'>[]) => Promise<void>
  applyTemplate: (templateId: string) => Promise<void>
  generateSubtasks: (taskId: string) => Promise<void>
  getAISuggestions: () => Promise<void>
  applyAISuggestion: () => void
}

export const useStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  projects: [],
  templates: [],
  teams: [],
  currentTeam: null,
  editingTask: null,
  activeTimer: null,
  activeTask: null,
  isPomodoro: false,
  pomodoroTime: 25 * 60,
  selectedProject: null,
  aiSuggestion: '',

  // State setters
  setTasks: (tasks) => set({ tasks }),
  setProjects: (projects) => set({ projects }),
  setTemplates: (templates) => set({ templates }),
  setTeams: (teams) => set({ teams }),
  setCurrentTeam: (team) => set({ currentTeam: team }),
  setEditingTask: (task) => set({ editingTask: task }),
  setActiveTimer: (taskId) => set({ activeTimer: taskId }),
  setActiveTask: (task) => set({ activeTask: task }),
  setIsPomodoro: (isPomodoro) => set({ isPomodoro }),
  setPomodoroTime: (time) => set({ pomodoroTime: time }),
  setSelectedProject: (projectId) => set({ selectedProject: projectId }),
  setAiSuggestion: (suggestion) => set({ aiSuggestion: suggestion }),

  // API Actions
  fetchTasks: async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error

      const tasksWithSubtasks = data.map(task => ({
        ...task,
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
      }))

      set({ tasks: tasksWithSubtasks })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to fetch tasks')
    }
  },

  fetchProjects: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      set({ projects: data })
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to fetch projects')
    }
  },

  fetchTemplates: async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      set({ templates: data })
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch templates')
    }
  },

  addTask: async (task: Partial<Task>) => {
    try {
      const now = new Date().toISOString()
      const newTask = {
        ...task,
        created_at: now,
        updated_at: now,
        time_tracked: 0,
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single()

      if (error) throw error

      const { tasks } = get()
      set({ tasks: [...tasks, data] })
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to create task')
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error

      const { tasks } = get()
      set({ 
        tasks: tasks.map(task => 
          task.id.toString() === taskId ? { ...task, ...updates } as TaskType : task
        )
      })
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      const { tasks } = get()
      set({ tasks: tasks.filter(task => task.id.toString() !== taskId) })
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  },

  toggleTaskStatus: async (taskId: string) => {
    const { tasks } = get()
    const task = tasks.find(t => t.id.toString() === taskId)
    if (!task) return

    const newStatus = task.status === 'Complete' ? 'To Do' : 'Complete'
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      set({ 
        tasks: tasks.map(t => 
          t.id.toString() === taskId ? { ...t, status: newStatus } : t
        )
      })
      toast.success(`Task marked as ${newStatus}`)
    } catch (error) {
      console.error('Error toggling task status:', error)
      toast.error('Failed to update task status')
    }
  },

  addProject: async (name: string, color: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, color, description }])
        .select()
        .single()

      if (error) throw error

      const { projects } = get()
      set({ projects: [...projects, data] })
      toast.success('Project created successfully')
    } catch (error) {
      console.error('Error adding project:', error)
      toast.error('Failed to create project')
    }
  },

  updateProject: async (id: string, name: string, color: string, description: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          name, 
          color, 
          description,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) throw error

      const { projects } = get()
      set({ 
        projects: projects.map(p => 
          p.id.toString() === id ? { ...p, name, color, description } : p
        )
      })
      toast.success('Project updated successfully')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    }
  },

  deleteProject: async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { projects } = get()
      set({ projects: projects.filter(p => p.id.toString() !== id) })
      toast.success('Project deleted successfully')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  },

  addTemplate: async (name: string, tasks: Omit<TaskType, 'id' | 'time_tracked'>[]) => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert([{ name, tasks }])
        .select()
        .single()

      if (error) throw error

      const { templates } = get()
      set({ templates: [...templates, data] })
      toast.success('Template created successfully')
    } catch (error) {
      console.error('Error adding template:', error)
      toast.error('Failed to create template')
    }
  },

  applyTemplate: async (templateId: string) => {
    const { templates, fetchTasks } = get()
    const template = templates.find(t => t.id.toString() === templateId)
    if (!template) return

    try {
      const newTasks = template.tasks.map(task => ({
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        time_tracked: 0
      }))

      const { error } = await supabase
        .from('tasks')
        .insert(newTasks)

      if (error) throw error

      await fetchTasks()
      toast.success('Template applied successfully')
    } catch (error) {
      console.error('Error applying template:', error)
      toast.error('Failed to apply template')
    }
  },

  generateSubtasks: async (taskId: string) => {
    const { tasks, updateTask } = get()
    const task = tasks.find(t => t.id.toString() === taskId)
    if (!task) return

    try {
      const response = await fetch('/api/taskBreakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskDescription: task.title }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      await updateTask(taskId, { subtasks: data.subtasks })
      toast.success('Subtasks generated successfully')
    } catch (error) {
      console.error('Error generating subtasks:', error)
      toast.error('Failed to generate subtasks')
    }
  },

  getAISuggestions: async () => {
    const { tasks } = get()
    try {
      const response = await fetch('/api/aiSuggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      set({ aiSuggestion: data.suggestion })
    } catch (error) {
      console.error('Error getting AI suggestion:', error)
      toast.error('Failed to get AI suggestion')
    }
  },

  applyAISuggestion: () => {
    set({ aiSuggestion: '' })
    toast.success('AI suggestion applied')
  }
})) 