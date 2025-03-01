'use client'

import { useState, useEffect, useMemo } from 'react'
import { Task } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CreateTaskButton } from './create-task-button'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { 
  format, 
  addDays, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isToday, 
  isWeekend,
  differenceInDays,
  isBefore,
  isAfter
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'

interface TaskGanttProps {
  initialTasks: Task[]
  userId: string
}

type ZoomLevel = 'day' | 'week' | 'month'
type ViewMode = 'flat' | 'grouped'

export function TaskGantt({ initialTasks, userId }: TaskGanttProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day')
  const [viewMode, setViewMode] = useState<ViewMode>('flat')
  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(addDays(new Date(), 60))
  })
  const supabase = createClient()

  const dates = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
  }, [dateRange])

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    if (viewMode === 'flat') return { ungrouped: tasks }
    
    return tasks.reduce((acc, task) => {
      const projectId = task.project_details?.id || 'unassigned'
      const projectName = task.project_details?.name || 'Unassigned'
      
      if (!acc[projectId]) {
        acc[projectId] = {
          name: projectName,
          color: task.project_details?.color || '#888',
          tasks: []
        }
      }
      
      acc[projectId].tasks.push(task)
      return acc
    }, {} as Record<string, { name: string; color: string; tasks: Task[] }>)
  }, [tasks, viewMode])

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

  const handleCreateTask = async (task: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: userId }])

      if (error) throw error
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const handleTaskDrop = async (taskId: string, newStartDate: Date) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const originalStartDate = new Date(task.date)
      const originalEndDate = new Date(task.due_date)
      const daysDiff = Math.floor((newStartDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const newEndDate = addDays(originalEndDate, daysDiff)

      const { error } = await supabase
        .from('tasks')
        .update({
          date: newStartDate.toISOString(),
          due_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
      toast.success('Task dates updated')
    } catch (error) {
      console.error('Error updating task dates:', error)
      toast.error('Failed to update task dates')
    }
  }

  const getCellWidth = () => {
    switch (zoomLevel) {
      case 'month': return 16
      case 'week': return 24
      case 'day': return 32
      default: return 32
    }
  }

  const calculateProgress = (task: Task) => {
    if (task.status === 'Complete') return 100
    if (task.status === 'To Do') return 0
    
    const total = differenceInDays(new Date(task.due_date), new Date(task.date))
    const elapsed = differenceInDays(new Date(), new Date(task.date))
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  const isOverdue = (task: Task) => {
    return !task.completed && isBefore(new Date(task.due_date), new Date())
  }

  const formatDateSafely = (dateStr: string | null | undefined, fallback = 'N/A') => {
    if (!dateStr) return fallback
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return fallback
      return format(date, 'MMM d')
    } catch {
      return fallback
    }
  }

  const renderTaskBar = (task: Task) => {
    // Validate dates
    const startDateStr = task.date
    const endDateStr = task.due_date
    
    if (!startDateStr || !endDateStr) {
      console.warn(`Task ${task.id} has invalid dates:`, { startDateStr, endDateStr })
      return null
    }

    try {
      const startDate = new Date(startDateStr)
      const endDate = new Date(endDateStr)

      // Validate date objects
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn(`Task ${task.id} has invalid date objects:`, { startDate, endDate })
        return null
      }

      const duration = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      )
      const cellWidth = getCellWidth()
      const progress = calculateProgress(task)

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                draggable
                onDragStart={() => setDraggingTask(task.id)}
                onDragEnd={() => setDraggingTask(null)}
                className={`absolute h-6 rounded-full mt-3 cursor-move overflow-hidden ${
                  isOverdue(task) ? 'ring-2 ring-destructive' : ''
                }`}
                style={{
                  left: `${startDate.getDate() * cellWidth}px`,
                  width: `${duration * cellWidth}px`,
                  backgroundColor: task.project_details?.color || '#888',
                  opacity: task.status === 'Complete' ? 0.5 : 0.8
                }}
              >
                <div
                  className="h-full bg-primary/20"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateSafely(task.date)} - {formatDateSafely(task.due_date)}
                </p>
                <Progress value={progress} className="h-1" />
                <p className="text-xs text-muted-foreground">
                  {task.status} • {Math.round(progress)}% complete
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    } catch (error) {
      console.error(`Error rendering task ${task.id}:`, error)
      return null
    }
  }

  const navigateTimeframe = (direction: 'forward' | 'backward') => {
    const days = direction === 'forward' ? 30 : -30
    setDateRange(prev => ({
      start: addDays(prev.start, days),
      end: addDays(prev.end, days)
    }))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="View Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat View</SelectItem>
              <SelectItem value="grouped">Group by Project</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel('month')}
              className={zoomLevel === 'month' ? 'bg-muted' : ''}
            >
              <ZoomOut className="h-4 w-4" />
              <span className="ml-2">Month</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel('week')}
              className={zoomLevel === 'week' ? 'bg-muted' : ''}
            >
              <Calendar className="h-4 w-4" />
              <span className="ml-2">Week</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel('day')}
              className={zoomLevel === 'day' ? 'bg-muted' : ''}
            >
              <ZoomIn className="h-4 w-4" />
              <span className="ml-2">Day</span>
            </Button>
          </div>

          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateTimeframe('backward')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateTimeframe('forward')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CreateTaskButton onCreateTask={handleCreateTask} />
      </div>

      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="min-w-[1200px]">
            {/* Header */}
            <div className="border-b sticky top-0 bg-background z-10">
              {/* Month Headers */}
              <div className="flex">
                <div className="w-64 p-4 border-r" />
                <div className="flex-1 flex">
                  {dates.map((date, i) => {
                    const isFirstOfMonth = i === 0 || date.getDate() === 1
                    if (isFirstOfMonth) {
                      const daysInMonth = dates.filter(d => d.getMonth() === date.getMonth()).length
                      return (
                        <div
                          key={`month-${date.toISOString()}`}
                          className="border-r text-center text-sm font-medium py-2"
                          style={{ width: `${daysInMonth * getCellWidth()}px` }}
                        >
                          {format(date, 'MMMM yyyy')}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>

              {/* Day Headers */}
              <div className="flex">
                <div className="w-64 p-4 border-r">Task</div>
                <div className="flex-1 flex">
                  {dates.map((date) => (
                    <div
                      key={date.toISOString()}
                      className={`flex-shrink-0 p-2 text-center text-xs border-r
                        ${isToday(date) ? 'bg-primary/10 font-bold' : ''}
                        ${isWeekend(date) ? 'bg-muted/50' : ''}
                      `}
                      style={{ width: `${getCellWidth()}px` }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (draggingTask) {
                          e.currentTarget.classList.add('bg-primary/20')
                        }
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-primary/20')
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('bg-primary/20')
                        if (draggingTask) {
                          handleTaskDrop(draggingTask, date)
                        }
                      }}
                    >
                      {format(date, 'd')}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="divide-y relative">
              {/* Today marker line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-primary"
                style={{
                  left: `${(64 + (new Date().getDate() * getCellWidth()))}px`,
                  zIndex: 1
                }}
              />

              {viewMode === 'flat' ? (
                // Flat view
                tasks.map((task) => (
                  <div key={task.id} className="flex group hover:bg-muted/50">
                    <div className="w-64 p-4 border-r">
                      <div className="font-medium">{task.title}</div>
                      {task.project_details && (
                        <div 
                          className="text-sm mt-1"
                          style={{ color: task.project_details.color }}
                        >
                          {task.project_details.name}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex relative">
                      {renderTaskBar(task)}
                    </div>
                  </div>
                ))
              ) : (
                // Grouped by project
                Object.entries(groupedTasks).map(([projectId, project]) => (
                  <div key={projectId}>
                    <div 
                      className="flex bg-muted/30 border-y"
                      style={{ borderLeftColor: project.color, borderLeftWidth: 4 }}
                    >
                      <div className="w-64 p-4 font-medium">
                        {project.name}
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({project.tasks.length})
                        </span>
                      </div>
                      <div className="flex-1" />
                    </div>
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex group hover:bg-muted/50">
                        <div className="w-64 p-4 border-r pl-6">
                          <div className="font-medium">{task.title}</div>
                        </div>
                        <div className="flex-1 flex relative">
                          {renderTaskBar(task)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}

              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks yet
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}