'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { BarChartIcon, BellIcon, BookTemplateIcon, BrainIcon, CalendarIcon, CheckIcon, ClockIcon, EditIcon, FolderIcon, LayoutDashboardIcon, ListTodoIcon, MoonIcon, MoreVerticalIcon, PauseIcon, PlayIcon, PlusIcon, RepeatIcon, SunIcon, TimerIcon, TrashIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from '@hello-pangea/dnd';
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, isAfter } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import { supabase } from "@/lib/supabase-browser"
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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

interface Project {
  id: number
  name: string
  color: string
  user_id: string
}

interface Template {
  id: number
  name: string
  tasks: Omit<Task, 'id' | 'timeTracked'>[]
  user_id: string
}


export default function UltimateTodoAppComponent() {
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [activeTimer, setActiveTimer] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [showCompleted, setShowCompleted] = useState(true)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [isPomodoro, setIsPomodoro] = useState(false)
  const [theme, setTheme] = useState('default')
  const [aiSuggestion, setAiSuggestion] = useState('')

  const pomodoroRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()


  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
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
    }
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: true });
      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        console.log('Fetched projects:', data);
        setProjects(data as Project[]);
      }
    } catch (error) {
      console.error('Unexpected error fetching projects:', error);
    }
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

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
      subscribeToRealtimeChanges();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    document.body.classList.toggle('dark', darkMode)
    document.body.setAttribute('data-theme', theme)
  }, [darkMode, theme])

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

  const subscribeToRealtimeChanges = useCallback(() => {
    const tasksSubscription = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
      }, payload => {
        console.log('Realtime task change:', payload);
        fetchTasks();
      })
      .subscribe();

    const projectsSubscription = supabase
      .channel('projects')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
      }, payload => {
        console.log('Realtime project change:', payload);
        fetchProjects();
      })
      .subscribe();

    const templatesSubscription = supabase
      .channel('templates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'templates',
      }, payload => {
        console.log('Realtime template change:', payload);
        fetchTemplates();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(templatesSubscription);
    };
  }, [fetchTasks, fetchProjects, fetchTemplates]);


  const addTask = useCallback(async () => {
    if (newTask.trim() !== '') {
      const task: Partial<Task> = {
        title: newTask,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data, error } = await supabase.from('tasks').insert([task]).select();
      if (error) {
        console.error('Error adding task:', error);
        toast({
          title: 'Error',
          description: 'Could not add task.',
          variant: 'destructive',
        });
      } else {
        console.log('Added task:', data);
        setNewTask('');
        fetchTasks(); // Fetch tasks after adding a new task
        toast({
          title: "Task added",
          description: "Your new task has been added successfully.",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTask, selectedProject, projects, user]);


  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        addTask()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [addTask])


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
        fetchTasks(); // Fetch tasks after updating a task
        setEditingTask(null)
        toast({
          title: "Task updated",
          description: "Your task has been updated successfully.",
        })
      }
    }, []);

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
        toast({
          title: "Task deleted",
          description: "Your task has been deleted successfully.",
          variant: "destructive",
        })
      }
    }, []);

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
  }, [tasks])

  const getStatusCount = useMemo(() =>
    (status: Task['status']) => tasks.filter(t => t.status === status).length,
    [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter !== 'all' && task.status !== filter) return false
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedProject && task.project !== projects.find(p => p.id === selectedProject)?.name) return false
      if (!showCompleted && task.status === 'Complete') return false
      return true
    })
  }, [tasks, filter, search, selectedProject, showCompleted, projects])


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

  const onDragEnd = useCallback(async (result: { source: { index: number }; destination: { index: number } }) => {
    if (!result.destination) return

    const newTasks = Array.from(tasks)
    const [reorderedTask] = newTasks.splice(result.source.index, 1)
    newTasks.splice(result.destination.index, 0, reorderedTask)

    setTasks(newTasks)
    // Update the order in Supabase
    const { error } = await supabase
      .from('tasks')
      .update({ order: result.destination.index })
      .eq('id', reorderedTask.id)

    if (error) {
      console.error('Error updating task order:', error)
    }

  }, [tasks])

  const toggleSubtask = useCallback(async (taskId: number, subtaskId: number) => {
    const taskToUpdate = tasks.find(task => task.id === taskId)
    if (taskToUpdate) {
      const updatedSubtasks = taskToUpdate.subtasks.map(subtask =>
        subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
      )
      const { error } = await supabase
        .from('tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskId)
      if (error) {
        console.error('Error toggling subtask:', error);
      } else {
        fetchTasks(); // Fetch tasks after toggling subtask
      }
    }
  }, [tasks])

  const addSubtask = useCallback(async (taskId: number, subtaskTitle: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (taskToUpdate) {
      const newSubtask = { id: Date.now(), title: subtaskTitle, completed: false };
      const updatedSubtasks = [...taskToUpdate.subtasks, newSubtask];
      const { error } = await supabase
        .from('tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskId);
      if (error) {
        console.error('Error adding subtask:', error);
      } else {
        fetchTasks(); // Fetch tasks after adding subtask
      }
    }
  }, [tasks]);

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
              toast({
                title: "Pomodoro finished",
                description: "Time for a break!",
              })
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

  const addProject = useCallback(async (name: string, color: string) => {
    const { data, error } = await supabase
      .from('projects')
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      .insert([{ name, color, user_id: user?.id! }])
      .select()
    if (error) {
      console.error('Error adding project:', error)
    } else {
      setProjects(prevProjects => [...prevProjects, data[0]])
      toast({
        title: "Project added",
        description: `Project "${name}" has been added successfully.`,
      })
    }
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
      toast({
        title: "Template added",
        description: `Template "${name}" has been added successfully.`,
      })
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
        toast({
          title: "Template applied",
          description: `Template "${template.name}" has been applied successfully.`,
        })
      }
    }
  }, [templates, fetchTasks])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAISuggestions = useCallback(() => {
    // This is a mock AI suggestion function. In a real app, this would call an AI service.
    const suggestions = [
      "Break down the 'Research and development' task into smaller subtasks",
      "Consider increasing the priority of 'Konom web application' as the deadline is approaching",
      "You've been spending a lot of time on 'Dashboard design'. Consider delegating some subtasks",
      "Create a project for your personal goals and add related tasks",
      "Use the Eisenhower Matrix to prioritize your tasks more effectively",
    ]
    setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)])
  }, [])

  const applyAISuggestion = useCallback(() => {
    // This is a mock function to apply AI suggestions. In a real app, this would implement the suggestion.
    toast({
      title: "AI Suggestion Applied",
      description: "The AI suggestion has been implemented.",
    })
    setAiSuggestion('')
  }, [])

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

  return (
    <div className={`max-w-7xl mx-auto p-4 min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ultima - #1 ToDo application</h1>
        <div className="flex items-center space-x-2">
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="neon">Neon</SelectItem>
              <SelectItem value="pastel">Pastel</SelectItem>
              <SelectItem value="monochrome">Monochrome</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon">
            <BellIcon className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
            <AvatarImage src="https://github.com/shadcn.png" />
          </Avatar>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard"><LayoutDashboardIcon className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
          <TabsTrigger value="tasks"><ListTodoIcon className="h-4 w-4 mr-2" />Tasks</TabsTrigger>
          <TabsTrigger value="projects"><FolderIcon className="h-4 w-4 mr-2" />Projects</TabsTrigger>
          <TabsTrigger value="analytics"><BarChartIcon className="h-4 w-4 mr-2" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{aiSuggestion || 'Click the button to get an AI suggestion.'}</p>
                <div className="flex space-x-2">
                  <Button onClick={getAISuggestions}>
                    <BrainIcon className="h-4 w-4 mr-2" /> Get Suggestion
                  </Button>
                  {aiSuggestion && (
                    <Button onClick={applyAISuggestion}>
                      Apply Suggestion
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getStatusCount('In Progress')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Review</CardTitle>
                <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getStatusCount('In Review')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">To Do</CardTitle>
                <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getStatusCount('To Do')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getStatusCount('Complete')}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="bg-card rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-2">
                  <Badge variant="secondary" className="bg-black text-white">
                    Complete <span className="ml-1 px-1 py-0.5 rounded-full bg-green-500 text-xs">{getStatusCount('Complete')}</span>
                  </Badge>
                  <Badge variant="outline">
                    To Do <span className="ml-1 px-1 py-0.5 rounded-full bg-gray-200 text-xs">{getStatusCount('To Do')}</span>
                  </Badge>
                  <Badge variant="outline">
                    In Review <span className="ml-1 px-1 py-0.5 rounded-full bg-gray-200 text-xs">{getStatusCount('In Review')}</span>
                  </Badge>
                  <Badge variant="outline">
                    In Progress <span className="ml-1 px-1 py-0.5 rounded-full bg-gray-200 text-xs">{getStatusCount('In Progress')}</span>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedProject ? selectedProject.toString() : 'all'}
                    onValueChange={(value) => setSelectedProject(value !== 'all' ? parseInt(value) : null)}
                  >

                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Switch
                    checked={showCompleted}
                    onCheckedChange={setShowCompleted}
                    id="show-completed"
                  />
                  <Label htmlFor="show-completed">Show Completed</Label>
                </div>
              </div>
              <DragDropContext onDragEnd={onDragEnd as OnDragEndResponder<string>}>
                <Droppable droppableId="tasks">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {filteredTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-start space-x-4 p-4 bg-card rounded-lg border border-border"
                            >
                              <Button
                                variant="outline"
                                size="icon"
                                className={`rounded-full ${task.status === 'Complete' ? 'bg-green-500 text-white' : ''}`}
                                onClick={() => toggleTaskStatus(task.id)}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </Button>
                              <div className="flex-1">
                                <h3 className={`font-semibold ${task.status === 'Complete' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'default' : 'secondary'}>
                                    {task.priority}
                                  </Badge>
                                  <Badge variant="outline">{task.status}</Badge>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    {task.due_date && (
                                      <span>{format(new Date(task.due_date), 'PP')}</span>
                                    )}
                                  </div>
                                  <div className="flex -space-x-2">
                                    {task.assignees.map((assignee, index) => (
                                      <Avatar key={index} className="border-2 border-background">
                                        <AvatarFallback>{assignee}</AvatarFallback>
                                      </Avatar>
                                    ))}
                                  </div>
                                  {task.project && (
                                    <Badge
                                      style={{
                                        backgroundColor: projects.find(p => p.name === task.project)?.color,
                                        color: '#fff'
                                      }}
                                    >
                                      {task.project}
                                    </Badge>
                                  )}
                                  {task.tags.map(tag => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                  ))}
                                  {task.recurrence && (
                                    <Badge variant="outline">
                                      <RepeatIcon className="h-4 w-4 mr-1" />
                                      {task.recurrence}
                                    </Badge>
                                  )}
                                </div>
                                <Accordion type="single" collapsible className="w-full mt-2">
                                  <AccordionItem value={`subtasks-${task.id}`}>
                                    <AccordionTrigger>Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})</AccordionTrigger>
                                    <AccordionContent>
                                      {task.subtasks.map(subtask => (
                                        <div key={subtask.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            checked={subtask.completed}
                                            onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                                          />
                                          <span className={subtask.completed ? 'line-through' : ''}>{subtask.title}</span>
                                        </div>
                                      ))}
                                      <Input
                                        className="mt-2"
                                        placeholder="Add subtask"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            addSubtask(task.id, e.currentTarget.value)
                                            e.currentTarget.value = ''
                                          }
                                        }}
                                      />
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVerticalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                      <EditIcon className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => deleteTask(task.id)}>
                                      <TrashIcon className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => toggleTimer(task.id)}
                                  >
                                    {activeTimer === task.id ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                                  </Button>
                                  <span className="text-sm font-mono">{formatTime(task.time_tracked)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <div className="mt-6 flex space-x-2">
                <Input
                  type="text"
                  placeholder="Add a new task"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <Button onClick={addTask}>
                  <PlusIcon className="h-4 w-4 mr-2" /> Add Task
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map(project => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle style={{ color: project.color }}>{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Tasks: {tasks.filter(t => t.project === project.name).length}</p>
                  <p>Completed: {tasks.filter(t => t.project === project.name && t.status === 'Complete').length}</p>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader>
                <CardTitle>Add New Project</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  addProject(formData.get('name') as string, formData.get('color') as string)
                  e.currentTarget.reset()
                }}>
                  <div className="space-y-2">
                    <Input name="name" placeholder="Project Name" required />
                    <Input name="color" type="color" required />
                    <Button type="submit">Add Project</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="tasks" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Time Tracked per Project</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="time" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <form onSubmit={(e) => {
              e.preventDefault()
              updateTask(editingTask)
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value) => setEditingTask({ ...editingTask, status: value as Task['status'] })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value) => setEditingTask({ ...editingTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">
                    Due Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`col-span-3 justify-start text-left font-normal ${!editingTask.due_date && "text-muted-foreground"
                          }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingTask.due_date ? format(new Date(editingTask.due_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editingTask.due_date)}
                        onSelect={(date) => setEditingTask({ ...editingTask, due_date: date?.toISOString() || new Date().toISOString() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="project" className="text-right">
                    Project
                  </Label>
                  <Select
                    value={editingTask.project}
                    onValueChange={(value) => setEditingTask({ ...editingTask, project: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recurrence" className="text-right">
                    Recurrence
                  </Label>
                  <Select
                    value={editingTask.recurrence || 'none'}
                    onValueChange={(value) => setEditingTask({ ...editingTask, recurrence: value !== 'none' ? value : null })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Importance
                  </Label>
                  <Slider
                    className="col-span-3"
                    value={[editingTask.importance]}
                    onValueChange={(value) => setEditingTask({ ...editingTask, importance: value[0] })}
                    max={10}
                    step={1}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Urgency
                  </Label>
                  <Slider
                    className="col-span-3"
                    value={[editingTask.urgency]}
                    onValueChange={(value) => setEditingTask({ ...editingTask, urgency: value[0] })}
                    max={10}
                    step={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="fixed bottom-4 right-4">
            <BookTemplateIcon className="h-4 w-4 mr-2" />
            Templates
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {templates.map(template => (
              <div key={template.id} className="flex justify-between items-center">
                <span>{template.name}</span>
                <Button onClick={() => applyTemplate(template.id)}>Apply</Button>
              </div>
            ))}
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              addTemplate(formData.get('name') as string, tasks.filter(t => t.status !== 'Complete'))
              e.currentTarget.reset()
            }}>
              <div className="flex space-x-2">
                <Input name="name" placeholder="New Template Name" required />
                <Button type="submit">Save Current Tasks as Template</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {isPomodoro && (
        <div className="fixed bottom-4 left-4 bg-card p-4 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">Pomodoro Timer</h3>
          <div className="text-2xl font-mono mb-2">{formatTime(pomodoroTime)}</div>
          <Button onClick={() => toggleTimer(0)}>
            {pomodoroRef.current ? <PauseIcon className="h-4 w-4 mr-2" /> : <PlayIcon className="h-4 w-4 mr-2" />}
            {pomodoroRef.current ? 'Pause' : 'Start'}
          </Button>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card p-2 rounded-full shadow-lg">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsPomodoro(!isPomodoro)}>
          {isPomodoro ? <TimerIcon className="h-6 w-6" /> : <ClockIcon className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}