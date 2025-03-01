"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Task } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, ChevronRight, Filter, Plus, Pencil, Trash2, Clock, Search, CalendarIcon } from 'lucide-react'
import { CreateTaskDialog } from './create-task-dialog'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd'
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { MiniMonth } from './mini-month'
import { TaskLegend } from './task-legend'
import { WeekView } from './week-view'
import { QuickAddTask } from './quick-add-task'
import { TaskDetails } from './task-details'
import { TaskStatistics } from './task-statistics'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday as dateFnsIsToday, isSameDay, addMonths, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'
import { QuickAddTaskBar } from './quick-add-task-bar'
import { toast } from 'sonner'
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { enUS } from 'date-fns/locale'
import { QuickAddTaskNatural } from './quick-add-task-natural'

interface CalendarViewProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onTaskDelete: (id: string) => Promise<void>
  onAddTask: (task: Partial<Task>) => Promise<void>
  projects: any[]
}

interface TaskItemProps {
  task: Task;
  onSelect: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  compact?: boolean;
}

function TaskItem({ task, onSelect, onUpdate, onDelete, compact = false }: TaskItemProps) {
  const priorityColors = {
    Low: "bg-green-500",
    Medium: "bg-yellow-500",
    High: "bg-red-500",
    Urgent: "bg-red-600"
  };

  return (
    <div 
      className={cn(
        "group flex items-center gap-1 rounded-md p-1 text-xs cursor-pointer",
        "bg-card border border-border/50 hover:border-primary/30 transition-colors",
        task.status === 'Complete' && "opacity-60"
      )}
      onClick={() => onSelect(task)}
    >
      <div 
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          priorityColors[task.priority] || "bg-muted"
        )} 
      />
      <div className="flex-1 truncate font-medium">
        {task.title}
      </div>
      {!compact && task.due_date && (
        <div className="text-muted-foreground text-[10px] flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {format(new Date(task.due_date), 'h:mm a')}
        </div>
      )}
    </div>
  );
}

