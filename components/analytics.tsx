'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IconChartBar, IconChartLine, IconChartPie } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase-browser';
import { User } from '@supabase/supabase-js';
import { TaskType } from '@/lib/types'
import { ProjectType } from '@/components/projects'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval } from 'date-fns';

interface AnalyticsProps {
    user: User | null;
}

interface TimeEntry {
    id: string;
    project_id: string;
    task_id: string;
    start_time: string;
    end_time: string;
    duration: number;
    description: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function Analytics({ user }: AnalyticsProps) {
    const [timeRange, setTimeRange] = useState('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [analyticsData, setAnalyticsData] = useState<{
        tasks: TaskType[];
        timeEntries: TimeEntry[];
        projects: ProjectType[];
    }>({
        tasks: [],
        timeEntries: [],
        projects: []
    });

    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    // Memoized calculations
    const completionRate = useMemo(() => {
        const completed = analyticsData.tasks.filter(t => t.status === 'Complete').length;
        return analyticsData.tasks.length > 0 ? (completed / analyticsData.tasks.length) * 100 : 0;
    }, [analyticsData.tasks]);

    const tasksByStatus = useMemo(() => {
        const statusCounts = analyticsData.tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([status, count]) => ({
            name: status,
            value: count
        }));
    }, [analyticsData.tasks]);

    const weeklyActivity = useMemo(() => {
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        return days.map(day => {
            const dayTasks = analyticsData.tasks.filter(task => {
                if (!task.due_date) return false;
                const taskDate = new Date(task.due_date);
                return isWithinInterval(taskDate, { start: day, end: day });
            });

            return {
                name: format(day, 'EEE'),
                total: dayTasks.length,
                completed: dayTasks.filter(t => t.status === 'Complete').length
            };
        });
    }, [analyticsData.tasks, weekStart, weekEnd]);

    const projectProgress = useMemo(() => {
        return analyticsData.projects.map(project => {
            const projectTasks = analyticsData.tasks.filter(t => t.project === project.name);
            const completed = projectTasks.filter(t => t.status === 'Complete').length;
            const total = projectTasks.length;

            return {
                name: project.name,
                progress: total > 0 ? (completed / total) * 100 : 0,
                total,
                completed
            };
        });
    }, [analyticsData.tasks, analyticsData.projects]);

    const timeTracking = useMemo(() => {
        const totalTime = analyticsData.tasks.reduce((acc, task) => acc + (task.time_tracked || 0), 0);
        const avgTimePerTask = analyticsData.tasks.length > 0 ? totalTime / analyticsData.tasks.length : 0;

        return {
            totalTime: Math.round(totalTime / 3600),
            avgTimePerTask: Math.round(avgTimePerTask / 3600)
        };
    }, [analyticsData.tasks]);

    const productivityData = useMemo(() => {
        return analyticsData.projects.map(project => {
            const projectTasks = analyticsData.tasks.filter(task => task.project === project.name);
            const completedTasks = projectTasks.filter(task => task.status === 'Complete');
            const projectTime = analyticsData.timeEntries
                .filter(entry => entry.project_id === project.id)
                .reduce((sum, entry) => sum + (entry.duration || 0), 0);

            return {
                name: project.name,
                tasks: projectTasks.length,
                completed: completedTasks.length,
                efficiency: projectTasks.length ? (completedTasks.length / projectTasks.length) * 100 : 0,
                time: Math.round(projectTime / 60) // Convert minutes to hours
            };
        });
    }, [analyticsData.tasks, analyticsData.timeEntries, analyticsData.projects]);

    const fetchAnalyticsData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const now = new Date();
            const startDate = new Date();
            switch (timeRange) {
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

            const [tasksResponse, timeEntriesResponse, projectsResponse] = await Promise.all([
                supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('created_at', startDate.toISOString()),
                supabase
                    .from('time_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('start_time', startDate.toISOString()),
                supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
            ]);

            if (tasksResponse.error) throw tasksResponse.error;
            if (timeEntriesResponse.error) throw timeEntriesResponse.error;
            if (projectsResponse.error) throw projectsResponse.error;

            setAnalyticsData({
                tasks: tasksResponse.data || [],
                timeEntries: timeEntriesResponse.data || [],
                projects: projectsResponse.data || []
            });
        } catch (err) {
            console.error('Error fetching analytics data:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [user, timeRange]);

    useEffect(() => {
        if (user) {
            fetchAnalyticsData();
        }
    }, [user, timeRange, fetchAnalyticsData]);

    const CustomTooltip = ({ active, payload, label }: {
        active?: boolean;
        payload?: Array<{ color: string; name: string; value: number }>;
        label?: string;
    }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-4 shadow-lg">
                    <p className="font-medium">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                            {entry.name === 'time' ? ' hours' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 p-6"
        >
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Track your productivity and project progress
                    </p>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="quarter">Last Quarter</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.tasks.length}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span>In selected period</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {analyticsData.tasks.filter(t => t.status === 'Complete').length}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span>{completionRate.toFixed(1)}% completion rate</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{timeTracking.totalTime} hrs</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span>Avg: {timeTracking.avgTimePerTask}h per task</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.projects.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="productivity" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="productivity">
                        <IconChartLine className="h-4 w-4 mr-2" />
                        Productivity Trends
                    </TabsTrigger>
                    <TabsTrigger value="projects">
                        <IconChartBar className="h-4 w-4 mr-2" />
                        Project Distribution
                    </TabsTrigger>
                    <TabsTrigger value="overview">
                        <IconChartPie className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="productivity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Task Completion Rate</CardTitle>
                            <CardDescription>
                                Track your productivity trends over the selected period
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={productivityData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="name"
                                        className="text-sm"
                                    />
                                    <YAxis className="text-sm" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="tasks"
                                        name="Total Tasks"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="completed"
                                        name="Completed Tasks"
                                        stroke="#82ca9d"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="efficiency"
                                        name="Efficiency (%)"
                                        stroke="#ffc658"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="projects" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Time Distribution</CardTitle>
                            <CardDescription>
                                Time spent on each project in hours
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={productivityData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="name"
                                        className="text-sm"
                                    />
                                    <YAxis className="text-sm" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar
                                        dataKey="time"
                                        name="Hours Spent"
                                        fill="#8884d8"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="tasks"
                                        name="Total Tasks"
                                        fill="#82ca9d"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Status Distribution</CardTitle>
                                <CardDescription>
                                    Overview of completed vs pending tasks
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={tasksByStatus}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {tasksByStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Project Efficiency</CardTitle>
                                <CardDescription>
                                    Completion rate by project
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {productivityData.map((project, index) => (
                                        <div key={project.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{project.name}</span>
                                                <span>{Math.round(project.efficiency)}%</span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${project.efficiency}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{completionRate.toFixed(1)}%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Total Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analyticsData.tasks.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Time Tracked</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{timeTracking.totalTime}h</div>
                        <div className="text-sm text-muted-foreground">
                            Avg: {timeTracking.avgTimePerTask}h per task
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analyticsData.projects.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#8884d8" name="Total Tasks" />
                                    <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tasks by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tasksByStatus}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {tasksByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectProgress}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="progress" fill="#8884d8" name="Progress (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
