import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import CreateTeamDialog from './create-team-dialog';
import {supabase} from '@/lib/supabase-browser';
import {Team} from '@/types/team';
import {Badge} from '@/components/ui/badge';
import {UsersIcon, FolderIcon, CheckCircle2Icon, ClockIcon, ActivityIcon, CalendarIcon, TrendingUpIcon} from 'lucide-react';
import {TaskType} from '../tasks';
import {ProjectType} from '../projects';
import {Progress} from '../ui/progress';
import {Avatar, AvatarFallback, AvatarImage} from '../ui/avatar';
import {ScrollArea} from '../ui/scroll-area';

interface TeamDashboardProps {
    team: Team;
    tasks: TaskType[];
    projects: ProjectType[];
}

interface Activity {
    type: 'task' | 'project';
    item: {
        id: number | string;
        title?: string;
        name?: string;
        created_at: string;
    };
    date: Date;
}

export default function TeamDashboard({team, tasks, projects}: TeamDashboardProps) {
    const teamTasks = tasks.filter(task => task.team_id === team.id);
    const teamProjects = projects.filter(project => project.team_id === team.id);
    const completedTasks = teamTasks.filter(task => task.status === 'Complete');
    const totalTimeTracked = teamTasks.reduce((acc, task) => acc + (task.time_tracked || 0), 0);

    const tasksByStatus = {
        'To Do': teamTasks.filter(t => t.status === 'To Do').length,
        'In Progress': teamTasks.filter(t => t.status === 'In Progress').length,
        'In Review': teamTasks.filter(t => t.status === 'In Review').length,
        'Complete': completedTasks.length,
    };

    const taskCompletion = teamTasks.length > 0 
        ? (completedTasks.length / teamTasks.length) * 100 
        : 0;

    const recentActivity: Activity[] = [
        ...teamTasks.map(task => ({
            type: 'task' as const,
            item: {
                id: task.id,
                title: task.title || 'Untitled Task',
                created_at: task.created_at || new Date().toISOString()
            },
            date: new Date(task.created_at || new Date())
        })),
        ...teamProjects.map(project => ({
            type: 'project' as const,
            item: {
                id: project.id,
                name: project.name || 'Untitled Project',
                created_at: project.created_at || new Date().toISOString()
            },
            date: new Date(project.created_at || new Date())
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Team Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Members</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team.members.length}</div>
                        <div className="flex mt-4 space-x-1">
                            {team.members.slice(0, 4).map(member => (
                                <Avatar key={member.id} className="h-6 w-6">
                                    <AvatarImage src={member.profiles?.avatar_url || ''} />
                                    <AvatarFallback>
                                        {member.profiles?.full_name?.[0] || member.profiles?.email?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {team.members.length > 4 && (
                                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                                    +{team.members.length - 4}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
                        <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {taskCompletion.toFixed(0)}%
                        </div>
                        <Progress value={taskCompletion} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {completedTasks.length} of {teamTasks.length} tasks completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <FolderIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teamProjects.length}</div>
                        <div className="mt-4 space-y-1">
                            {teamProjects.slice(0, 3).map(project => (
                                <div key={project.id} className="flex items-center">
                                    <div 
                                        className="w-2 h-2 rounded-full mr-2"
                                        style={{ backgroundColor: project.color }}
                                    />
                                    <span className="text-sm truncate">{project.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(totalTimeTracked / 3600)}h
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Across {teamTasks.length} tasks
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Task Status and Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Task Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(tasksByStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <span className="text-sm font-medium">{status}</span>
                                            <span className="ml-auto text-sm text-muted-foreground">
                                                {count}
                                            </span>
                                        </div>
                                        <Progress 
                                            value={teamTasks.length > 0 ? (count / teamTasks.length) * 100 : 0} 
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-3">
                                            {activity.type === 'task' ? (
                                                <CheckCircle2Icon className="h-4 w-4" />
                                            ) : (
                                                <FolderIcon className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {activity.type === 'task' 
                                                    ? activity.item.title 
                                                    : activity.item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.type === 'task' ? 'New task created' : 'New project created'}
                                            </p>
                                        </div>
                                        <time className="text-xs text-muted-foreground">
                                            {activity.date.toLocaleDateString()}
                                        </time>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
