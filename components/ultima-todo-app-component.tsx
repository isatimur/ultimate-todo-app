'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './ui/button';

import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

import { addDays, isAfter } from 'date-fns';
import Analytics from './analytics';
import Dashboard from './dashboard';
import Profile from './profile';
import Settings from './settings';
import Projects, { ProjectP } from './projects';
import Tasks from './tasks';
import { supabase } from '@/lib/supabase-browser';
import { ProjectsProps } from './projects';



import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Sidebar, SidebarLink } from './ui/sidebar';
import {
    IconChartBar,
    IconChecklist,
    IconFolder,
    IconLayoutDashboard,
    IconSettings,
    IconUser
} from '@tabler/icons-react';

import { AnimatePresence, motion } from 'framer-motion';
import { TooltipProvider } from './ui/tooltip';
import { Project } from 'next/dist/build/swc';

interface Team {
    id: string;
    name: string;
    created_at: string | null;
    description: string | null;
    owner_id: string;
}

interface Subtask {
    id: number
    title: string
    completed: boolean
}

interface Task {
    id: number
    title: string
    status: 'To Do' | 'In Progress' | 'In Review' | 'Complete'
    priority: 'Low' | 'Medium' | 'High' | 'Urgent'
    due_date: string
    assignees: string[]
    description: string
    subtasks: Subtask[]
    time_tracked: number
    project: string
    tags: string[]
    dependencies: number[]
    recurrence: string | null
    importance: number
    urgency: number
    user_id: string
    created_at?: string
}

interface Template {
    id: number
    name: string
    tasks: Omit<Task, 'id' | 'timeTracked'>[]
    user_id: string
}