export function CalendarView({ tasks, onTaskUpdate, onTaskDelete, onAddTask, projects }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isViewingDay, setIsViewingDay] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const firstDayOfMonth = getFirstDayOfMonth(currentDate)
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const days = Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => null)
  const allDays = [...blanks, ...days]

  const weekDays = [
    { key: 'sunday', label: 'Sun' },
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' }
  ]

  const handlePrevPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))
    }
  }

  const handleNextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const tasksByDate = useMemo(() => {
    console.log('Grouping tasks:', tasks)
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (!task.due_date) return acc
      
      const taskDate = new Date(task.due_date)
      taskDate.setHours(12, 0, 0, 0)
      const dateKey = taskDate.toDateString()
      
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(task)
      return acc
    }, {})
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tasks, searchTerm])

  const onCreateTask = async (newTask: Partial<Task>) => {
    try {
      await onAddTask({
        ...newTask,
        due_date: newTask.due_date || selectedDate?.toISOString() || new Date().toISOString()
      })
      setIsCreateTaskOpen(false)
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const onUpdateTask = (taskId: string, updates: Partial<Task>) => {
    onTaskUpdate(taskId, updates)
    setIsEditTaskOpen(false)
    setEditingTask(null)
  }

  const onDeleteTask = (taskId: string) => {
    onTaskDelete(taskId)
  }

  const getTaskColor = (category: Task['category']) => {
    switch (category) {
      case 'Work':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'Personal':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'Errands':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
    }
  }

  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  const onDragEnd = async (result: any) => {
    if (!result.destination) return

    const sourceDate = new Date(parseInt(result.source.droppableId))
    const destinationDate = new Date(parseInt(result.destination.droppableId))
    const taskId = result.draggableId

    try {
      const formattedDate = new Date(destinationDate)
      formattedDate.setHours(12, 0, 0, 0)
      
      await onTaskUpdate(taskId, {
        due_date: formattedDate.toISOString()
      })
      toast.success('Task moved successfully')
    } catch (error) {
      console.error('Error moving task:', error)
      toast.error('Failed to move task')
    }
  }

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date)
      return isSameDay(taskDate, date)
    })
  }

  const handleAddTask = (date: Date) => {
    const newTask: Partial<Task> = {
      title: 'New Task',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      due_date: date.toISOString().split('T')[0],
    }
    onAddTask(newTask)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const handleAddTaskForDate = async (task: Partial<Task>) => {
    if (selectedDate) {
      try {
        await onAddTask({
          ...task,
          due_date: task.due_date || selectedDate.toISOString()
        })
        toast.success('Task added successfully')
      } catch (error) {
        console.error('Error adding task:', error)
        toast.error('Failed to add task')
      }
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  const handleQuickAddTask = async (date: Date, time?: string) => {
    try {
      if (!date) {
        throw new Error('Date is required')
      }

      const newTask: Partial<Task> = {
        title: 'New Task',
        description: '',
        status: 'To Do',
        priority: 'Medium',
        due_date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
          time ? parseInt(time.split(':')[0]) : 0, 
          time ? parseInt(time.split(':')[1]) : 0
        ).toISOString(),
      }

      await onAddTask(newTask)
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create task')
    }
  }

  // Format dates consistently using enUS locale
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy', { locale: enUS })
  }

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: enUS })
  }

  // Helper function to render tasks for a specific hour
  const tasksForHourComponent = (date: Date, hour: number) => {
    const tasksForDate = tasksByDate[date.toDateString()] || []
    
    const tasksForHour = tasksForDate.filter(task => {
      if (!task.start_time) return hour === 0
      const taskHour = parseInt(task.start_time.split(':')[0])
      return taskHour === hour
    })
    
    return tasksForHour.map((task: Task) => (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="mb-2"
      >
        <Card className="hover:shadow-md transition-all duration-200">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Checkbox 
                checked={task.status === 'Complete'}
                onCheckedChange={() => onTaskUpdate(task.id, { status: task.status === 'Complete' ? 'To Do' : 'Complete' })}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label 
                    htmlFor={`task-${task.id}`}
                    className={`font-medium text-sm ${task.status === 'Complete' ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {task.title}
                  </label>
                  <Badge 
                    variant="outline" 
                    className={getTaskColor(task.category)}
                  >
                    {task.category}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{task.start_time} - {task.end_time}</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 hover:bg-accent"
                      onClick={() => {
                        setEditingTask(task)
                        setIsEditTaskOpen(true)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ))
  }

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="month-navigation flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPeriod}
            className="month-navigation-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="month-title text-2xl font-bold">{monthYear}</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPeriod}
            className="month-navigation-button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="ml-2 text-sm"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
              className="rounded-l-md rounded-r-none"
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
              className="rounded-none border-l-0"
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
              className="rounded-r-md rounded-l-none border-l-0"
            >
              Day
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-8 h-9 w-[150px] sm:w-[180px] md:w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            onClick={() => {
              setSelectedDate(new Date())
              setIsCreateTaskOpen(true)
            }}
            size="sm"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>

      {view === 'month' && (
        <div className="calendar-view-container">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day.key}
                className="text-center py-2 text-sm font-medium text-muted-foreground"
              >
                {day.label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 calendar-grid">
            {allDays.map((day, index) => {
              const date = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null
              const isToday = date ? dateFnsIsToday(date) : false
              const isSelected = date && selectedDate ? isSameDay(date, selectedDate) : false
              const dayTasks = date ? tasks.filter(task => {
                const dueDate = task.due_date ? new Date(task.due_date) : null
                return dueDate && isSameDay(dueDate, date)
              }) : []

              return (
                <div
                  key={index}
                  className={cn(
                    "calendar-day border rounded-md p-1 min-h-[100px] transition-all",
                    day === null && "bg-muted/20 border-dashed",
                    isToday && "border-primary/50 bg-primary/5",
                    isSelected && "ring-2 ring-primary ring-offset-2",
                  )}
                  onClick={() => day && handleDateClick(date!)}
                >
                  {day !== null && (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-sm",
                            isToday && "bg-primary text-primary-foreground font-medium"
                          )}
                        >
                          {day}
                        </span>
                        {dayTasks.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {dayTasks.length}
                          </Badge>
                        )}
                      </div>
                      <ScrollArea className="h-[calc(100%-24px)]">
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onSelect={handleTaskSelect}
                              onUpdate={onTaskUpdate}
                              onDelete={onTaskDelete}
                              compact
                            />
                          ))}
                          {dayTasks.length > 3 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs h-6 mt-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDate(date)
                                setIsViewingDay(true)
                              }}
                            >
                              +{dayTasks.length - 3} more
                            </Button>
                          )}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onCreateTask={onCreateTask}
      />

      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              onUpdateTask(editingTask.id, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                // category: formData.get('category') as Task['category'],
                start_time: formData.get('startTime') as string,
                end_time: formData.get('endTime') as string,
              })
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">Title</Label>
                  <Input id="title" name="title" defaultValue={editingTask.title} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Input id="description" name="description" defaultValue={editingTask.description} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Select name="category" defaultValue={editingTask.category}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Errands">Errands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">Start Time</Label>
                  <Input 
                    id="startTime" 
                    name="startTime" 
                    type="time" 
                    defaultValue={editingTask.start_time} 
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">End Time</Label>
                  <Input 
                    id="endTime" 
                    name="endTime" 
                    type="time" 
                    defaultValue={editingTask.end_time} 
                    className="col-span-3" 
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

      {selectedTask && (
        <TaskDetails
          task={selectedTask as Task}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            if (selectedTask) {
              setEditingTask(selectedTask)
              setIsEditTaskOpen(true)
              setSelectedTask(null)
            }
          }}
          onDelete={() => {
            if (selectedTask) {
              onDeleteTask(selectedTask.id)
              setSelectedTask(null)
            }
          }}
        />
      )}

      {selectedDate && (
        <Card className="p-4 mt-4">
          <h3 className="font-semibold mb-2">
            {formatDate(selectedDate as Date)}
          </h3>
          <QuickAddTaskBar
            columnId="calendar"
            onAddTask={handleAddTaskForDate}
            projects={projects}
          />
          <div className="mt-4 space-y-2">
            {selectedDateTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded-lg bg-accent"
              >
                <span className="truncate">{task.title}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTaskUpdate(task.id, { status: task.status === 'Complete' ? 'To Do' : 'Complete' })}
                  >
                    {task.status === 'Complete' ? 'Undo' : 'Complete'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTaskDelete(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

