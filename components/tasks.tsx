"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Column, Task, TaskStatus, TaskPriority, View } from '@/lib/types';
import { useUser } from '@/lib/hooks/useUser';
import { BoardView } from './board-view';
import { CalendarView } from './calendar-view';
import { GanttView } from './gantt-view';
import { TableView } from './table-view';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
    Plus, 
    Search, 
    Calendar, 
    LayoutGrid, 
    List, 
    GanttChart,
    Filter,
    SlidersHorizontal,
    Clock,
    Tag,
    FolderIcon
} from 'lucide-react';
import { Badge } from './ui/badge';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { useVirtualizer } from '@tanstack/react-virtual';
import TaskItem from './task-item';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { ListView } from './list-view';

interface TasksProps {
    initialTasks?: Task[];
    projects: ProjectType[];
    addTask: (task: Partial<Task>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    generateSubtasks: (taskId: string) => Promise<void>;
    toggleTaskStatus: (id: string) => Promise<void>;
    setEditingTask: (task: Task | null) => void;
    activeTimer: string | null;
    toggleTimer: (taskId: string) => void;
    formatTime: (seconds: number) => string;
}

export function Tasks({
    initialTasks = [],
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
}: TasksProps) {
    const [mounted, setMounted] = useState(false)
    const { user } = useUser();
    const [view, setView] = useState<View>('board');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
    const [selectedPriority, setSelectedPriority] = useState<'all' | TaskPriority>('all');
    const [selectedProject, setSelectedProject] = useState<string | 'all'>('all');
    const [selectedDateRange, setSelectedDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: undefined,
        to: undefined
    });
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const parentRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Get unique tags from all tasks
    const allTags = useMemo(() => 
        Array.from(new Set(tasks.flatMap(task => task.tags || []))),
        [tasks]
    );

    // Memoize filtered tasks to prevent unnecessary recalculations
    const filteredTasks = useMemo(() => 
        tasks.filter((task) => {
            const matchesSearch =
                task.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                task.description?.toLowerCase().includes(debouncedSearch.toLowerCase());

            const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
            const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
            const matchesProject = selectedProject === 'all' || task.project === selectedProject;
            
            const matchesDateRange = !selectedDateRange.from || !selectedDateRange.to || (
                task.due_date && 
                new Date(task.due_date) >= selectedDateRange.from &&
                new Date(task.due_date) <= selectedDateRange.to
            );

            const matchesTags = selectedTags.length === 0 || 
                (task.tags && selectedTags.every(tag => task.tags.includes(tag)));

            return matchesSearch && matchesStatus && matchesPriority && 
                   matchesProject && matchesDateRange && matchesTags;
        }),
        [
            tasks,
            debouncedSearch,
            selectedStatus,
            selectedPriority,
            selectedProject,
            selectedDateRange.from,
            selectedDateRange.to,
            selectedTags
        ]
    );

    const virtualizer = useVirtualizer({
        count: filteredTasks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: 10,
        measureElement: true,
        scrollPaddingStart: 8,
        scrollPaddingEnd: 8,
        initialRect: { width: 0, height: 0 },
    });

