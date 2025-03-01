"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { addDays, isAfter } from 'date-fns';
import Analytics from './analytics';
import Dashboard from './dashboard';
import Profile from './profile';
import Projects, { ProjectType } from './projects';
import { Tasks } from './tasks'
import { TaskType, TasksProps, Task, UserProfile } from '@/lib/types'
import { supabase } from '@/lib/supabase-browser';
import { ProjectsProps } from './projects';
import { Team } from '@/types/team';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarView } from './calendar-view'
import { DashboardView } from './dashboard-view'
import TeamsView from "@/components/teams-view"
import { PomodoroTimer } from './pomodoro-timer'
import { motion, AnimatePresence } from 'framer-motion';
import { TooltipProvider } from './ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

import {
    IconChartBar,
    IconChecklist,
    IconFolder,
    IconLayoutDashboard,
    IconSettings,
    IconUser,
    IconUsersGroup,
    IconMoon
} from '@tabler/icons-react';

interface Subtask {
    id: number
    title: string
    completed: boolean
}

interface Template {
    id: number
    name: string
    tasks: Omit<TaskType, 'id' | 'time_tracked'>[]
    user_id: string
}

interface ExtendedTasksProps extends TasksProps {
    activeTimer: number | null;
    toggleTimer: () => void;
    formatTime: (time: number) => string;
}

interface UltimateTodoAppComponentProps {
  user: any;
  initialView?: 'dashboard' | 'tasks' | 'calendar' | 'projects' | 'teams' | 'settings';
}

