"use client"

import { Task, Project } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import { StatsCards } from './dashboard/stats-cards'
import { TaskOverview } from './dashboard/task-overview'
import { RecentTasks } from './dashboard/recent-tasks'
import { ProjectProgress } from './dashboard/project-progress'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { format, isAfter, isBefore, startOfDay, endOfDay, addDays } from 'date-fns'
import { IconAlertCircle, IconCalendar, IconCheck, IconClock, IconFlag, IconPlus } from '@tabler/icons-react'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { enUS } from 'date-fns/locale'

interface DashboardStats {
  total: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
  highPriority: number
}

interface DashboardViewProps {
  initialTasks: Task[]
  initialProjects: Project[]
  stats: DashboardStats
  user: User
}

export function DashboardView({ 
  initialTasks,
  initialProjects,
  stats,
  user
}: DashboardViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [currentStats, setCurrentStats] = useState<DashboardStats>(stats)
  const [selectedView, setSelectedView] = useState<'overview' | 'tasks' | 'projects'>('overview')

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Tasks change received:', payload)
          
          // Fetch updated tasks
          const { data: updatedTasks } = await supabase
            .from('tasks')
            .select(`
              *,
              project:projects(*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (updatedTasks) {
            const transformedTasks = updatedTasks.map(task => ({
              ...task,
              project_details: task.project
            })) as Task[]
            
            setTasks(transformedTasks)
            
            // Update stats
            const now = new Date()
            setCurrentStats({
              total: transformedTasks.length,
              completed: transformedTasks.filter(t => t.status === 'Complete').length,
              inProgress: transformedTasks.filter(t => t.status === 'In Progress').length,
              pending: transformedTasks.filter(t => t.status === 'To Do' && (!t.due_date || isAfter(new Date(t.due_date), now))).length,
              overdue: transformedTasks.filter(t => t.status !== 'Complete' && t.due_date && isBefore(new Date(t.due_date), now)).length,
              highPriority: transformedTasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').length
            })
          }
        }
      )
      .subscribe()

    return () => {
      tasksSubscription.unsubscribe()
    }
  }, [user.id])

  // Get tasks due today
  const today = startOfDay(new Date())
  const tomorrow = endOfDay(new Date())
  const tasksToday = tasks.filter(task => 
    task.due_date && 
    isAfter(new Date(task.due_date), today) && 
    isBefore(new Date(task.due_date), tomorrow)
  )

  // Get overdue tasks
  const overdueTasks = tasks.filter(task => 
    task.status !== 'Complete' && 
    task.due_date && 
    isBefore(new Date(task.due_date), today)
  )

  // Get high priority tasks
  const highPriorityTasks = tasks.filter(task =>
    task.status !== 'Complete' &&
    (task.priority === 'High' || task.priority === 'Urgent')
  )

  if (!tasks.length && !projects.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h3 className="text-2xl font-semibold text-foreground">Welcome to Your Dashboard</h3>
        <p className="text-muted-foreground">Create your first task to get started</p>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <StatsCards stats={currentStats} />

      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as typeof selectedView)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Due Today */}
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <IconCalendar className="mr-2 h-5 w-5 text-blue-500" />
                  Due Today
                </CardTitle>
                <CardDescription>Tasks that need attention today</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px] pr-4">
                  {tasksToday.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={task.status === 'Complete' ? 'default' : 'secondary'}>
                          {task.due_date && format(new Date(task.due_date), 'HH:mm', { locale: enUS })}
                        </Badge>
                        <span className="text-sm">{task.title}</span>
                      </div>
                      <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                    </div>
                  ))}
                  {!tasksToday.length && (
                    <p className="text-sm text-muted-foreground">No tasks due today</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <IconAlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  Overdue
                </CardTitle>
                <CardDescription>Tasks past their due date</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px] pr-4">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">
                          {task.due_date && format(new Date(task.due_date), 'MMM dd', { locale: enUS })}
                        </Badge>
                        <span className="text-sm">{task.title}</span>
                      </div>
                      <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                    </div>
                  ))}
                  {!overdueTasks.length && (
                    <p className="text-sm text-muted-foreground">No overdue tasks</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* High Priority */}
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <IconFlag className="mr-2 h-5 w-5 text-yellow-500" />
                  High Priority
                </CardTitle>
                <CardDescription>Tasks that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px] pr-4">
                  {highPriorityTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={task.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                          {task.priority}
                        </Badge>
                        <span className="text-sm">{task.title}</span>
                      </div>
                      {task.due_date && (
                        <Badge variant="outline">
                          {format(new Date(task.due_date), 'MMM dd', { locale: enUS })}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {!highPriorityTasks.length && (
                    <p className="text-sm text-muted-foreground">No high priority tasks</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <TaskOverview tasks={tasks} />
            </div>
            <div className="lg:col-span-3">
              <RecentTasks user={user} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ProjectProgress tasks={tasks} projects={projects} />
            
            {/* Team Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your team</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {tasks.slice(0, 10).map(task => (
                    <div key={task.id} className="flex items-start space-x-4 py-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {task.status === 'Complete' ? 'Completed' : 'Updated'} task: {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(task.updated_at), 'MMM dd, HH:mm', { locale: enUS })}
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>Manage and track all your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <RecentTasks user={user} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects Overview</CardTitle>
              <CardDescription>Track progress across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projects.map(project => {
                  const projectTasks = tasks.filter(t => t.project_id && project.id && t.project_id.toString() === project.id.toString())
                  const completedTasks = projectTasks.filter(t => t.status === 'Complete').length
                  const progress = projectTasks.length ? (completedTasks / projectTasks.length) * 100 : 0
                  
                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{project.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {completedTasks} / {projectTasks.length} tasks
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          <span>Completed: {completedTasks}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <IconClock className="h-4 w-4 text-yellow-500" />
                          <span>In Progress: {projectTasks.filter(t => t.status === 'In Progress').length}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'Urgent':
      return 'destructive'
    case 'High':
      return 'secondary'
    case 'Medium':
      return 'secondary'
    default:
      return 'outline'
  }
} 