    // Add a resize observer to handle window resizing
    useEffect(() => {
        if (!parentRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            virtualizer.measure();
        });

        resizeObserver.observe(parentRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [virtualizer]);

    // Add smooth scrolling when tasks change
    useEffect(() => {
        virtualizer.measure();
    }, [filteredTasks, virtualizer]);

    const fetchTasks = useCallback(async () => {
        if (!user) return;
    
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Memoize task status groupings
    const tasksByStatus = useMemo(() => ({
        'To Do': filteredTasks.filter((task) => task.status === 'To Do'),
        'In Progress': filteredTasks.filter((task) => task.status === 'In Progress'),
        'In Review': filteredTasks.filter((task) => task.status === 'In Review'),
        'Complete': filteredTasks.filter((task) => task.status === 'Complete'),
    }), [filteredTasks]);

    const getProjectStats = useCallback((projectId: string) => {
        const projectTasks = tasks.filter(t => t.project === projectId);
        return {
            total: projectTasks.length,
            completed: projectTasks.filter(t => t.status === 'Complete').length,
            inProgress: projectTasks.filter(t => t.status === 'In Progress').length,
            timeTracked: projectTasks.reduce((acc, t) => acc + (t.time_tracked || 0), 0)
        };
    }, [tasks]);

    const handleCreateTask = async () => {
        const selectedProjectData = selectedProject !== 'all' 
            ? projects.find(p => p.id === selectedProject)
            : undefined;

        const newTask: Partial<Task> = {
            title: 'New Task',
            status: 'To Do',
            priority: 'Medium',
            due_date: new Date().toISOString(),
            user_id: user?.id,
            description: '',
            subtasks: [],
            time_tracked: 0,
            project_id: selectedProjectData?.id,
            project_name: selectedProjectData?.name,
            tags: [],
            dependencies: [],
            recurrence: null,
        };

        try {
            await addTask(newTask);
            toast.success('Task created successfully');
        } catch (error) {
            toast.error('Failed to create task');
            console.error('Error creating task:', error);
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;
        
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        
        if (sourceIndex === destinationIndex) return;
        
        const updatedTasks = Array.from(filteredTasks);
        const [removed] = updatedTasks.splice(sourceIndex, 1);
        updatedTasks.splice(destinationIndex, 0, removed);
        
        // Update task positions in the database
        const updatedTask = {
            ...removed,
            position: destinationIndex,
            status: result.destination.droppableId as TaskStatus // Add status update for board view
        };
        
        // Update the tasks state
        setTasks(prevTasks => {
            const newTasks = [...prevTasks];
            const taskIndex = newTasks.findIndex(t => t.id === removed.id);
            if (taskIndex !== -1) {
                newTasks.splice(taskIndex, 1);
                newTasks.splice(destinationIndex, 0, updatedTask);
            }
            return newTasks;
        });

        // Persist the change
        updateTask(updatedTask).catch(error => {
            console.error('Failed to update task position:', error);
            toast.error('Failed to update task position');
            // Revert the change in case of error
            setTasks(prevTasks => [...prevTasks]);
        });
    };

    const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const updatedTask = {
                ...task,
                status: newStatus,
                completed: newStatus === 'Complete'
            };

            await updateTask(updatedTask);
            toast.success(`Task moved to ${newStatus}`);
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Failed to update task status');
        }
    };

    const clearFilters = () => {
        setSelectedStatus('all');
        setSelectedPriority('all');
        setSelectedProject('all');
        setSelectedDateRange({ from: undefined, to: undefined });
        setSelectedTags([]);
        setSearchQuery('');
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (selectedStatus !== 'all') count++;
        if (selectedPriority !== 'all') count++;
        if (selectedProject !== 'all') count++;
        if (selectedDateRange.from && selectedDateRange.to) count++;
        if (selectedTags.length > 0) count++;
        if (searchQuery) count++;
        return count;
    };

    const handleProjectChange = (projectId: string) => {
        setSelectedProject(projectId);
        if (projectId !== 'all') {
            localStorage.setItem('lastSelectedProject', projectId);
        } else {
            localStorage.removeItem('lastSelectedProject');
        }
    };

    useEffect(() => {
        const lastProject = localStorage.getItem('lastSelectedProject');
        if (lastProject && projects.some(p => p.id === lastProject)) {
            setSelectedProject(lastProject);
        }
    }, [projects]);

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="space-y-4 p-4">
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-[400px] bg-muted/30 rounded-lg animate-pulse" />
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {selectedProject !== 'all' && (
                            <div className="flex items-center">
                                <Badge 
                                    variant="outline"
                                    className="flex items-center gap-1 px-3 py-1"
                                    style={{
                                        backgroundColor: projects.find(p => p.id === selectedProject)?.color,
                                        color: '#fff'
                                    }}
                                >
                                    <FolderIcon className="w-4 h-4" />
                                    {selectedProject}
                                </Badge>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedProject('all')}
                                    className="ml-2"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                        <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {filteredTasks.length} tasks • {tasksByStatus['Complete'].length} completed
                        {selectedProject !== 'all' && (
                            <>
                                {' • '}
                                {getProjectStats(selectedProject).inProgress} in progress
                                {' • '}
                                {formatTime(getProjectStats(selectedProject).timeTracked)} tracked
                            </>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-[250px]"
                        />
                    </div>

                    <Popover open={showFilters} onOpenChange={setShowFilters}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                                {getActiveFilterCount() > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {getActiveFilterCount()}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-4" align="end">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Project</h4>
                                    <Select value={selectedProject} onValueChange={handleProjectChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key="all" value="all">All Projects</SelectItem>
                                            {projects.map(project => (
                                                <SelectItem 
                                                    key={`project-${project.id}`}
                                                    value={project.id}
                                                >
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-2 h-2 rounded-full mr-2"
                                                            style={{ backgroundColor: project.color }}
                                                        />
                                                        {project.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Status</h4>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="To Do">To Do</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="In Review">In Review</SelectItem>
                                            <SelectItem value="Complete">Complete</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Priority</h4>
                                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priorities</SelectItem>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Due Date</h4>
                                    <DatePickerWithRange 
                                        value={selectedDateRange}
                                        onChange={setSelectedDateRange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map(tag => (
                                            <Badge
                                                key={`tag-${tag}`}
                                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    setSelectedTags(prev =>
                                                        prev.includes(tag)
                                                            ? prev.filter(t => t !== tag)
                                                            : [...prev, tag]
                                                    );
                                                }}
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-between">
                                    <Button
                                        variant="ghost"
                                        onClick={clearFilters}
                                        className="text-sm"
                                    >
                                        Reset filters
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => setShowFilters(false)}
                                        className="text-sm"
                                    >
                                        Apply filters
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button onClick={handleCreateTask}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                    </Button>
                </div>
            </div>

            <Tabs value={view} onValueChange={(v) => setView(v as View)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="board" className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" />
                        Board
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        List
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Calendar
                    </TabsTrigger>
                    <TabsTrigger value="gantt" className="flex items-center gap-2">
                        <GanttChart className="w-4 h-4" />
                        Gantt
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {view === 'list' && (
                        <ListView
                            key="list-view"
                            tasks={filteredTasks}
                            projects={projects}
                            onTaskUpdate={async (taskId, updates) => {
                                const task = tasks.find(t => t.id === taskId);
                                if (task) {
                                    await updateTask({ ...task, ...updates });
                                }
                            }}
                            onTaskDelete={deleteTask}
                            setEditingTask={setEditingTask}
                            onAddTask={addTask}
                            generateSubtasks={generateSubtasks}
                        />
                    )}
                    {view === 'calendar' && (
                        <CalendarView
                            key="calendar-view"
                            tasks={filteredTasks}
                            onTaskUpdate={updateTask}
                        />
                    )}
                    {view === 'gantt' && (
                        <GanttView
                            key="gantt-view"
                            tasks={filteredTasks}
                            onTaskUpdate={updateTask}
                        />
                    )}
                    {view === 'board' && (
                        <BoardView
                            key="board-view"
                            tasks={filteredTasks}
                            onTaskUpdate={async (taskId, updates) => {
                                const task = tasks.find(t => t.id === taskId);
                                if (task) {
                                    await updateTask({ ...task, ...updates });
                                }
                            }}
                            onTaskDelete={deleteTask}
                            onTaskStatusChange={handleTaskStatusChange}
                            projects={projects}
                            onAddTask={addTask}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}