export default function UltimateTodoAppComponent({ 
  user: initialUser,
  initialView = 'dashboard'
}: UltimateTodoAppComponentProps) {
    // Global state variables
    const [user, setUser] = useState(initialUser);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [currentView, setCurrentView] = useState(initialView);
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [projects, setProjects] = useState<ProjectType[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [editingTask, setEditingTask] = useState<TaskType | null>(null);
    const [newTask, setNewTask] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [activeTimer, setActiveTimer] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<TaskType | null>(null);
    const [isPomodoro, setIsPomodoro] = useState(false);
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds

    const pomodoroRef = useRef<NodeJS.Timeout | null>(null)
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const router = useRouter()

    const mainNavLinks = [
        {
            label: "Dashboard",
            href: "#dashboard",
            icon: <IconLayoutDashboard className="h-5 w-5" />,
            description: "Overview and quick actions"
        },
        {
            label: "Tasks",
            href: "#tasks",
            icon: <IconChecklist className="h-5 w-5" />,
            description: "Manage your tasks"
        },
        {
            label: "Projects",
            href: "#projects",
            icon: <IconFolder className="h-5 w-5" />,
            description: "View and manage projects"
        },
    ];

    const insightsLinks = [
        {
            label: "Analytics",
            href: "#analytics",
            icon: <IconChartBar className="h-5 w-5" />,
            description: "Performance insights"
        }
    ];

    const profileLinks = [
        {
            label: "Profile",
            href: "#profile",
            icon: <IconUser className="h-5 w-5" />,
            description: "Your account settings"
        },
        {
            label: 'Teams',
            href: "#teams",
            icon: <IconUsersGroup className="h-5 w-5" />,
            description: 'Manage your teams and collaborators'
        },
        {
            label: "Settings",
            href: "#settings",
            icon: <IconSettings className="h-5 w-5" />,
            description: "App preferences"
        },
    ];

    const handleTabChange = (tab: string) => {
        setCurrentView(tab);
        localStorage.setItem('activeTab', tab);
    };

    useEffect(() => {
        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) {
            setCurrentView(savedTab);
        }
    }, []);

    const fetchTasks = useCallback(async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            // .eq('team_id', currentTeam?.id)
            .order('id', { ascending: true });
        if (error) {
            console.error('Error fetching tasks:', error);
        } else {

            console.log('Fetched tasks:', data);
            setTasks(
                data.map((task: TaskType) => ({
                    ...task,
                    due_date: task.due_date,
                }))
            );
            const tasksWithSubtasks = data.map(task => ({
                ...task,
                subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
            }));
            setTasks(tasksWithSubtasks);
        }
    }, []);


    const fetchProjects = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                // .eq('team_id', currentTeam?.id)
                .order('id', { ascending: true });
            if (error) {
                console.error('Error fetching projects:', error);
            } else {
                console.log('Fetched projects:', data);
                setProjects(data as ProjectType[]);
            }
        } catch (error) {
            console.error('Unexpected error fetching projects:', error);
        }
    }, []);


    const fetchTemplates = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .order('id', { ascending: true });
            if (error) {
                console.error('Error fetching templates:', error);
            } else {
                console.log('Fetched templates:', data);
                setTemplates(data as Template[]);
            }
        } catch (error) {
            console.error('Unexpected error fetching templates:', error);
        }
    }, []);

    const fetchTeams = useCallback(async () => {
        if (!user) return;

        try {
            // Get all teams where user is owner
            const { data: ownedTeams, error: ownedError } = await supabase
                .from('teams')
                .select('*')
                .eq('owner_id', user.id);

            if (ownedError) throw ownedError;

            // Get all teams where user is a member
            const { data: memberTeams, error: memberError } = await supabase
                .from('team_members')
                .select(`
                    team:teams (
                        id,
                        name,
                        description,
                        owner_id,
                        created_at,
                        updated_at
                    )
                `)
                .eq('user_id', user.id);

            if (memberError) throw memberError;

            // Combine and deduplicate teams
            const allTeams = [
                ...(ownedTeams || []),
                ...(memberTeams?.map(m => m.team).filter(Boolean) || [])
            ];
            const uniqueTeams = Array.from(new Map(allTeams.map(team => [team.id, team])).values());

            if (!uniqueTeams.length) {
                setTeams([]);
                return;
            }

            // Get members with their profiles for all teams
            const { data: teamMembers, error: membersError } = await supabase
                .from('team_members')
                .select(`
                    id,
                    team_id,
                    user_id,
                    role,
                    joined_at,
                    profiles!team_members_user_id_profiles_fkey (
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .in('team_id', uniqueTeams.map(t => t.id));

            if (membersError) throw membersError;

            if (teamMembers) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select(`
                        id,
                        email,
                        full_name,
                        avatar_url
                    `)
                    .in('id', teamMembers.map(member => member.user_id));

                const membersWithProfiles = teamMembers.map(member => ({
                    ...member,
                    profile: profiles?.find(profile => profile.id === member.user_id)
                }));

                const formattedTeams = uniqueTeams.map(team => ({
                    ...team,
                    members: membersWithProfiles?.filter(m => m.team_id === team.id) || []
                }));

                setTeams(formattedTeams);
            }

        } catch (error) {
            console.error('Error fetching teams:', error);
            toast.error('Failed to fetch teams');
        }
    }, [user]);

    const fetchData = useCallback(async () => {
        if (user) {
            await Promise.all([
                fetchTasks(),
                fetchProjects(),
                fetchTemplates(),
                fetchTeams()
            ]);
        }
    }, [user, fetchTasks, fetchProjects, fetchTemplates, fetchTeams]);

    const fetchUserProfile = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return;
            }

            console.log('Fetched user profile:', data);
            if (data) {
                setUserProfile(data);
            } else {
                // If no profile exists, create one
                const newProfile = {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    avatar_url: user.user_metadata?.avatar_url || '',
                    updated_at: new Date().toISOString()
                } as UserProfile;

                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([newProfile])
                    .single();

                if (insertError) {
                    console.error('Error creating user profile:', insertError);
                    return;
                }

                setUserProfile(newProfile);
            }
        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
        }
    }, [user]);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user;
                setUser(currentUser ?? null);

                if (event === 'SIGNED_IN' && currentUser) {
                    try {
                        await Promise.all([
                            fetchData(),
                            fetchUserProfile()
                        ]);
                    } catch (error) {
                        console.error('Error during sign in:', error);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUserProfile(null); // Clear the profile on sign out
                    router.push('/signin');
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);


    useEffect(() => {
        if (user) {
            fetchData();
            fetchUserProfile();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);


    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeTimer !== null) {
            interval = setInterval(() => {
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id.toString() === activeTimer
                            ? { ...task, time_tracked: task.time_tracked ? task.time_tracked + 1 : 1 }
                            : task
                    )
                )
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [activeTimer])


    const addTask = useCallback(async (title: string) => {
        if (!user) {
            toast.error('You must be logged in to create tasks');
            return;
        }

        if (title.trim() === '') {
            toast.error('Task title cannot be empty');
            return;
        }

        try {
            // Parse task data using AI
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: title }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to parse task data');
            }

            const parsedData = await response.json();

            const task: Partial<TaskType> & { created_at: string; updated_at: string } = {
                title: title,
                status: 'To Do',
                priority: parsedData.priority || 'Medium',
                due_date: parsedData.due_date || new Date().toISOString(),
                assignees: [],
                description: parsedData.description || '',
                subtasks: [],
                time_tracked: 0,
                project: selectedProject
                    ? projects.find((p) => p.id.toString() === selectedProject.toString())?.name || ''
                    : '',
                tags: parsedData.tags || [],
                dependencies: [],
                recurrence: parsedData.recurrence,
                importance: parsedData.importance || 0,
                urgency: parsedData.urgency || 0,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('tasks')
                .insert([task])
                .select()
                .single();

            if (error) {
                throw error;
            }

            setNewTask('');
            await fetchTasks();
            toast.success('Task created successfully');

            // Send email notification if task is assigned to someone
            if (task.assignees && task.assignees.length > 0) {
                await fetch('/api/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'task_assignment',
                        data: {
                            taskTitle: task.title,
                            assignerName: userProfile?.full_name || user.email,
                            taskLink: `${window.location.origin}/tasks/${data.id}`,
                            assigneeEmail: task.assignees[0]
                        }
                    }),
                });
            }
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create task');
        }
    }, [selectedProject, projects, user, userProfile, fetchTasks]);


    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault()
                addTask(newTask)
            }
        }
        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [addTask, newTask])


    const updateTask = useCallback(async (updatedTask: TaskType) => {
        if (!user) {
            toast.error('You must be logged in to update tasks');
            return;
        }

        try {
            // Verify task ownership
            const { data: existingTask, error: verifyError } = await supabase
                .from('tasks')
                .select('user_id')
                .eq('id', updatedTask.id)
                .single();

            if (verifyError) throw verifyError;
            if (existingTask.user_id !== user.id) {
                throw new Error('You are not authorized to update this task');
            }

            const updates: TaskType & { updated_at: string } = {
                ...updatedTask,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', updatedTask.id);

            if (error) {
                throw error;
            }

            setTasks((prevTasks) =>
                prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
            );
            setEditingTask(null);
            toast.success('Task updated successfully');

            // Send email notification if due date is updated
            if (updatedTask.due_date) {
                const dueDate = new Date(updatedTask.due_date);
                const now = new Date();
                const timeUntilDue = dueDate.getTime() - now.getTime();
                const oneDayInMs = 24 * 60 * 60 * 1000;

                if (timeUntilDue > 0 && timeUntilDue <= oneDayInMs) {
                    await fetch('/api/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'task_due_reminder',
                            data: {
                                taskTitle: updatedTask.title,
                                dueDate: updatedTask.due_date,
                                taskLink: `${window.location.origin}/tasks/${updatedTask.id}`,
                                userEmail: user.email
                            }
                        }),
                    });
                }
            }
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update task');
        }
    }, [user, setTasks]);

    const deleteTask = useCallback(
        async (id: number) => {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id)
            if (error) {
                console.error('Error deleting task:', error)
            } else {
                fetchTasks(); // Fetch tasks after deleting a task
                toast.success("Your task has been deleted successfully.");
            }
        }, [fetchTasks]);

    const toggleTaskStatus = useCallback(async (id: number) => {
        const taskToUpdate = tasks.find(task => task.id === id)
        if (taskToUpdate) {
            const newStatus = taskToUpdate.status === 'Complete' ? 'To Do' : 'Complete'
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', id)
            if (error) {
                console.error('Error toggling task status:', error);
            } else {
                fetchTasks(); // Fetch tasks after toggling task status
            }
        }
    }, [fetchTasks, tasks])

    const getStatusCount = useMemo(() =>
        (status: TaskType['status']) => tasks.filter(t => t.status === status).length,
        [tasks]);


    const chartData = useMemo(() => {
        return [
            { name: 'To Do', value: getStatusCount('To Do') },
            { name: 'In Progress', value: getStatusCount('In Progress') },
            { name: 'In Review', value: getStatusCount('In Review') },
            { name: 'Complete', value: getStatusCount('Complete') },
        ]
    }, [getStatusCount])

    const productivityData = useMemo(() => [
        { name: 'Mon', tasks: 5 },
        { name: 'Tue', tasks: 8 },
        { name: 'Wed', tasks: 6 },
        { name: 'Thu', tasks: 9 },
        { name: 'Fri', tasks: 4 },
        { name: 'Sat', tasks: 3 },
        { name: 'Sun', tasks: 7 },
    ], []);


    const toggleTimer = useCallback((taskId: number) => {
        setActiveTimer(prev => prev === taskId.toString() ? null : taskId.toString());
        
        if (pomodoroRef.current) {
            clearInterval(pomodoroRef.current);
            pomodoroRef.current = null;
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setActiveTask(task);
            setIsPomodoro(true);
            setPomodoroTime(25 * 60); // Reset to 25 minutes
        }

        pomodoroRef.current = setInterval(() => {
            setPomodoroTime((time) => {
                if (time <= 1) {
                    if (pomodoroRef.current) {
                        clearInterval(pomodoroRef.current);
                        pomodoroRef.current = null;
                        setIsPomodoro(false);
                    }
                    return 0;
                }
                return time - 1;
            });
        }, 1000);
    }, [tasks]);

    const handlePomodoroComplete = useCallback(async () => {
        if (activeTask) {
            const updatedTask = {
                ...activeTask,
                time_tracked: (activeTask.time_tracked || 0) + 25 * 60 // Add 25 minutes
            }
            
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .update({ time_tracked: updatedTask.time_tracked })
                    .eq('id', activeTask.id)
                    .select()
                    .single()

                if (error) throw error

                setTasks(tasks.map(t => 
                    t.id === activeTask.id ? { ...t, time_tracked: updatedTask.time_tracked } : t
                ))
                
                toast.success(`Added 25 minutes to task: ${activeTask.title}`)
            } catch (error) {
                console.error('Error updating task time:', error)
                toast.error('Failed to update task time')
            }
        }
    }, [activeTask, tasks])

    const formatTime = useCallback((time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }, [])

    const addProject = useCallback(async (name: string, color: string, description: string) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('projects')
            .insert([{ name, color, description, user_id: user.id }])
            .select()
        if (error) {
            console.error('Error adding project:', error)
        } else {
            setProjects(prevProjects => [...prevProjects, data[0]])
            toast.success(`Project "${name}" has been added successfully.`);
        }
    }, [user])

    const updateProject = useCallback(async (id: number, name: string, color: string, description: string) => {
        const { data, error } = await supabase
            .from('projects')
            .update({ name, color, description, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
        if (error) {
            console.error('Error updating project:', error)
        } else {
            setProjects(prevProjects => prevProjects.map(p => p.id.toString() === id.toString() ? data[0] : p))
            toast.success(`Project "${name}" has been updated successfully.`);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const deleteProject = useCallback(async (id: number) => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)
        if (error) {
            console.error('Error deleting project:', error)
        } else {
            setProjects(prevProjects => prevProjects.filter(p => p.id.toString() !== id.toString()))
            toast.success("Your project has been deleted successfully.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const addTemplate = useCallback(async (name: string, tasks: Omit<TaskType, 'id' | 'time_tracked'>[]) => {
        const { data, error } = await supabase
            .from('templates')
            .insert([{ name, tasks, user_id: user?.id! }])
            .select()
        if (error) {
            console.error('Error adding template:', error)
        } else {
            setTemplates(prevTemplates => [...prevTemplates, data[0]])
            toast.success(`Template "${name}" has been added successfully.`);
        }
    }, [user])

    const applyTemplate = useCallback(async (templateId: number) => {
        const template = templates.find(t => t.id === templateId)
        if (template) {
            const newTasks = template.tasks.map(task => ({
                ...task,
                id: Date.now() + Math.random(),
                timeTracked: 0,
            }))

            const { error } = await supabase
                .from('tasks')
                .insert(newTasks)
            if (error) {
                console.error('Error applying template:', error)
            } else {
                fetchTasks(); // Fetch tasks after applying the template
                toast.success(`Template "${template.name}" has been applied successfully.`);
            }
        }
    }, [templates, fetchTasks])

    const getAISuggestions = useCallback(async () => {
        try {
            const response = await fetch('/api/aiSuggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks }),
            });
            const data = await response.json();

            if (response.ok) {
                setAiSuggestion(data.suggestion);
            } else {
                throw new Error(data.error || 'Failed to get AI suggestion');
            }
        } catch (error) {
            console.error('Error getting AI suggestion:', error);
            toast.error('Could not get AI suggestion.');
        }
    }, [tasks])


    const applyAISuggestion = useCallback(() => {
        // This is a mock function to apply AI suggestions. In a real app, this would implement the suggestion.
        toast.success("The AI suggestion has been implemented.");
        setAiSuggestion('')
    }, [])

    const generateSubtasks = async (taskId: number) => {
        const taskToUpdate = tasks.find((t) => t.id === taskId);
        if (taskToUpdate) {
            try {
                const response = await fetch('/api/taskBreakdown', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskDescription: taskToUpdate.title }),
                });
                const data = await response.json();

                if (response.ok) {
                    const updatedTask = { ...taskToUpdate, subtasks: data.subtasks };
                    updateTask(updatedTask);
                } else {
                    throw new Error(data.error || 'Failed to generate subtasks');
                }
            } catch (error) {
                console.error('Error generating subtasks:', error);
                toast.error('Could not generate subtasks.');
            }
        }
    };

    const handleRecurringTasks = useCallback(async () => {
        const today = new Date()
        const updatedTasks = tasks.map((task: TaskType) => {
            if (task.recurrence && task.due_date && isAfter(today, new Date(task.due_date))) {
                const newDueDate = addDays(new Date(task.due_date), 1) // This is a simple daily recurrence, adjust as needed
                return { ...task, due_date: newDueDate.toISOString() }
            }
            return task
        })
        setTasks(updatedTasks)
    }, [tasks])

    const projectTimeData = useMemo(() => {
        return projects.map(project => ({
            name: project.name,
            time: tasks.filter(t => t.project === project.name).reduce((acc, t) => acc + (t.time_tracked || 0), 0) / 3600
        }))
    }, [projects, tasks])

    useEffect(() => {
        handleRecurringTasks()

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    useEffect(() => {
        // This will only run on the client side
        const storedTab = localStorage.getItem('activeTab');
        if (storedTab) {
            setCurrentView(storedTab);
        }
    }, []);

    // Convert tasks to Task type for props
    const convertedTasks = tasks.map(task => ({
        id: task.id.toString(),
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: 'Work', // Default category
        status: task.status,
        date: task.created_at,
        due_date: task.due_date || '',
        completed: task.status === 'Complete',
        progress: 0,
        time_tracked: task.time_tracked,
        owner_id: task.user_id,
        created_at: task.created_at,
        updated_at: task.created_at
    }));

    // Calculate task statistics for dashboard
    const taskStats = useMemo(() => {
        const stats = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(stats).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    const dashboardProps = {
        chartData: taskStats,
        aiSuggestion,
        getAISuggestions: async () => {
            // Implementation
        },
        applyAISuggestion: () => {
            // Implementation
        }
    };

    const tasksProps: ExtendedTasksProps = {
        taskList: tasks,
        projects: projects.map(project => ({
            projects: [project],
            tasks,
            addProject: async (name, color, description) => {
                // Implementation
            },
            updateProject: async (id, name, color, description) => {
                // Implementation
            },
            deleteProject: async (id) => {
                // Implementation
            }
        })),
        user: {
            id: user?.id || '',
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || '',
            avatar_url: user?.user_metadata?.avatar_url || '',
            updated_at: user?.updated_at || ''
        },
        addTask: async (task: Partial<Task>) => {
            // Implementation
        },
        updateTask: async (task: Task) => {
            // Implementation
        },
        deleteTask: async (id: number) => {
            // Implementation
        },
        generateSubtasks: async (taskId: number) => {
            // Implementation
        },
        toggleTaskStatus: async (id: number) => {
            // Implementation
        },
        setEditingTask: (task: Task | null) => {
            setEditingTask(task ? {
                id: parseInt(task.id),
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                importance: 0,
                urgency: 0,
                user_id: task.owner_id,
                created_at: task.created_at
            } : null);
        },
        activeTimer,
        toggleTimer: () => {
            // Implementation
        },
        formatTime: (time: number) => `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`
    };

    const projectsProps: ProjectsProps = {
        projects,
        tasks,
        addProject: async (name, color, description) => {
            // Implementation
        },
        updateProject: async (id, name, color, description) => {
            // Implementation
        },
        deleteProject: async (id) => {
            // Implementation
        }
    };

    const analyticsProps = {
        user,
        tasks,
        projects
    };

    const handleCreateTeam = async (name: string, description: string) => {
        if (!user) return;

        try {
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    name,
                    description,
                    owner_id: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (teamError) throw teamError;

            const { error: memberError } = await supabase
                .from('team_members')
                .insert({
                    team_id: team.id,
                    user_id: user.id,
                    role: 'owner',
                    joined_at: new Date().toISOString()
                });

            if (memberError) {
                await supabase.from('teams').delete().eq('id', team.id);
                throw memberError;
            }

            await fetchTeams();
            toast.success('Team created successfully');
        } catch (error) {
            console.error('Error creating team:', error);
            toast.error('Failed to create team');
        }
    };

    const handleInviteMember = async (teamId: string, email: string, role: string) => {
        try {
            // Create the invitation in the database
            const { data: invitation, error: invitationError } = await supabase
                .from('team_invitations')
                .insert({
                    team_id: teamId,
                    email,
                    role,
                    status: 'pending',
                    invited_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                })
                .select()
                .single();

            if (invitationError) {
                console.error('Error creating invitation:', invitationError);
                throw new Error('Failed to create invitation');
            }

            if (!invitation) {
                throw new Error('No invitation data returned');
            }

            // Get team details
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .select('name')
                .eq('id', teamId)
                .single();

            if (teamError) {
                console.error('Error fetching team:', teamError);
                throw new Error('Failed to fetch team details');
            }

            if (!team) {
                throw new Error('Team not found');
            }

            // Get inviter's name
            const inviterName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A team member';

            // Send invitation email
            const inviteLink = `${window.location.origin}/teams/invite/${invitation.id}`;
            const response = await fetch('/api/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'team_invitation',
                    data: {
                        teamName: team.name,
                        inviterName,
                        inviteLink,
                        recipientEmail: email
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Email API error:', errorData);
                
                // Delete the invitation if email sending fails
                await supabase
                    .from('team_invitations')
                    .delete()
                    .eq('id', invitation.id);
                
                throw new Error(errorData.error || 'Failed to send invitation email');
            }

            const result = await response.json();
            console.log('Email sent successfully:', result);

            toast.success('Invitation sent successfully');
            return invitation;
        } catch (error) {
            console.error('Error inviting member:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to invite member');
            throw error;
        }
    };

    const handleRemoveMember = async (teamId: string, userId: string) => {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
            return;
        }

        fetchTeams();
        toast.success('Member removed successfully');
    };

    const handleCancelInvitation = async (invitationId: string) => {
        try {
            const { error } = await supabase
                .from('team_invitations')
                .delete()
                .eq('id', invitationId);

            if (error) throw error;
            toast.success('Invitation cancelled successfully');
            fetchTeams(); // Refresh teams data
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            toast.error('Failed to cancel invitation');
        }
    };

    const handleResendInvitation = async (invitationId: string) => {
        try {
            console.log('Attempting to resend invitation:', invitationId);

            // First verify the invitation exists and get its current state
            const { data: existingInvitation, error: checkError } = await supabase
                .from('team_invitations')
                .select('*')
                .eq('id', invitationId)
                .maybeSingle();

            console.log('Existing invitation check result:', { existingInvitation, checkError });

            if (checkError || !existingInvitation) {
                const errorMessage = checkError?.message || 'Invitation not found';
                console.error('Error checking invitation:', errorMessage);
                toast.error(`Error checking invitation: ${errorMessage}`);
                return;
            }

            // Update the invitation dates
            const updates = {
                invited_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                status: 'pending' // Ensure status is set to pending for resent invitations
            };

            console.log('Updating invitation with:', updates);

            // Perform the update without using select() initially
            const { error: updateError } = await supabase
                .from('team_invitations')
                .update(updates)
                .eq('id', invitationId);

            if (updateError) {
                console.error('Error updating invitation:', updateError);
                toast.error(`Failed to update invitation: ${updateError.message}`);
                return;
            }

            // Fetch the updated invitation in a separate query
            const { data: updatedInvitation, error: fetchError } = await supabase
                .from('team_invitations')
                .select('*')
                .eq('id', invitationId)
                .single();

            if (fetchError) {
                console.error('Error fetching updated invitation:', fetchError);
                toast.error(`Failed to fetch updated invitation: ${fetchError.message}`);
                return;
            }

            console.log('Successfully updated invitation:', updatedInvitation);

            // Fetch team details
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .select('name')
                .eq('id', existingInvitation.team_id)
                .single();

            if (teamError) {
                console.error('Error fetching team details:', teamError);
                toast.error(`Failed to fetch team details: ${teamError.message}`);
                return;
            }

            // Get inviter's name
            const inviterName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A team member';

            // Resend the invitation email
            const inviteLink = `${window.location.origin}/teams/invite/${invitationId}`;
            
            console.log('Preparing to send email with:', {
                teamName: team.name,
                inviterName,
                recipientEmail: existingInvitation.email,
                inviteLink
            });

            const response = await fetch('/api/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'team_invitation',
                    data: {
                        teamName: team.name,
                        inviterName,
                        inviteLink,
                        recipientEmail: existingInvitation.email
                    }
                }),
            });

            const responseData = await response.json();
            console.log('Email API response:', responseData);

            if (!response.ok) {
                console.error('Email API error:', responseData);
                throw new Error(responseData.error || 'Failed to send invitation email');
            }

            toast.success('Invitation resent successfully');
        } catch (error) {
            console.error('Error in handleResendInvitation:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
        }
    };

    useEffect(() => {
        const handleSectionChange = (event: CustomEvent<string>) => {
            setCurrentView(event.detail);
            localStorage.setItem('activeTab', event.detail);
        };

        window.addEventListener('sectionChange', handleSectionChange as EventListener);

        return () => {
            window.removeEventListener('sectionChange', handleSectionChange as EventListener);
        };
    }, []);

    const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
        try {
            const taskToUpdate = tasks.find(t => t.id === taskId);
            if (!taskToUpdate) return;

            const updatedTask = { ...taskToUpdate, ...updates };
            const { error } = await supabase
                .from('tasks')
                .update(updatedTask)
                .eq('id', taskId);

            if (error) throw error;

            setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
            toast.success('Task updated successfully');
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Failed to update task');
        }
    };

    const handleTaskDelete = async (taskId: number) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            setTasks(tasks.filter(t => t.id !== taskId));
            toast.success('Task deleted successfully');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to delete task');
        }
    };

    const handleAddTask = async (taskData: Partial<Task>) => {
        try {
            const now = new Date().toISOString()
            const newTask = {
                title: taskData.title,
                description: taskData.description || null,
                priority: taskData.priority || 'Medium',
                status: taskData.status || 'To Do',
                due_date: taskData.due_date || now,
                user_id: user?.id,
                created_at: now,
                updated_at: now,
                time_tracked: 0,
                importance: taskData.importance || 0,
                urgency: taskData.urgency || 0,
                project: taskData.project || null,
                team_id: taskData.team_id || null,
                assignees: taskData.assignees || null,
                dependencies: taskData.dependencies?.map(Number) || null,
                tags: taskData.tags || null,
                subtasks: taskData.subtasks || null,
                recurrence: taskData.recurring?.frequency || null
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert([newTask])
                .select()
                .single()

            if (error) throw error

            setTasks(prevTasks => [...prevTasks, {
                ...data,
                id: data.id.toString()
            }])
            toast.success('Task created successfully')
        } catch (error) {
            console.error('Error adding task:', error)
            toast.error('Failed to create task')
        }
    }

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <DashboardView
                        tasks={tasks}
                        projects={projects}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskDelete={handleTaskDelete}
                        onAddTask={handleAddTask}
                    />
                );
            case 'tasks':
                return (
                    <Tasks
                        initialTasks={tasks}
                        projects={projects}
                        addTask={handleAddTask}
                        updateTask={handleTaskUpdate}
                        deleteTask={handleTaskDelete}
                        generateSubtasks={generateSubtasks}
                        toggleTaskStatus={toggleTaskStatus}
                        setEditingTask={setEditingTask}
                        activeTimer={activeTimer}
                        toggleTimer={toggleTimer}
                        formatTime={formatTime}
                    />
                );
            case 'calendar':
                return (
                    <CalendarView
                        tasks={tasks}
                        onTaskUpdate={handleTaskUpdate}
                        onTaskDelete={handleTaskDelete}
                        onAddTask={handleAddTask}
                    />
                );
            case 'projects':
                return (
                    <Projects
                        projects={projects}
                        tasks={tasks}
                        onProjectCreate={handleCreateProject}
                        onProjectUpdate={handleUpdateProject}
                        onProjectDelete={handleDeleteProject}
                        onTaskUpdate={handleTaskUpdate}
                    />
                );
            case 'profile':
                return <Profile user={user} />;
            case 'settings':
                return (
                    <Card className="p-6">
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Manage your account settings and preferences</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Please use the settings page for a full settings experience.</p>
                        </CardContent>
                    </Card>
                );
            case 'notifications':
                return (
                    <Card className="p-6">
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Manage your notifications and preferences</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">No new notifications</p>
                        </CardContent>
                    </Card>
                );
            case 'teams':
                return (
                    <TeamsView
                        userId={user?.id || ''}
                        userEmail={user?.email || ''}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative flex min-h-screen bg-background">

            <main className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="container mx-auto p-6 max-w-7xl"
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <PomodoroTimer
                isPomodoro={isPomodoro}
                pomodoroTime={pomodoroTime}
                pomodoroRef={pomodoroRef}
                toggleTimer={toggleTimer}
                formatTime={formatTime}
                currentTask={activeTask || undefined}
                onPomodoroComplete={handlePomodoroComplete}
                setPomodoroTime={setPomodoroTime}
            />
        </div>
    );
}export const InviteMember = ({ teamId }: { teamId: string }) => {
    const [email, setEmail] = useState('');

    const handleInvite = async () => {
        const { error } = await supabase
            .from('invitations')
            .insert({ team_id: teamId, email, token: generateToken() });

        if (error) {
            console.error('Error inviting member:', error);
        } else {
            setEmail('');
        }
    };

    const generateToken = () => {
        return Math.random().toString(36).substr(2, 10);
    };

    return (
        <div>
            <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to invite"
            />
            <Button onClick={handleInvite}>Invite Member</Button>
        </div>
    );
};

