import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@radix-ui/react-label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { Input } from './ui/input';
import { format } from "date-fns"
import { Slider } from './ui/slider';



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


interface TaskEditorDialogProps {
    editingTask: Task | null;
    setEditingTask: (task: Task | null) => void;
    updateTask: (task: Task) => void;
    projects: Project[];
}

export default function TaskEditorDialog({
    editingTask,
    setEditingTask,
    updateTask,
    projects,
}: TaskEditorDialogProps) {
    if (!editingTask) return null;

    return (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        updateTask(editingTask);
                    }}
                >
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
                        <Button variant="secondary" onClick={() => setEditingTask(null)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
