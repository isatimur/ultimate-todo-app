'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task, UserProfile, Project } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { TaskList } from '@/components/tasks/task-list'
import { CreateTaskButton } from '@/components/tasks/create-task-button'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, CheckCircle, Clock, ListTodo } from 'lucide-react'

interface DashboardStats {
  total: number
  completed: number
  inProgress: number
  pending: number
}

interface DashboardViewProps {
  initialTasks: Task[]
  initialProjects: Project[]
  stats: DashboardStats
  user: UserProfile
}

export function DashboardView({ initialTasks, initialProjects, stats, user }: DashboardViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [projects, setProjects] = useState<Project[]>(initialProjects || [])
  const { toast } = useToast()

  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new as Task, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id ? payload.new as Task : task
          ))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  // Also listen for project changes
  useEffect(() => {
    const channel = supabase
      .channel('projects')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProjects(prev => [payload.new as Project, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(project => 
            project.id === payload.new.id ? payload.new as Project : project
          ))
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(project => project.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const handleCreateTask = async (task: Partial<Task>): Promise<Task> => {
    try {
      // Add user_id to the task
      const taskWithUserId = {
        ...task,
        user_id: user.id,
        status: task.status || 'To Do',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskWithUserId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });

      return data as Task;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Tasks</CardTitle>
          <CreateTaskButton onCreateTask={handleCreateTask} />
        </CardHeader>
        <CardContent>
          <TaskList initialTasks={tasks} userId={user.id} projects={projects} />
        </CardContent>
      </Card>
    </div>
  )
} 