import { useCallback, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wand2Icon } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import TaskItem from './task-item';
import { supabase } from '@/lib/supabase-browser';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { SearchBar } from './ui/searchbar';


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


interface TasksProps {
    taskList: Task[];
    projects: Project[];
    addTask: (title: string) => void;
    updateTask: (task: Task) => void;
    deleteTask: (id: number) => void;
    toggleTaskStatus: (id: number) => void;
    generateSubtasks: (taskId: number) => void;
    setEditingTask: (task: Task | null) => void;
    activeTimer: number | null;
    toggleTimer: (taskId: number) => void;
    formatTime: (seconds: number) => string;
    // Other necessary props
}
export default function Tasks({
    taskList,
    projects,
    addTask,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateTask,
    deleteTask,
    generateSubtasks,
    toggleTaskStatus,
    setEditingTask,
    activeTimer,
    toggleTimer,
    formatTime,
    // Other necessary props
}: TasksProps) {
    // Local state for filters, search, etc.
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState<number | null>(null);
    const [showCompleted, setShowCompleted] = useState(true);
    const [newTask, setNewTask] = useState('');


    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return taskList.filter(task => {
            if (filter !== 'all' && task.status !== filter) return false
            if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
            if (selectedProject && task.project !== projects.find(p => p.id === selectedProject)?.name) return false
            if (!showCompleted && task.status === 'Complete') return false
            return true
        })
    }, [taskList, filter, search, selectedProject, showCompleted, projects])

    const getStatusCount = useMemo(() =>
        (status: Task['status']) => taskList.filter(t => t.status === status).length,
        [taskList]);


    const onDragEnd = useCallback(async (result: DropResult) => {
        if (!result.destination) return;

        const newTasks = Array.from(taskList);
        const [reorderedTask] = newTasks.splice(result.source.index, 1);
        newTasks.splice(result.destination.index, 0, reorderedTask);

        // Update the order in Supabase
        const { error } = await supabase
            .from('tasks')
            .update({ order: result.destination.index })
            .eq('id', reorderedTask.id);

        if (error) {
            console.error('Error updating task order:', error);
        }
    }, [taskList]);

    return (
        <div className="bg-card rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                {/* Quick ajust task with AI */}
                <div className="flex items-center space-x-2 mb-6">
                    <Input
                        type="text"
                        placeholder="What needs to be done?"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                addTask(newTask);
                                setNewTask(''); // Clear the input field
                            }
                        }}
                        className="flex-grow"
                    />
                    <Button
                        onClick={() => {
                            addTask(newTask);
                            setNewTask('');
                        }}
                        size="icon">
                        <Wand2Icon className="size-4" />
                    </Button>
                </div>
                {/* Filter tasks */}
                <div className="flex flex-wrap justify-between items-center mb-6">
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
                        <SearchBar search={search} setSearch={setSearch} />
                        <Input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="hidden"
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
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={showCompleted}
                            onCheckedChange={setShowCompleted}
                            id="show-completed"
                        />
                        <Label htmlFor="show-completed">Show Completed</Label>
                    </div>
                </div>
                {/* Task List */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="tasks">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                {filteredTasks.map((task, index) => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        projects={projects}
                                        toggleTaskStatus={toggleTaskStatus}
                                        deleteTask={deleteTask}
                                        setEditingTask={setEditingTask}
                                        updateTask={updateTask}
                                        generateSubtasks={() => generateSubtasks(task.id)}
                                        activeTimer={activeTimer}
                                        toggleTimer={toggleTimer}
                                        formatTime={formatTime}
                                    />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

            </div>
        </div>
    );
}


