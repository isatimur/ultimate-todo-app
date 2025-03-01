"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Star, 
  Clock, 
  Users, 
  MoreVertical, 
  Pencil, 
  Trash2,
  FolderOpen,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Skeleton } from "./ui/skeleton"
import { CreateProjectDialog } from "./create-project-dialog"
import { toast } from "sonner"
import { Tables } from '@/lib/database.types'

type Project = Tables<'projects'> & {
  tasks?: { count: number }[]
  tasksCount?: number
  completedTasksCount?: number
  progress?: number
}

interface ProjectsViewProps {
  userId: string
  initialProjects: Project[]
}

export function ProjectsView({ userId, initialProjects }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Subscribe to project changes
    const channel = supabase
      .channel('projects')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          // Fetch the new project with tasks count
          const { data: newProject } = await supabase
            .from('projects')
            .select(`
              *,
              tasks:tasks(count)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newProject) {
            const transformedProject = {
              ...newProject,
              tasksCount: newProject.tasks?.[0]?.count || 0
            }
            setProjects(prev => [transformedProject, ...prev])
          }
        } else if (payload.eventType === 'UPDATE') {
          // Fetch the updated project with tasks count
          const { data: updatedProject } = await supabase
            .from('projects')
            .select(`
              *,
              tasks:tasks(count)
            `)
            .eq('id', payload.new.id)
            .single()

          if (updatedProject) {
            const transformedProject = {
              ...updatedProject,
              tasksCount: updatedProject.tasks?.[0]?.count || 0
            }
            setProjects(prev =>
              prev.map(p => p.id === payload.new.id ? transformedProject : p)
            )
          }
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev =>
            prev.filter(p => p.id !== payload.old.id)
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select()

      if (error) throw error

      toast.success('Project deleted successfully')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [projects, searchQuery])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? 'No projects match your search' : 'No projects yet. Create your first project to get started!'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className="group">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle 
                        className="text-lg hover:text-primary cursor-pointer" 
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
                          <FolderOpen className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{project.tasksCount || 0} tasks</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        userId={userId}
      />
    </div>
  )
} 