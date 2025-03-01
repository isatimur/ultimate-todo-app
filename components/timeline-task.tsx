import React, { useState, useCallback, useEffect, memo } from 'react'
import { Task } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, ChevronDown, ChevronUp, Clock, Calendar, GripVertical, GripHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { addMinutes, format } from 'date-fns'
import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { 
  formatTimeRange, 
  formatDate, 
  calculateDuration, 
  formatDuration 
} from '@/lib/date-utils'

// Define performance monitoring functions inline to avoid module import issues
const createPerformanceMonitor = (componentName: string) => {
  return function usePerformanceMonitor(props?: any) {
    if (process.env.NODE_ENV !== 'development') return
    
    const startTime = performance.now()
    
    // Return a cleanup function that logs the render time
    return () => {
      const end = performance.now()
      const duration = end - startTime
      
      console.log(
        `%c${componentName} rendered %c(${duration.toFixed(2)}ms)`,
        'color: #3b82f6; font-weight: bold',
        'color: #6b7280'
      )
      
      if (props && process.env.DEBUG_PROPS === 'true') {
        console.groupCollapsed(`${componentName} props`)
        console.log(props)
        console.groupEnd()
      }
    }
  }
}

// Throttle function to limit the rate at which a function can fire
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle = false
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Props for the TimelineTask component
 * @interface TimelineTaskProps
 */
interface TimelineTaskProps {
  /** The task to display */
  task: Task
  /** Callback to update task properties */
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  /** Callback to delete the task */
  onDelete: (taskId: string) => Promise<void>
  /** Callback to edit the task */
  onEdit: (task: Task) => void
  /** Props provided by react-beautiful-dnd for drag functionality */
  provided?: DraggableProvided
  /** Snapshot of the current drag state */
  snapshot?: DraggableStateSnapshot
}

// Performance monitor for the component
const useTaskPerformance = createPerformanceMonitor('TimelineTask')

/**
 * TimelineTask Component
 * 
 * A draggable and resizable task component that displays in the timeline.
 * Supports expanding for more details, status toggling, and duration adjustment.
 * 
 * Features:
 * - Drag and drop repositioning
 * - Resizable duration
 * - Expandable details
 * - Status toggling
 * - Priority indicators
 * - Quick actions (edit/delete)
 * 
 * @component
 * @param {TimelineTaskProps} props - Component props
 * @returns {JSX.Element} Rendered task component
 */
