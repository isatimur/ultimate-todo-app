"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react"
import { format, subDays } from "date-fns"
import { useSupabase } from "@/lib/hooks/useSupabase"
import { useRouter } from "next/navigation"
import { Skeleton } from "./ui/skeleton"
import { Progress } from "./ui/progress"

interface TeamAnalytics {
  id: string
  name: string
  members: { count: number }[]
  tasks: { count: number }[]
  completed_tasks: { count: number }[]
}

interface ProjectAnalytics {
  id: string
  name: string
  tasks: { count: number }[]
  completed_tasks: { count: number }[]
}

interface AnalyticsViewProps {
  userId: string
  teams: TeamAnalytics[]
  projects: ProjectAnalytics[]
}

export function AnalyticsView({ userId, teams, projects }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [isLoading, setIsLoading] = React.useState(false)
  const [dailyStats, setDailyStats] = React.useState<any[]>([])
  const supabase = useSupabase()
  const router = useRouter()

  React.useEffect(() => {
    async function fetchDailyStats() {
      setIsLoading(true)
      try {
        const startDate = subDays(new Date(), 30)
        const { data, error } = await supabase
          .from('tasks')
          .select('created_at, status')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        if (error) throw error

        // Process daily stats
        const stats = data.reduce((acc: any, task) => {
          const date = task.created_at.split('T')[0]
          if (!acc[date]) {
            acc[date] = { total: 0, completed: 0 }
          }
          acc[date].total++
          if (task.status === 'Complete') {
            acc[date].completed++
          }
          return acc
        }, {})

        setDailyStats(Object.entries(stats).map(([date, stats]: [string, any]) => ({
          date,
          ...stats,
          completion_rate: (stats.completed / stats.total) * 100
        })))
      } catch (error) {
        console.error('Error fetching daily stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDailyStats()
  }, [supabase])

  const totalTasks = React.useMemo(() => {
    return projects.reduce((sum, project) => sum + project.tasks[0]?.count || 0, 0)
  }, [projects])

  const completedTasks = React.useMemo(() => {
    return projects.reduce((sum, project) => sum + project.completed_tasks[0]?.count || 0, 0)
  }, [projects])

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const totalTeamMembers = React.useMemo(() => {
    return teams.reduce((sum, team) => sum + team.members[0]?.count || 0, 0)
  }, [teams])

  const getTeamStats = (team: TeamAnalytics) => {
    const totalTasks = team.tasks[0]?.count || 0
    const completedTasks = team.completed_tasks[0]?.count || 0
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    return { totalTasks, completedTasks, completionRate }
  }

  const getProjectStats = (project: ProjectAnalytics) => {
    const totalTasks = project.tasks[0]?.count || 0
    const completedTasks = project.completed_tasks[0]?.count || 0
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    return { totalTasks, completedTasks, completionRate }
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-4">
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tasks
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {completedTasks} completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completion Rate
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {completionRate.toFixed(1)}%
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Team Members
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTeamMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {teams.length} teams
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    In progress
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[200px]" />
                  </div>
                ) : (
                  <div className="h-[200px]">
                    {/* Add chart component here */}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            {teams.map((team) => {
              const stats = getTeamStats(team)
              return (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Members
                        </div>
                        <div className="text-2xl font-bold">
                          {team.members[0]?.count || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Tasks
                        </div>
                        <div className="text-2xl font-bold">
                          {stats.totalTasks}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Completion Rate
                        </div>
                        <div className="text-2xl font-bold">
                          {stats.completionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={stats.completionRate} className="mt-4 h-2" />
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            {projects.map((project) => {
              const stats = getProjectStats(project)
              return (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Tasks
                        </div>
                        <div className="text-2xl font-bold">
                          {stats.totalTasks}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Completion Rate
                        </div>
                        <div className="text-2xl font-bold">
                          {stats.completionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={stats.completionRate} className="mt-4 h-2" />
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Task Completion</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[300px]" />
                  </div>
                ) : (
                  <div className="h-[300px]">
                    {/* Add chart component here */}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Task Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-[200px]" />
                    </div>
                  ) : (
                    <div className="h-[200px]">
                      {/* Add chart component here */}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-[200px]" />
                    </div>
                  ) : (
                    <div className="h-[200px]">
                      {/* Add chart component here */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
} 