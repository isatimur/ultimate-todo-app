'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { TabsContent } from './ui/tabs';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import Header from './header';
import { isAfter, addDays } from 'date-fns';
import Analytics from './analytics';
import Dashboard from './dashboard';

import PomodoroTimer from './pomodoro-timer';
import Projects from './projects';
import TabsNavigation from './tabs-navigation';
import TaskEditorDialog from './task-editor-dialog';
import Tasks from './tasks';
import TemplatesDialog from './templates-dialog';
import { supabase } from '@/lib/supabase-browser';
import { ClockIcon } from 'lucide-react';
import { TimerIcon } from 'lucide-react';
import { toast } from 'sonner';



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
  id: number;
  name: string;
  color: string;
  user_id: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [activeTimer, setActiveTimer] = useState<number | null>(null)
  const [selectedProject] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [isPomodoro, setIsPomodoro] = useState(false)
  const [theme, setTheme] = useState('default')
  const [aiSuggestion, setAiSuggestion] = useState('')

  const pomodoroRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

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
        .select(`
          *,
          team:teams(*)
        `)
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


  return (
    <div className={`max-w-7xl mx-auto p-4 min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} setTheme={setTheme} />
      <TabsNavigation activeTab={activeTab} onValueChange={handleTabChange}>
        <TabsContent value="dashboard">
          <Dashboard
            chartData={chartData}
            aiSuggestion={aiSuggestion}
            getAISuggestions={getAISuggestions}
            applyAISuggestion={applyAISuggestion}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <Tasks
            taskList={tasks}
            projects={projects}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            toggleTaskStatus={toggleTaskStatus}
            generateSubtasks={generateSubtasks}
            setEditingTask={setEditingTask}
            activeTimer={activeTimer}
            toggleTimer={toggleTimer}
            formatTime={formatTime}
          />
        </TabsContent>
        <TabsContent value="projects">
          <Projects projects={projects} tasks={tasks} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} />
        </TabsContent>
        <TabsContent value="analytics">
          <Analytics productivityData={productivityData} projectTimeData={projectTimeData} />
        </TabsContent>
      </TabsNavigation>
      <TaskEditorDialog
        editingTask={editingTask}
        setEditingTask={setEditingTask}
        updateTask={updateTask}
        projects={projects}
      />
      <TemplatesDialog
        templates={templates}
        applyTemplate={applyTemplate}
        addTemplate={addTemplate}
        tasks={tasks}
      />
      <PomodoroTimer
        isPomodoro={isPomodoro}
        pomodoroTime={pomodoroTime}
        pomodoroRef={pomodoroRef}
        toggleTimer={toggleTimer}
        formatTime={formatTime}
      />
      {/* Pomodoro toggle button */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-card p-2 rounded-full shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setIsPomodoro(!isPomodoro)}
        >
          {isPomodoro ? <TimerIcon className="h-6 w-6" /> : <ClockIcon className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
}
