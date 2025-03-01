'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays, isAfter } from 'date-fns'

interface TeamMember {
  id: string
  role: string
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

interface TeamAnalytics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  completion_rate: number
}

interface Team {
  team_id: string
  team_name: string
  team_role: string
  is_owner: boolean
  analytics: TeamAnalytics
  members: TeamMember[]
}

interface AnalyticsDashboardProps {
  teams: Team[]
  personalTeam: Team | undefined
  userId: string
}

export default function AnalyticsDashboard({ teams, personalTeam, userId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')
  const allTeams = personalTeam ? [...teams, personalTeam] : teams

  // Calculate metrics across all teams
  const totalTasks = allTeams.reduce((sum, team) => sum + team.analytics.total_tasks, 0)
  const completedTasks = allTeams.reduce((sum, team) => sum + team.analytics.completed_tasks, 0)
  const inProgressTasks = allTeams.reduce((sum, team) => sum + team.analytics.in_progress_tasks, 0)
  const overdueTasks = allTeams.reduce((sum, team) => sum + team.analytics.overdue_tasks, 0)
  const averageCompletionRate = allTeams.length 
    ? allTeams.reduce((sum, team) => sum + team.analytics.completion_rate, 0) / allTeams.length 
    : 0

  // Prepare chart data
  const tasksByTeam = allTeams.map(team => ({
    name: team.team_name,
    completed: team.analytics.completed_tasks,
    inProgress: team.analytics.in_progress_tasks,
    overdue: team.analytics.overdue_tasks,
    total: team.analytics.total_tasks
  }))

  const taskStatusData = [
    { name: 'Completed', value: completedTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Overdue', value: overdueTasks }
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              across all teams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed out of {totalTasks}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              tasks past their due date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTeams.length}</div>
            <p className="text-xs text-muted-foreground">
              teams with tasks
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Distribution of tasks across different statuses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Task completion rates by team</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByTeam}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" stackId="a" />
                <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" stackId="a" />
                <Bar dataKey="overdue" fill="#ef4444" name="Overdue" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>Detailed metrics for each team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allTeams.map(team => (
                <div key={team.team_id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">{team.team_name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {team.analytics.completion_rate.toFixed(1)}% completion rate
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Tasks</p>
                      <p className="font-medium">{team.analytics.total_tasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">{team.analytics.completed_tasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">In Progress</p>
                      <p className="font-medium">{team.analytics.in_progress_tasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Overdue</p>
                      <p className="font-medium">{team.analytics.overdue_tasks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 