export default function UltimateTodoAppComponent2() {
    // Global state variables
    const [user, setUser] = useState<User | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<ProjectP[]>([])
    const [templates, setTemplates] = useState<Template[]>([])
    const [newTask, setNewTask] = useState('')
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [activeTimer, setActiveTimer] = useState<number | null>(null)
    const [selectedProject] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState('dashboard');
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
    const [isPomodoro, setIsPomodoro] = useState(false)
    const [aiSuggestion, setAiSuggestion] = useState('')

    const pomodoroRef = useRef<NodeJS.Timeout | null>(null)
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false);  // Set initial state to false

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
            label: "Settings",
            href: "#settings",
            icon: <IconSettings className="h-5 w-5" />,
            description: "App preferences"
        },
    ];

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
    };

    useEffect(() => {
        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) {
            setActiveTab(savedTab);
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
                data.map((task: Task) => ({
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
                setProjects(data as ProjectP[]);
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

    const fetchData = useCallback(async () => {
        if (user) {
            await Promise.all([fetchTasks(), fetchProjects(), fetchTemplates()]);
        }


    }, [user, fetchTasks, fetchProjects, fetchTemplates]);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user;
                setUser(currentUser ?? null);

                if (event === 'SIGNED_IN') {
                    await fetchData();
                } else if (event === 'SIGNED_OUT') {
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
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);


    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeTimer !== null) {
            interval = setInterval(() => {
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === activeTimer
                            ? { ...task, time_tracked: task.time_tracked + 1 }
                            : task
                    )
                )
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [activeTimer])


    const addTask = useCallback(async (title: string) => {
        if (title.trim() !== '') {
            try {
                const response = await fetch('/api/parse', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: title }),
                });
                const parsedData = await response.json();

                if (response.ok) {
                    const task: Partial<Task> = {
                        title: title,
                        status: 'To Do',
                        priority: 'Medium',
                        due_date: new Date().toISOString(),
                        assignees: ['JD'],
                        description: '',
                        subtasks: [],
                        time_tracked: 0,
                        project: selectedProject
                            ? projects.find((p) => p.id === selectedProject)?.name || ''
                            : '',
                        tags: [],
                        dependencies: [],
                        recurrence: null,
                        importance: 0,
                        urgency: 0,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                        user_id: user?.id!,
                    }

                    const { data, error } = await supabase.from('tasks').insert([task]).select();
                    if (error) {
                        console.error('Error adding task:', error);
                        toast.error('Could not add task.');
                    } else {
                        console.log('Added task:', data);
                        setNewTask('');
                        fetchTasks(); // Fetch tasks after adding a new task
                        toast.success("Your new task has been added successfully.");
                    }
                } else {
                    throw new Error(parsedData.error || 'Failed to parse task');
                }
            } catch (error) {
                console.error('Error adding task:', error);
                toast.error('Could not add task.');
            }
        }
    }, [selectedProject, projects, user?.id, fetchTasks]);


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


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateTask = useCallback(
        async (updatedTask: Task) => {
            const { error } = await supabase
                .from('tasks')
                .update(updatedTask)
                .eq('id', updatedTask.id)
            if (error) {
                console.error('Error updating task:', error)
            } else {
                setTasks((prevTasks) =>
                    prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
                );
                setEditingTask(null)
                toast.success("Your task has been updated successfully.");

            }
        }, [setTasks]);

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
        (status: Task['status']) => tasks.filter(t => t.status === status).length,
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


    const toggleTimer = useCallback(async (taskId: number) => {
        if (isPomodoro) {
            if (pomodoroRef.current) {
                clearInterval(pomodoroRef.current)
                pomodoroRef.current = null
            } else {
                pomodoroRef.current = setInterval(() => {
                    setPomodoroTime(prev => {
                        if (prev <= 1) {
                            clearInterval(pomodoroRef.current!)
                            pomodoroRef.current = null
                            toast.success("Time for a break!");
                            return 25 * 60
                        }
                        return prev - 1
                    })
                }, 1000)
            }
        } else {
            setActiveTimer(prevTimer => prevTimer === taskId ? null : taskId)
        }
    }, [isPomodoro])

    const formatTime = useCallback((seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, []);

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
            setProjects(prevProjects => prevProjects.map(p => p.id === id ? data[0] : p))
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
            setProjects(prevProjects => prevProjects.filter(p => p.id !== id))
            toast.success("Your project has been deleted successfully.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const addTemplate = useCallback(async (name: string, tasks: Omit<Task, 'id' | 'timeTracked'>[]) => {
        const { data, error } = await supabase
            .from('templates')
            // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        const updatedTasks = tasks.map(task => {
            if (task.recurrence && isAfter(today, new Date(task.due_date))) {
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
            time: tasks.filter(t => t.project === project.name).reduce((acc, t) => acc + t.time_tracked, 0) / 3600
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
            setActiveTab(storedTab);
        }
    }, []);

    // Define props for each component
    const dashboardProps = {
        tasks,
        projects,
        chartData,
        productivityData,
        aiSuggestion,
        getAISuggestions: async () => {
            // Implement AI suggestions logic
        },
        applyAISuggestion: () => {
            // Implement apply suggestion logic
        }
    };

    const tasksProps = {
        taskList: tasks,
        projects,
        addTask,
        updateTask,
        deleteTask,
        generateSubtasks,
        toggleTaskStatus,
        setEditingTask,
        activeTimer,
        toggleTimer,
        formatTime
    };

    const projectsProps: ProjectsProps = {
        projects,
        tasks,
        addProject: async (name: string, color: string, description: string) => {
            // Implement add project logic
            const { data, error } = await supabase
                .from('projects')
                .insert({ name, color, description, user_id: user?.id })
                .select()
                .single();

            if (error) {
                console.error('Error adding project:', error);
                return;
            }

            setProjects([...projects, data]);
        },
        updateProject: async (id: number, name: string, color: string, description: string) => {
            const { error } = await supabase
                .from('projects')
                .update({ name, color, description })
                .eq('id', id);

            if (error) {
                console.error('Error updating project:', error);
                return;
            }

            setProjects(projects.map(p => p.id === id ? { ...p, name, color, description } : p));
        },
        deleteProject: async (id: number) => {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting project:', error);
                return;
            }

            setProjects(projects.filter(p => p.id !== id));
        }
    };

    const analyticsProps = {
        productivityData,
        projectTimeData,
        tasks,
        projects
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div className="min-h-screen flex bg-background">
                <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user}>
                    <div className="flex-1 py-2">

                        <nav className="space-y-1 px-2">
                            {sidebarOpen && (
                                <div className="px-3 py-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        NAVIGATION
                                    </p>
                                </div>
                            )}
                            {mainNavLinks.map((link, idx) => (
                                <SidebarLink
                                    key={idx}
                                    link={link}
                                    isActive={activeTab === link.href.slice(1)}
                                    collapsed={!sidebarOpen}
                                    onClick={() => handleTabChange(link.href.slice(1))}
                                />
                            ))}
                        </nav>


                        <div className="mt-6">
                            {sidebarOpen && (
                                <div className="px-3 py-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        INSIGHTS
                                    </p>
                                </div>
                            )}
                            <nav className="space-y-1 px-2">
                                {insightsLinks.map((link, idx) => (
                                    <SidebarLink
                                        key={idx}
                                        link={link}
                                        isActive={activeTab === link.href.slice(1)}
                                        collapsed={!sidebarOpen}
                                        onClick={() => handleTabChange(link.href.slice(1))}
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>


                    <div className="border-t py-2">
                        {sidebarOpen && (
                            <div className="px-3 py-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    ACCOUNT
                                </p>
                            </div>
                        )}
                        <nav className="space-y-1 px-2">
                            {profileLinks.map((link, idx) => (
                                <SidebarLink
                                    key={idx}
                                    link={link}
                                    isActive={activeTab === link.href.slice(1)}
                                    collapsed={!sidebarOpen}
                                    onClick={() => handleTabChange(link.href.slice(1))}
                                />
                            ))}
                        </nav>
                    </div>
                </Sidebar>


                <motion.main
                    layout
                    className="flex-1"
                    style={{ marginLeft: sidebarOpen ? 280 : 72 }}
                >

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="container mx-auto p-6"
                        >
                            {activeTab === 'dashboard' && <Dashboard {...dashboardProps} />}
                            {activeTab === 'tasks' && <Tasks {...tasksProps} />}
                            {activeTab === 'projects' && <Projects {...projectsProps} />}
                            {activeTab === 'analytics' && <Analytics user={user} {...analyticsProps} />}
                            {activeTab === 'profile' && <Profile user={user} />}
                            {activeTab === 'settings' && <Settings user={user} />}
                        </motion.div>
                    </AnimatePresence>
                </motion.main>
            </div>
        </TooltipProvider>
    );
}

export const InviteMember = ({ teamId }: { teamId: string }) => {
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