'use client'

import { useState, useEffect, useRef, useCallback, Fragment, useMemo } from 'react'
import { Task, TaskStatus, TaskPriority } from '@/lib/types'
import { CreateTaskButton } from './create-task-button'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { format, isAfter, isBefore, startOfToday, formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MoreVertical, 
  ArrowUpDown, 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown,
  Trash2,
  CheckSquare,
  XSquare,
  Calendar,
  AlertCircle,
  Pencil,
  Clock,
  Users,
  Copy,
  Link,
  MessageSquare,
  ArrowDownUp,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Check,
  Plus,
  Keyboard,
  GripVertical,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useHotkeys } from 'react-hotkeys-hook'
import { SavedFilters } from './saved-filters'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

interface TaskTableProps {
  initialTasks: Task[]
  userId: string
}

type SortConfig = {
  key: keyof Task
  direction: 'asc' | 'desc'
}

type Filters = {
  status: TaskStatus[]
  priority: TaskPriority[]
  dueDate: string
  search: string
}

interface SortableTaskRowProps extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'onSelect'> {
  task: Task
  selected: boolean
  onSelect: (taskId: string, checked: boolean) => void
  onEdit: (taskId: string, field: 'title' | 'description') => void
  onDelete: (taskId: string) => void
  isEditing: boolean
  editingField: 'title' | 'description' | null
  inputRef: React.RefObject<HTMLInputElement>
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onStatusChange: (taskId: string, checked: boolean) => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgent':
      return 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'High':
      return 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'Medium':
      return 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

const getDueDateStatus = (dueDate: string | null) => {
  if (!dueDate) return null
  const date = new Date(dueDate)
  const today = startOfToday()
  
  if (isBefore(date, today)) return 'overdue'
  if (isAfter(date, today)) return 'upcoming'
  return 'today'
}

function SortableTaskRow({
  task,
  selected,
  onSelect,
  onEdit,
  onDelete,
  isEditing,
  editingField,
  inputRef,
  textareaRef,
  onStatusChange,
  ...props
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        'group hover:bg-muted/50',
        selected && 'bg-muted',
        isDragging && 'cursor-grabbing'
      )}
      {...attributes}
      {...props}
    >
      <TableCell className="w-12">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(task.id, checked === true)}
          />
          <button
            className="cursor-grab opacity-0 group-hover:opacity-100 focus:opacity-100"
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === 'Complete'}
            onCheckedChange={(checked) => onStatusChange(task.id, checked === true)}
            className="mt-1"
          />
          <div className="min-w-[300px]">
            <div className="font-medium flex items-center gap-2">
              {isEditing && editingField === 'title' ? (
                <Input
                  ref={inputRef}
                  defaultValue={task.title}
                  className="h-7 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onEdit(task.id, 'title')
                    }
                  }}
                  onBlur={(e) => {
                    onEdit(task.id, 'title')
                  }}
                  autoFocus
                />
              ) : (
                <span 
                  className={`${task.status === 'Complete' ? 'line-through text-muted-foreground' : ''} cursor-pointer hover:text-primary`}
                  onClick={() => {
                    onEdit(task.id, 'title')
                  }}
                >
                  {task.title}
                </span>
              )}
              {task.priority === 'High' && (
                <Badge variant="destructive" className="h-5">High Priority</Badge>
              )}
            </div>
            
            {task.description ? (
              isEditing && editingField === 'description' ? (
                <Textarea
                  ref={textareaRef}
                  defaultValue={task.description}
                  className="mt-1 min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onEdit(task.id, 'description')
                    }
                  }}
                  onBlur={(e) => {
                    onEdit(task.id, 'description')
                  }}
                  autoFocus
                />
              ) : (
                <div 
                  className="text-sm text-muted-foreground line-clamp-1 mt-0.5 cursor-pointer hover:text-foreground"
                  onClick={() => {
                    onEdit(task.id, 'description')
                  }}
                >
                  {task.description}
                </div>
              )
            ) : (
              <div 
                className="text-sm text-muted-foreground mt-0.5 cursor-pointer hover:text-foreground"
                onClick={() => {
                  onEdit(task.id, 'description')
                }}
              >
                Add description...
              </div>
            )}

            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mt-2">
              {/* Task Metadata */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
                {task.time_tracked && task.time_tracked > 0 && (
                  <>
                    <span>•</span>
                    <span>{task.time_tracked}h tracked</span>
                  </>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {task.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="h-5 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Subtasks Progress */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>
                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                  </span>
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ 
                        width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Comments Count */}
              {/* Commenting out as comments_count doesn't exist on Task type */}
              {/* {task.comments_count && task.comments_count > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{task.comments_count}</span>
                </div>
              )} */}

              {/* Assignees */}
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex -space-x-2">
                  {task.assignees.slice(0, 3).map((assignee, index) => {
                    // Type assertion for assignee
                    const assigneeObj = typeof assignee === 'string' 
                      ? { id: assignee, full_name: assignee, avatar_url: undefined } 
                      : assignee as { id: string; full_name?: string; avatar_url?: string };
                    
                    return (
                      <Avatar 
                        key={index}
                        className="h-6 w-6 border-2 border-background"
                      >
                        <AvatarImage 
                          src={assigneeObj.avatar_url} 
                          alt={assigneeObj.full_name || 'User'} 
                        />
                        <AvatarFallback>
                          {(assigneeObj.full_name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {task.assignees.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                      +{task.assignees.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {task.project_details ? (
          <div className="flex flex-col gap-1">
            <Badge 
              variant="outline" 
              style={{ 
                backgroundColor: task.project_details.color + '10',
                borderColor: task.project_details.color
              }}
            >
              {task.project_details.name}
            </Badge>
            {task.project_details.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {task.project_details.description}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No Project</span>
        )}
      </TableCell>
      <TableCell>
        <Badge 
          className={`${getPriorityColor(task.priority)} min-w-[80px] justify-center`}
          variant="outline"
        >
          {task.priority}
        </Badge>
      </TableCell>
      <TableCell>
        {task.due_date ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${
                getDueDateStatus(task.due_date) === 'overdue' ? 'text-destructive' :
                getDueDateStatus(task.due_date) === 'today' ? 'text-orange-500' :
                'text-muted-foreground'
              }`} />
              <span className={
                getDueDateStatus(task.due_date) === 'overdue' ? 'text-destructive' :
                getDueDateStatus(task.due_date) === 'today' ? 'text-orange-500' :
                'text-muted-foreground'
              }>
                {format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            </div>
            {getDueDateStatus(task.due_date) === 'overdue' && (
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No due date</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={
          task.status === 'Complete' ? 'default' :
          task.status === 'In Progress' ? 'secondary' :
          task.status === 'In Review' ? 'outline' :
          'secondary'
        } className="min-w-[90px] justify-center">
          {task.status}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Clock className="h-4 w-4 mr-2" />
              Track Time
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Assign
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link className="h-4 w-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function TaskTable({ initialTasks, userId }: TaskTableProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [filters, setFilters] = useState<Filters>({
    status: [],
    priority: [],
    dueDate: 'all',
    search: searchQuery
  })
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc'
  })
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const [showDependencies, setShowDependencies] = useState(false)
  const [dependencyView, setDependencyView] = useState<{
    taskId: string | null,
    type: 'depends_on' | 'blocks'
  } | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'status' | 'priority'>('none')
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [taskOrder, setTaskOrder] = useState<string[]>(() => initialTasks.map(t => t.id))

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  )

  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data: newTask } = await supabase
            .from('tasks')
            .select(`*, project:projects(*)`)
            .eq('id', payload.new.id)
            .single()

          if (newTask) {
            const transformedTask = {
              ...newTask,
              project_details: newTask.project
            }
            setTasks(prev => [transformedTask, ...prev])
          }
        } else if (payload.eventType === 'UPDATE') {
          const { data: updatedTask } = await supabase
            .from('tasks')
            .select(`*, project:projects(*)`)
            .eq('id', payload.new.id)
            .single()

          if (updatedTask) {
            const transformedTask = {
              ...updatedTask,
              project_details: updatedTask.project
            }
            setTasks(prev =>
              prev.map(task => task.id === payload.new.id ? transformedTask : task)
            )
          }
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev =>
            prev.filter(task => task.id !== payload.old.id)
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Update filters when search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: searchQuery }))
  }, [searchQuery])

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setSearchQuery(newFilters.search)
  }

  const handleCreateTask = async (task: Partial<Task> = {}) => {
    try {
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: userId }])
        .select(`
          *,
          project:projects(*)
        `)
        .single()

      if (error) throw error

      if (newTask) {
        const transformedTask = {
          ...newTask,
          project_details: newTask.project
        }
        setTasks(prev => [transformedTask, ...prev])
        toast.success('Task created successfully')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const handleStatusChange = async (taskId: string, checked: boolean) => {
    const newStatus = checked ? 'Complete' : 'To Do' as TaskStatus
    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Optimistically update the UI
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates } as Task
          : task
      )
    )

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error
      toast.success(`Task marked as ${newStatus}`)
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
      
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: task.status } as Task
            : task
        )
      )
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Remove the task from local state
      setTasks(prev => prev.filter(task => task.id !== taskId))
      // Remove from selected tasks if it was selected
      setSelectedTasks(prev => prev.filter(id => id !== taskId))
      
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleSort = (key: keyof Task) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedTasks(checked ? filteredAndSortedTasks.map(t => t.id) : [])
  }

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => 
      checked ? [...prev, taskId] : prev.filter(id => id !== taskId)
    )
  }

  const handleBulkDelete = async () => {
    if (!selectedTasks.length) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', selectedTasks)

      if (error) throw error
      
      // Remove the tasks from local state
      setTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)))
      setSelectedTasks([])
      
      toast.success(`${selectedTasks.length} tasks deleted`)
    } catch (error) {
      console.error('Error deleting tasks:', error)
      toast.error('Failed to delete tasks')
    }
  }

  const handleBulkStatusChange = async (newStatus: 'Complete' | 'To Do') => {
    const loadingToast = toast.loading('Updating tasks...')
    
    // Optimistically update the UI
    const tasksToUpdate = selectedTasks
    setTasks(prevTasks => 
      prevTasks.map(task => 
        tasksToUpdate.includes(task.id) 
          ? {
              ...task,
              status: newStatus,
              updated_at: new Date().toISOString()
            }
          : task
      )
    )
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedTasks)

      if (error) throw error
      
      setSelectedTasks([])
      toast.dismiss(loadingToast)
      toast.success(`${selectedTasks.length} tasks marked as ${newStatus}`)
    } catch (error) {
      console.error('Error updating tasks:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to update tasks')
      
      // Revert optimistic update on error
      setTasks(prevTasks => 
        prevTasks.map(task => {
          const originalTask = tasks.find(t => t.id === task.id)
          return tasksToUpdate.includes(task.id) && originalTask
            ? originalTask
            : task
        })
      )
    }
  }

  const getSortIcon = (key: keyof Task) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const filteredAndSortedTasks = tasks
    .filter(task => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.project_details?.name.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.status.length && !filters.status.includes(task.status)) {
        return false
      }

      // Priority filter
      if (filters.priority.length && !filters.priority.includes(task.priority)) {
        return false
      }

      // Due date filter
      if (filters.dueDate !== 'all' && task.due_date) {
        const status = getDueDateStatus(task.due_date)
        if (status !== filters.dueDate) return false
      }

      return true
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime()
      }
      
      return sortConfig.direction === 'asc'
        ? (Number(aValue) || 0) - (Number(bValue) || 0)
        : (Number(bValue) || 0) - (Number(aValue) || 0)
    })

  const handleInlineEdit = async (taskId: string, field: 'title' | 'description', value: string) => {
    if (!value.trim()) return
    
    const updates = {
      [field]: value,
      updated_at: new Date().toISOString()
    }

    // Optimistically update the UI
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      )
    )

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error
      toast.success(`Task ${field} updated`)
    } catch (error) {
      console.error(`Error updating task ${field}:`, error)
      toast.error(`Failed to update task ${field}`)
      
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, [field]: task[field] }
            : task
        )
      )
    } finally {
      setEditingTask(null)
      setEditingField(null)
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent, taskId: string, field: 'title' | 'description') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value
      handleInlineEdit(taskId, field, value)
    } else if (e.key === 'Escape') {
      setEditingTask(null)
      setEditingField(null)
    }
  }, [])

  const handleAddDependency = async (sourceTaskId: string, targetTaskId: string) => {
    try {
      const { data: sourceTask } = await supabase
        .from('tasks')
        .select('dependencies')
        .eq('id', sourceTaskId)
        .single()

      const dependencies = sourceTask?.dependencies || []
      
      if (dependencies.includes(targetTaskId)) {
        toast.error('Dependency already exists')
        return
      }

      // Check for circular dependencies
      const { data: targetTask } = await supabase
        .from('tasks')
        .select('dependencies')
        .eq('id', targetTaskId)
        .single()

      if (targetTask?.dependencies?.includes(sourceTaskId)) {
        toast.error('Cannot create circular dependency')
        return
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          dependencies: [...dependencies, targetTaskId],
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceTaskId)

      if (error) throw error

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === sourceTaskId
            ? { ...task, dependencies: [...(task.dependencies || []), targetTaskId] }
            : task
        )
      )

      toast.success('Dependency added')
    } catch (error) {
      console.error('Error adding dependency:', error)
      toast.error('Failed to add dependency')
    }
  }

  const handleRemoveDependency = async (sourceTaskId: string, targetTaskId: string) => {
    try {
      const { data: sourceTask } = await supabase
        .from('tasks')
        .select('dependencies')
        .eq('id', sourceTaskId)
        .single()

      const dependencies = sourceTask?.dependencies?.filter((id: string) => id !== targetTaskId) || []

      const { error } = await supabase
        .from('tasks')
        .update({
          dependencies: dependencies,
          updated_at: new Date().toISOString()
        })
        .eq('id', sourceTaskId)

      if (error) throw error

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === sourceTaskId
            ? { ...task, dependencies }
            : task
        )
      )

      toast.success('Dependency removed')
    } catch (error) {
      console.error('Error removing dependency:', error)
      toast.error('Failed to remove dependency')
    }
  }

  const DependencyIndicator = ({ task }: { task: Task }) => {
    const dependsOn = tasks.filter(t => task.dependencies?.includes(t.id))
    const blockedBy = tasks.filter(t => t.dependencies?.includes(task.id))
    
    if (!dependsOn.length && !blockedBy.length) return null

    return (
      <div className="flex items-center gap-2 mt-2">
        {dependsOn.length > 0 && (
          <div className="flex items-center gap-1">
            <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Depends on: {dependsOn.map(t => t.title).join(', ')}
            </span>
          </div>
        )}
        {blockedBy.length > 0 && (
          <div className="flex items-center gap-1">
            <ArrowDownUp className="h-3 w-3 text-muted-foreground rotate-180" />
            <span className="text-xs text-muted-foreground">
              Blocks: {blockedBy.map(t => t.title).join(', ')}
            </span>
          </div>
        )}
      </div>
    )
  }

  useHotkeys('mod+k', () => {
    const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  }, [])

  useHotkeys('mod+n', (e) => {
    e.preventDefault()
    const createButton = document.querySelector('button[aria-label="Create Task"]') as HTMLButtonElement
    if (createButton) {
      createButton.click()
    }
  }, [])

  useHotkeys('mod+/', () => {
    setShowKeyboardShortcuts(true)
  }, [])

  useHotkeys('escape', () => {
    setEditingTask(null)
    setEditingField(null)
    setDependencyView(null)
    setShowKeyboardShortcuts(false)
  }, [])

  const KeyboardShortcutsDialog = () => (
    <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">⌘/Ctrl + K</div>
            <div className="text-sm text-muted-foreground">Focus search</div>
            <div className="text-sm">⌘/Ctrl + N</div>
            <div className="text-sm text-muted-foreground">Create new task</div>
            <div className="text-sm">⌘/Ctrl + /</div>
            <div className="text-sm text-muted-foreground">Show keyboard shortcuts</div>
            <div className="text-sm">Escape</div>
            <div className="text-sm text-muted-foreground">Cancel editing/Close dialogs</div>
            <div className="text-sm">Enter</div>
            <div className="text-sm text-muted-foreground">Save while editing</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const groupTasks = (tasks: Task[]) => {
    if (groupBy === 'none') return { 'All Tasks': tasks }

    return tasks.reduce((groups, task) => {
      let groupKey = ''
      switch (groupBy) {
        case 'project':
          groupKey = task.project_details?.name || 'No Project'
          break
        case 'status':
          groupKey = task.status
          break
        case 'priority':
          groupKey = task.priority
          break
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(task)
      return groups
    }, {} as Record<string, Task[]>)
  }

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  const updateTaskOrder = async (newOrder: string[]) => {
    try {
      // Create updates array with only position-related fields
      const updates = newOrder.map((taskId, index) => ({
        position_key: (index + 1).toString().padStart(8, '0'),
        updated_at: new Date().toISOString()
      }))

      // Update tasks in batches to avoid timeout
      const batchSize = 10
      for (let i = 0; i < updates.length; i += batchSize) {
        const batchIds = newOrder.slice(i, i + batchSize)
        const batchUpdates = updates.slice(i, i + batchSize)

        // Update each task in the batch individually
        for (let j = 0; j < batchIds.length; j++) {
          const { error } = await supabase
            .from('tasks')
            .update(batchUpdates[j])
            .eq('id', batchIds[j])
            .eq('user_id', userId)

          if (error) {
            console.error('Task update error:', error)
            throw error
          }
        }
      }

      // Update local state
      setTasks(prev => {
        const updatedTasks = [...prev]
        newOrder.forEach((taskId, index) => {
          const taskIndex = updatedTasks.findIndex(t => t.id === taskId)
          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = {
              ...updatedTasks[taskIndex],
              position_key: (index + 1).toString().padStart(8, '0'),
              updated_at: new Date().toISOString()
            }
          }
        })
        return updatedTasks.sort((a, b) => 
          (a.position_key || '').localeCompare(b.position_key || '')
        )
      })

      toast.success('Task order updated')
    } catch (error) {
      console.error('Error updating task order:', error)
      toast.error('Failed to update task order')
      
      // Revert the task order in the UI
      setTaskOrder(prev => [...prev])
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = taskOrder.indexOf(active.id as string)
      const newIndex = taskOrder.indexOf(over.id as string)

      const newOrder = arrayMove(taskOrder, oldIndex, newIndex)
      setTaskOrder(newOrder)
      updateTaskOrder(newOrder).catch(error => {
        console.error('Error in handleDragEnd:', error)
        // Revert the order if update fails
        setTaskOrder(taskOrder)
      })
    }

    setActiveId(null)
  }

  // Sort tasks based on taskOrder
  const sortedTasks = useMemo(() => {
    const taskMap = new Map(tasks.map(task => [task.id, task]))
    return taskOrder
      .map(id => taskMap.get(id))
      .filter((task): task is Task => task !== undefined)
  }, [tasks, taskOrder])

  // Update taskOrder when tasks change
  useEffect(() => {
    const newIds = tasks.map(t => t.id)
    setTaskOrder(prev => {
      const existingIds = new Set(prev)
      const addedIds = newIds.filter(id => !existingIds.has(id))
      const remainingIds = prev.filter(id => newIds.includes(id))
      return [...remainingIds, ...addedIds]
    })
  }, [tasks])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>

          <SavedFilters
            currentFilters={{
              status: filters.status,
              priority: filters.priority,
              search: filters.search
            }}
            onFilterSelect={(savedFilters) => {
              handleFiltersChange({
                ...filters,
                status: savedFilters.status,
                priority: savedFilters.priority,
                search: savedFilters.search
              })
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(filters.status.length > 0 || filters.priority.length > 0 || filters.dueDate !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.status.length + filters.priority.length + (filters.dueDate !== 'all' ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['To Do', 'In Progress', 'In Review', 'Complete'].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status.includes(status as TaskStatus)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      status: checked 
                        ? [...prev.status, status as TaskStatus]
                        : prev.status.filter(s => s !== status)
                    }))
                  }}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={filters.priority.includes(priority as TaskPriority)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      priority: checked 
                        ? [...prev.priority, priority as TaskPriority]
                        : prev.priority.filter(p => p !== priority)
                    }))
                  }}
                >
                  {priority}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Due Date</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { value: 'all', label: 'All' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'today', label: 'Due Today' },
                { value: 'upcoming', label: 'Upcoming' }
              ].map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.dueDate === option.value}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, dueDate: option.value }))
                    }
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Group By
                {groupBy !== 'none' && (
                  <Badge variant="secondary" className="ml-2">
                    {groupBy}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
              <DropdownMenuLabel>Group Tasks By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setGroupBy('none')}>
                None {groupBy === 'none' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('project')}>
                Project {groupBy === 'project' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('status')}>
                Status {groupBy === 'status' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('priority')}>
                Priority {groupBy === 'priority' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('Complete')}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('To Do')}
              >
                <XSquare className="mr-2 h-4 w-4" />
                Mark Todo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardShortcuts(true)}
          >
            <Keyboard className="mr-2 h-4 w-4" />
            Shortcuts
          </Button>

          <Button onClick={() => handleCreateTask()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            id="task-table-dnd"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedTasks.length === filteredAndSortedTasks.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('title')}>
                      Title {getSortIcon('title')}
                    </Button>
                  </TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('priority')}>
                      Priority {getSortIcon('priority')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('due_date')}>
                      Due Date {getSortIcon('due_date')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('status')}>
                      Status {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={sortedTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                  id="task-table-sortable"
                >
                  {sortedTasks.map((task) => (
                    <SortableTaskRow
                      key={task.id}
                      task={task}
                      selected={selectedTasks.includes(task.id)}
                      onSelect={handleSelectTask}
                      onStatusChange={handleStatusChange}
                      onEdit={(taskId, field) => {
                        setEditingTask(taskId)
                        setEditingField(field)
                      }}
                      onDelete={handleDelete}
                      isEditing={editingTask === task.id}
                      editingField={editingField}
                      inputRef={inputRef}
                      textareaRef={textareaRef}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </ScrollArea>
      </div>
      {dependencyView && (
        <Dialog open={!!dependencyView} onOpenChange={() => setDependencyView(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dependencyView.type === 'depends_on' ? 'Add Dependency' : 'Remove Dependency'}
              </DialogTitle>
              <DialogDescription>
                {dependencyView.type === 'depends_on'
                  ? 'Select a task that this task depends on'
                  : 'Select a dependency to remove'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {tasks
                .filter(t => t.id !== dependencyView.taskId)
                .map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => {
                      if (dependencyView.type === 'depends_on') {
                        handleAddDependency(dependencyView.taskId!, task.id)
                      } else {
                        handleRemoveDependency(dependencyView.taskId!, task.id)
                      }
                      setDependencyView(null)
                    }}
                  >
                    <span>{task.title}</span>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <KeyboardShortcutsDialog />
    </div>
  )
}

// Create the client-side only version
const TaskTableClient = dynamic(() => Promise.resolve(TaskTable), { ssr: false });

// Export the client-side only version
export { TaskTableClient as TaskTable };