function TimelineTaskComponent({ 
  task, 
  onUpdate, 
  onDelete, 
  onEdit,
  provided,
  snapshot
}: TimelineTaskProps) {
  // Monitor performance in development
  const cleanupPerformance = useTaskPerformance({ taskId: task.id })

  /** State for expanded/collapsed view */
  const [isExpanded, setIsExpanded] = useState(false)
  /** State for tracking resize operation */
  const [isResizing, setIsResizing] = useState(false)
  /** Starting Y coordinate for resize operation */
  const [startY, setStartY] = useState(0)
  /** Starting duration for resize operation */
  const [startDuration, setStartDuration] = useState(30)
  /** Current task duration in minutes */
  const [duration, setDuration] = useState(() => {
    if (task.start_time && task.end_time) {
      return calculateDuration(task.start_time, task.end_time)
    }
    return 30 // default duration in minutes
  })

  // Update duration when task times change
  useEffect(() => {
    if (task.start_time && task.end_time) {
      const newDuration = calculateDuration(task.start_time, task.end_time)
      if (newDuration !== duration && !isResizing) {
        setDuration(newDuration)
      }
    }
  }, [task.start_time, task.end_time, isResizing, duration])

  // Cleanup performance monitoring
  useEffect(() => {
    return () => {
      if (cleanupPerformance) cleanupPerformance()
    }
  }, [cleanupPerformance])

  /**
   * Initiates the resize operation
   * Sets up event listeners and captures initial state
   * 
   * @param {React.MouseEvent} e - Mouse event that triggered the resize
   */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setStartY(e.clientY)
    setStartDuration(duration)
    
    // These handlers will be cleaned up in handleResizeEnd
  }, [duration])

  /**
   * Handles the resize movement
   * Updates the task duration based on mouse movement
   * 
   * @param {MouseEvent} e - Mouse move event
   */
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    const diff = e.clientY - startY
    const newDuration = Math.max(15, Math.min(480, startDuration + Math.round(diff / 2)))
    setDuration(newDuration)
  }, [isResizing, startY, startDuration])

  /**
   * Throttled version of handleResizeMove to improve performance
   */
  const throttledResizeMove = useCallback(
    throttle(handleResizeMove, 16), // ~60fps
    [handleResizeMove]
  )

  /**
   * Completes the resize operation
   * Updates the task end time based on new duration
   */
  const handleResizeEnd = useCallback(async () => {
    if (!isResizing) return
    
    setIsResizing(false)
    document.removeEventListener('mousemove', throttledResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)

    if (!task.start_time || !task.due_date) return
    
    try {
      const startTime = new Date(task.due_date)
      const [hours, minutes] = task.start_time.split(':').map(Number)
      startTime.setHours(hours, minutes)
      const endTime = addMinutes(startTime, duration)
      
      await onUpdate(task.id, {
        end_time: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
      })
    } catch (error) {
      console.error('Error updating task duration:', error)
    }
  }, [isResizing, task.id, task.start_time, task.due_date, duration, onUpdate, throttledResizeMove])

  // Set up and clean up resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', throttledResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
    }
    
    return () => {
      document.removeEventListener('mousemove', throttledResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isResizing, throttledResizeMove, handleResizeEnd])

  /**
   * Toggles the task's completion status
   */
  const handleStatusChange = useCallback(async () => {
    try {
      await onUpdate(task.id, { 
        status: task.status === 'Complete' ? 'To Do' : 'Complete' 
      })
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }, [task.id, task.status, onUpdate])

  /**
   * Toggles the expanded state of the task
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  /**
   * Handles task deletion with confirmation
   */
  const handleDelete = useCallback(async () => {
    try {
      await onDelete(task.id)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }, [task.id, onDelete])

  /**
   * Handles task editing
   */
  const handleEdit = useCallback(() => {
    onEdit(task)
  }, [task, onEdit])

  // Get priority color class
  const getPriorityColorClass = useCallback(() => {
    switch (task.priority) {
      case 'High': return "border-red-500/50 text-red-500"
      case 'Medium': return "border-yellow-500/50 text-yellow-500"
      case 'Low': return "border-green-500/50 text-green-500"
      default: return ""
    }
  }, [task.priority])

  return (
    <motion.div
      layout
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-2 relative"
      style={{ 
        height: `${Math.max(60, duration)}px`,
        transition: isResizing ? 'none' : 'all 0.2s',
        ...provided?.draggableProps.style
      }}
    >
      <Card 
        className={cn(
          "absolute inset-x-0 transition-all duration-200",
          snapshot?.isDragging && "ring-2 ring-primary shadow-lg",
          isExpanded && "ring-1 ring-primary/20",
          isResizing && "ring-2 ring-primary cursor-row-resize"
        )}
        style={{ height: '100%' }}
      >
        <CardContent className="p-3 h-full flex flex-col">
          <div className="flex items-start gap-3">
            <div 
              {...provided?.dragHandleProps} 
              className="mt-1 cursor-grab active:cursor-grabbing"
              aria-label="Drag to reposition task"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <Checkbox 
              id={`task-${task.id}`}
              checked={task.status === 'Complete'}
              onCheckedChange={handleStatusChange}
              aria-label={`Mark task "${task.title}" as ${task.status === 'Complete' ? 'incomplete' : 'complete'}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor={`task-${task.id}`}
                    className={cn(
                      "font-medium text-sm truncate",
                      task.status === 'Complete' && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </label>
                  <Badge 
                    variant="outline" 
                    className={cn(getPriorityColorClass())}
                  >
                    {task.priority}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7"
                  onClick={toggleExpanded}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse task details" : "Expand task details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{task.start_time && formatTimeRange(task.start_time, duration)}</span>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-3"
                  >
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Duration</span>
                        <span>{formatDuration(duration)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 hover:bg-accent"
                        onClick={handleEdit}
                        aria-label={`Edit task "${task.title}"`}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleDelete}
                        aria-label={`Delete task "${task.title}"`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{task.start_time && formatTimeRange(task.start_time, duration)}</span>
            </div>
            <div 
              className="cursor-row-resize p-1 hover:bg-accent rounded"
              onMouseDown={handleResizeStart}
              aria-label="Resize task duration"
              role="slider"
              aria-valuemin={15}
              aria-valuemax={480}
              aria-valuenow={duration}
              aria-valuetext={`${Math.floor(duration / 60)} hours and ${duration % 60} minutes`}
            >
              <GripHorizontal className="h-3 w-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const TimelineTask = memo(TimelineTaskComponent)