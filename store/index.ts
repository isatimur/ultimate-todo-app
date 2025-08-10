import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase-browser'
import type { ProjectType } from '@/lib/types'
import { createTasksSlice, TasksSlice } from './tasksSlice'

interface ProjectsSlice {
  projects: ProjectType[]
  fetchProjects: () => Promise<void>
  setProjects: (projects: ProjectType[] | ((prev: ProjectType[]) => ProjectType[])) => void
}

interface UiSlice {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export type RootState = TasksSlice & ProjectsSlice & UiSlice

export const useStore = create<RootState>()(
  persist(
    (set, get, api) => ({
      ...createTasksSlice(set as any, get as any, api as any),
      projects: [],
      fetchProjects: async () => {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) throw error
          set({ projects: data ?? [] })
        } catch (error) {
          console.error('Failed to load projects', error)
        }
      },
      setProjects: (projects) =>
        set((state) => ({
          projects: typeof projects === 'function' ? projects(state.projects) : projects,
        })),
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'root-store' }
  )
)
