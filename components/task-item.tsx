import { Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CheckIcon, EditIcon, MoreVerticalIcon, PauseIcon, PlayIcon, PlusIcon, RepeatIcon, TrashIcon, Wand2Icon } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';


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



interface TaskItemProps {
    task: Task;
    index: number;
    projects: Project[];
    toggleTaskStatus: (id: number) => void;
    deleteTask: (id: number) => void;
    setEditingTask: (task: Task | null) => void;
    updateTask: (task: Task) => void;
    generateSubtasks: (taskId: number) => void;
    activeTimer: number | null;
    toggleTimer: (taskId: number) => void;
    formatTime: (seconds: number) => string;
}

export default function TaskItem({
    task,
    index,
    projects,
    toggleTaskStatus,
    deleteTask,
    setEditingTask,
    updateTask,
    generateSubtasks,
    activeTimer,
    toggleTimer,
    formatTime,
}: TaskItemProps) {
    const [subtasks, setSubtasks] = useState(task.subtasks || []);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
    const [editedSubtaskTitle, setEditedSubtaskTitle] = useState('');

    const getSubtaskProgress = (subtasks: Subtask[]) => {
        const total = subtasks.length;
        const completed = subtasks.filter((sub) => sub.completed).length;
        return total > 0 ? (completed / total) * 100 : 0;
    };


    const addSubtask = () => {
        if (newSubtaskTitle.trim() === '') return;
        const newSubtask = {
            id: Date.now(),
            title: newSubtaskTitle,
            completed: false,
        };
        const updatedSubtasks = [...subtasks, newSubtask];
        setSubtasks(updatedSubtasks);
        setNewSubtaskTitle('');
        updateTask({ ...task, subtasks: updatedSubtasks });
    };

    // Function to toggle subtask completion
    const toggleSubtask = (subtaskId: number) => {
        const updatedSubtasks = subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        );
        setSubtasks(updatedSubtasks);
        updateTask({ ...task, subtasks: updatedSubtasks });
    };

    // Function to delete a subtask
    const deleteSubtask = (subtaskId: number) => {
        const updatedSubtasks = subtasks.filter((subtask) => subtask.id !== subtaskId);
        setSubtasks(updatedSubtasks);
        updateTask({ ...task, subtasks: updatedSubtasks });
    };

    const editSubtask = (subtaskId: number) => {
        const subtask = subtasks.find((subtask) => subtask.id === subtaskId);
        if (subtask) {
            setEditingSubtaskId(subtaskId);
            setEditedSubtaskTitle(subtask.title);
        }
    };

    const saveEditedSubtask = () => {
        const updatedSubtasks = subtasks.map((subtask) =>
            subtask.id === editingSubtaskId ? { ...subtask, title: editedSubtaskTitle } : subtask
        );
        setSubtasks(updatedSubtasks);
        updateTask({ ...task, subtasks: updatedSubtasks });
        setEditingSubtaskId(null);
        setEditedSubtaskTitle('');
    };

    return (
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
                        <h3
                            className={`font-semibold ${task.status === 'Complete' ? 'line-through text-muted-foreground' : ''
                                }`}
                        >
                            {task.title}
                        </h3>
                        {/* Task details like priority, status, due date, assignees, etc. */}
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

                        {/* Subtasks Accordion */}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${getSubtaskProgress(task.subtasks)}%` }}
                                ></div>
                            </div>
                        )}
                        <Accordion type="single" collapsible>
                            <AccordionItem value={`subtasks-${task.id}`}>
                                <AccordionTrigger>
                                    Subtasks ({subtasks.filter((st) => st.completed).length}/{subtasks.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="subtasks-list">
                                        {subtasks.map((subtask) => (
                                            <div key={subtask.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    checked={subtask.completed}
                                                    onCheckedChange={() => toggleSubtask(subtask.id)}
                                                />
                                                {editingSubtaskId === subtask.id ? (
                                                    <div className="flex items-center space-x-2">
                                                        <Input
                                                            value={editedSubtaskTitle}
                                                            onChange={(e) => setEditedSubtaskTitle(e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={saveEditedSubtask}>
                                                            Save
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <span className={subtask.completed ? 'line-through' : ''}>{subtask.title}</span>
                                                        <Button variant="ghost" size="icon" onClick={() => editSubtask(subtask.id)}>
                                                            <EditIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => deleteSubtask(subtask.id)}>
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {/* Add new subtask input */}
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Input
                                                placeholder="Add new subtask"
                                                value={newSubtaskTitle}
                                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addSubtask();
                                                    }
                                                }}
                                                className="flex-1"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => generateSubtasks(task.id)}
                                            >
                                                <Wand2Icon className="size-4" />
                                            </Button>

                                            <Button variant="outline" size="icon" onClick={addSubtask}>
                                                <PlusIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
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
                                <DropdownMenuItem onClick={() => generateSubtasks(task.id)}>
                                    <Wand2Icon className="mr-2 h-4 w-4" />
                                    Re-generate subtasks
                                </DropdownMenuItem>
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
                            <Button variant="outline" size="icon" onClick={() => toggleTimer(task.id)}>
                                {activeTimer === task.id ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                            </Button>
                            <span className="text-sm font-mono">{formatTime(task.time_tracked)}</span>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
