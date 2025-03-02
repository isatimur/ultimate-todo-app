import React, { useState, useEffect, useCallback } from 'react'
import { Task, TaskPriority, TaskStatus, Team, TeamMember, ProjectType } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  EditIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
  AlertCircleIcon,
  ClockIcon,
  Plus,
  Wand2,
  ListPlus,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  Play,
  Circle,
  ArrowRightCircle,
  MoreHorizontal,
  Copy,
  Trash,
  Edit,
  UserIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { QuickAddTask } from './quick-add-task'
import { useHotkeys } from 'react-hotkeys-hook'
import { useToast } from '@/components/ui/use-toast'
import { motion } from 'framer-motion'

interface ListViewProps {
  tasks: Task[]
  projects: ProjectType[]
  team?: Team
  currentMember?: TeamMember
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskDelete: (id: string) => Promise<void>
  setEditingTask: (task: Task | null) => void
  isLoading?: boolean
  onAddTask: (task: Partial<Task>) => Promise<void>
  generateSubtasks?: (taskId: string) => Promise<void>
  regenerateTask?: (taskId: string) => Promise<void>
  teamMembers?: TeamMember[]
}

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Task>) => Promise<void>;
}

function EditTaskDialog({ task, open, onOpenChange, onSave }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const handleSave = async () => {
    await onSave({
      title,
      description,
      priority,
      due_date: dueDate,
      status,
      updated_at: new Date().toISOString()
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
              <SelectTrigger>
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
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
              <SelectTrigger>
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
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate.split('T')[0]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ListView({ 
  tasks, 
  projects = [],
  team,
  currentMember,
  teamMembers,
  onTaskUpdate, 
  onTaskDelete, 
  setEditingTask,
  isLoading = false,
  onAddTask,
  generateSubtasks,
  regenerateTask
}: ListViewProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{taskId: string, checked: boolean} | null>(null);
  const { toast } = useToast();

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Keyboard shortcuts
  useHotkeys('ctrl+a', (e) => {
    e.preventDefault();
    setSelectedTasks(tasks.map(t => t.id));
  });

  useHotkeys('escape', () => {
    setSelectedTasks([]);
  });

  useHotkeys('delete', () => {
    if (selectedTasks.length > 0) {
      handleBatchDelete();
    }
  });

  useEffect(() => {
    if (pendingStatusUpdate) {
      const updateStatus = async () => {
        try {
          const task = tasks.find(t => t.id === pendingStatusUpdate.taskId);
          if (!task) return;

          const newStatus = pendingStatusUpdate.checked ? 'Complete' : 'To Do';
          await onTaskUpdate(task.id, { 
            status: newStatus,
            updated_at: new Date().toISOString()
          });
          toast({
            title: 'Success',
            description: `Task marked as ${pendingStatusUpdate.checked ? 'complete' : 'to do'}`
          });
        } catch (error) {
          console.error('Error updating task status:', error);
          toast({
            title: 'Error',
            description: 'Failed to update task status',
            variant: 'destructive'
          });
        } finally {
          setPendingStatusUpdate(null);
        }
      };
      updateStatus();
    }
  }, [pendingStatusUpdate, tasks, onTaskUpdate, toast]);

  const handleStatusChange = useCallback((task: Task, checked: boolean) => {
    setPendingStatusUpdate({ taskId: task.id, checked });
  }, []);

  const handleSort = (key: keyof Task) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const sortedTasks = React.useMemo(() => {
    if (!sortConfig) return localTasks;

    return [...localTasks].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [localTasks, sortConfig]);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  // Check if user has permission to perform actions
  const canManageTasks = currentMember?.role === 'owner' || currentMember?.role === 'admin';
  const canDeleteTasks = currentMember?.role === 'owner' || currentMember?.role === 'admin';
  const canAssignTasks = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  // Filter tasks based on team settings if they exist
  const availableStatuses = team?.settings?.task_statuses || ['To Do', 'In Progress', 'In Review', 'Complete'];
  const availablePriorities = team?.settings?.task_priorities || ['Low', 'Medium', 'High', 'Urgent'];

  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (!availableStatuses.includes(newStatus)) {
      toast({
        title: 'Error',
        description: 'Invalid status for this team',
        variant: 'destructive'
      });
      return;
    }

    // Optimistically update the UI
    const updatedTasks = localTasks.map(t => 
      t.id === task.id 
        ? {
            ...t,
            status: newStatus,
            updated_at: new Date().toISOString()
        }
        : t
    );
    setLocalTasks(updatedTasks);

    try {
      await onTaskUpdate(task.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      toast({
        title: 'Success',
        description: `Task status changed to ${newStatus}`
      });
    } catch (error) {
      // Revert on error
      setLocalTasks(tasks);
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!canDeleteTasks) {
      toast({
        title: 'Error',
        description: 'You do not have permission to delete tasks',
        variant: 'destructive'
      });
      return;
    }

    // Optimistically update the UI
    const updatedTasks = localTasks.filter(t => t.id !== taskId);
    setLocalTasks(updatedTasks);

    try {
      await onTaskDelete(taskId);
      toast({
        title: 'Success',
        description: 'Successfully deleted the task'
      });
    } catch (error) {
      // Revert on error
      setLocalTasks(tasks);
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      });
    }
  };

  const handleSubtaskStatusChange = async (taskId: string, subtaskId: string, checked: boolean) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.subtasks) return;

      const updatedSubtasks = task.subtasks.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, completed: checked } : subtask
      );

      const allSubtasksComplete = updatedSubtasks.every(st => st.completed);
      
      await onTaskUpdate(taskId, { 
        subtasks: updatedSubtasks,
        status: allSubtasksComplete ? 'Complete' : 'To Do',
        updated_at: new Date().toISOString()
      });
      
      toast({
        title: 'Success',
        description: `Subtask marked as ${checked ? 'complete' : 'incomplete'}`
      });
    } catch (error) {
      console.error('Error updating subtask status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subtask status',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateSubtasks = async (taskId: string) => {
    try {
      if (!generateSubtasks) return;
      await generateSubtasks(taskId);
      toast({
        title: 'Success',
        description: 'Generated subtasks successfully'
      });
    } catch (error) {
      console.error('Error generating subtasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate subtasks',
        variant: 'destructive'
      });
    }
  };

  const handleRegenerateTask = async (taskId: string) => {
    try {
      if (!regenerateTask) return;
      await regenerateTask(taskId);
      toast({
        title: 'Success',
        description: 'Task regenerated successfully'
      });
    } catch (error) {
      console.error('Error regenerating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate task',
        variant: 'destructive'
      });
    }
  };

  const getProjectDetails = (projectId?: string): ProjectType | null => {
    if (!projectId || !Array.isArray(projects)) return null;
    return projects.find(p => p.id === projectId) || null;
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Task }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronUpIcon className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  const handleBatchStatusUpdate = async (status: TaskStatus) => {
    // Optimistically update the UI
    const updatedTasks = localTasks.map(task => 
      selectedTasks.includes(task.id)
        ? {
            ...task,
            status,
            updated_at: new Date().toISOString()
        }
        : task
    );
    setLocalTasks(updatedTasks);

    try {
      await Promise.all(
        selectedTasks.map(taskId => 
          onTaskUpdate(taskId, { 
            status,
            updated_at: new Date().toISOString()
          })
        )
      );
      toast({
        title: 'Success',
        description: `Successfully updated ${selectedTasks.length} tasks`
      });
      setSelectedTasks([]);
    } catch (error) {
      // Revert on error
      setLocalTasks(tasks);
      console.error('Error updating tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tasks',
        variant: 'destructive'
      });
    }
  };

  const handleBatchDelete = async () => {
    if (!canDeleteTasks) {
      toast({
        title: 'Error',
        description: 'You do not have permission to delete tasks',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) {
      return;
    }

    // Optimistically update the UI
    const updatedTasks = localTasks.filter(task => !selectedTasks.includes(task.id));
    setLocalTasks(updatedTasks);

    try {
      await Promise.all(selectedTasks.map(taskId => onTaskDelete(taskId)));
      toast({
        title: 'Success',
        description: `Successfully deleted ${selectedTasks.length} tasks`
      });
      setSelectedTasks([]);
    } catch (error) {
      // Revert on error
      setLocalTasks(tasks);
      console.error('Error deleting tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tasks',
        variant: 'destructive'
      });
    }
  };

  const handleBatchPriorityUpdate = async (priority: TaskPriority) => {
    try {
      await Promise.all(
        selectedTasks.map(taskId => 
          onTaskUpdate(taskId, { 
            priority,
            updated_at: new Date().toISOString()
          })
        )
      );
      toast({
        title: 'Success',
        description: `Successfully updated priority for ${selectedTasks.length} tasks`
      });
      setSelectedTasks([]);
    } catch (error) {
      console.error('Error updating tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tasks',
        variant: 'destructive'
      });
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    try {
      const { id, created_at, updated_at, ...taskToDuplicate } = task;
      await onAddTask({
        ...taskToDuplicate,
        title: `${task.title} (Copy)`,
        status: 'To Do',
      });
      toast({
        title: 'Success',
        description: 'Successfully created a copy of the task'
      });
    } catch (error) {
      console.error('Error duplicating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate task',
        variant: 'destructive'
      });
    }
  };

  // Add assignee column and functionality
  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return null;
    const member = teamMembers?.find(m => m.user_id === assigneeId);
    return member?.user.full_name || 'Unknown User';
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-muted rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <ClockIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">No tasks yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first task to get started
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">{team?.name} - Tasks</h2>
          {selectedTasks.length > 0 && canManageTasks && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedTasks.length} selected
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Batch Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Update Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleBatchStatusUpdate('To Do')}>
                        To Do
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBatchStatusUpdate('In Progress')}>
                        In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBatchStatusUpdate('Complete')}>
                        Complete
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Update Priority
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleBatchPriorityUpdate('High')}>
                        High
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBatchPriorityUpdate('Medium')}>
                        Medium
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBatchPriorityUpdate('Low')}>
                        Low
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={handleBatchDelete}
                  >
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {(currentMember?.role === 'owner' || currentMember?.role === 'admin' || currentMember?.role === 'member') && (
          <QuickAddTask onAddTask={(task) => onAddTask({ ...task, team_id: team?.id })} />
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedTasks.length === tasks.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTasks(tasks.map(t => t.id));
                  } else {
                    setSelectedTasks([]);
                  }
                }}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer group"
              onClick={() => handleSort('title')}
            >
              <div className="flex items-center gap-2">
                Title
                <SortIcon columnKey="title" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer group"
              onClick={() => handleSort('priority')}
            >
              <div className="flex items-center gap-2">
                Priority
                <SortIcon columnKey="priority" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer group"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon columnKey="status" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer group"
              onClick={() => handleSort('due_date')}
            >
              <div className="flex items-center gap-2">
                Due Date
                <SortIcon columnKey="due_date" />
              </div>
            </TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => {
            const project = getProjectDetails(task.project);
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Complete';

            return (
              <TableRow 
                key={task.id}
                className={cn(
                  "group hover:bg-muted/50 transition-colors",
                  task.status === 'Complete' && "bg-muted/20"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTasks([...selectedTasks, task.id]);
                      } else {
                        setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuickStatusChange(
                              task,
                              task.status === 'Complete' ? 'To Do' :
                              task.status === 'To Do' ? 'In Progress' :
                              'Complete'
                            )}
                          >
                            {task.status === 'Complete' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : task.status === 'In Progress' ? (
                              <Play className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Click to mark as {
                            task.status === 'Complete' ? 'to do' :
                            task.status === 'To Do' ? 'in progress' :
                            'complete'
                          }
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className={cn(
                      task.status === 'Complete' && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    task.priority === 'High' ? 'destructive' :
                    task.priority === 'Medium' ? 'default' :
                    'secondary'
                  }>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    task.status === 'Complete' && "bg-green-500/10 text-green-500 border-green-500/20",
                    task.status === 'In Progress' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    task.status === 'In Review' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  )}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {task.due_date ? (
                      <span className={cn(
                        "text-sm",
                        isOverdue && "text-destructive"
                      )}>
                        {format(new Date(task.due_date), 'PP')}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No due date</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {project ? (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${project.color}20`,
                        color: project.color,
                        borderColor: `${project.color}40`
                      }}
                    >
                      {project.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No project</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.tags && task.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getAssigneeName(task.assignees[0])}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canManageTasks && (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() => handleDuplicateTask(task)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Duplicate task
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <ArrowRightCircle className="h-4 w-4 mr-2" />
                                Move to
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {availableStatuses.map(status => (
                                  <DropdownMenuItem 
                                    key={status}
                                    onClick={() => handleQuickStatusChange(task, status as TaskStatus)}
                                  >
                                    {status}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            {canAssignTasks && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <UserIcon className="h-4 w-4 mr-2" />
                                  Assign to
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {teamMembers?.map(member => (
                                    <DropdownMenuItem 
                                      key={member.id}
                                      onClick={() => onTaskUpdate(task.id, { assignees: [member.user_id] })}
                                    >
                                      {member.user.full_name}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => onTaskUpdate(task.id, { assignees: [] })}
                                  >
                                    Unassign
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                            <DropdownMenuItem onClick={() => handleDuplicateTask(task)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {canDeleteTasks && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-destructive"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}