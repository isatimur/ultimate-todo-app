import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Task } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { TimelineTask } from './timeline-task'
import { VersionIndicator } from './version-indicator'
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult, 
  DroppableProvided, 
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot
} from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import { addMinutes } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { 
  formatHeaderDate, 
  formatTime, 
  BASE_DATE,
  getTimeSlot,
  getTimeFromSlot
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

const measurePerformance = <T,>(fn: () => T, name: string): T => {
  if (process.env.NODE_ENV !== 'development') return fn()
  
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  console.log(
    `%c${name} %c(${(end - start).toFixed(2)}ms)`,
    'color: #10b981; font-weight: bold',
    'color: #6b7280'
  )
  
  return result
}

/**
 * Props for the TimelineView component
 * @interface TimelineViewProps
 */
interface TimelineViewProps {
  /** Array of tasks to display in the timeline */
  tasks: Task[]
  /** Currently selected date, null if no date is selected */
  selectedDate: Date | null
  /** Callback to update a task's properties */
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  /** Callback to delete a task */
  onTaskDelete: (id: string) => Promise<void>
  /** Callback to edit a task */
  onTaskEdit: (task: Task) => void
  /** Callback to add a new task */
  onAddTask: (task: Partial<Task>) => Promise<void>
}

// Performance monitor for the component
const useTimelinePerformance = createPerformanceMonitor('TimelineView')

/**
 * TimelineView Component
 * 
 * A comprehensive timeline view that displays tasks in 30-minute intervals.
 * Supports drag-and-drop task scheduling and task duration management.
 * 
 * Features:
 * - 48 time slots (30-minute intervals)
 * - Drag and drop task scheduling
 * - Visual feedback during drag operations
 * - Quick task addition at any time slot
 * - Consistent date/time formatting
 * 
 * @component
 * @param {TimelineViewProps} props - Component props
 * @returns {JSX.Element} Rendered timeline view
 */
export function TimelineView({
  tasks,
  selectedDate,
  onTaskUpdate,
  onTaskDelete,
  onTaskEdit,
  onAddTask
}: TimelineViewProps) {
  // Monitor performance in development
  const cleanupPerformance = useTimelinePerformance({ 
    taskCount: tasks.length,
    hasSelectedDate: !!selectedDate
  })

  /** Array of 48 time slots (30-minute intervals) */
  const timeSlots = useMemo(() => 
    Array.from({ length: 48 }, (_, i) => i / 2), 
    []
  )
  
  /** State to track if a task is being dragged */
  const [isDragging, setIsDragging] = useState(false)

  // Cleanup performance monitoring
  useEffect(() => {
    return () => {
      if (cleanupPerformance) cleanupPerformance()
    }
  }, [cleanupPerformance])

  /**
   * Handles the start of a drag operation
   * Updates the dragging state for visual feedback
   */
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  /**
   * Handles the end of a drag operation
   * Updates the task's time and date based on where it was dropped
   * 
   * @param {DropResult} result - The drag result containing source and destination information
   */
  const handleDragEnd = useCallback(async (result: DropResult) => {
    setIsDragging(false)
    if (!result.destination || !selectedDate) return

    const taskId = result.draggableId
    const newTimeSlot = parseFloat(result.destination.droppableId)
    const task = tasks.find(t => t.id === taskId)
    
    if (!task) {
      console.error('Task not found:', taskId)
      return
    }
    
    try {
      const updatedDate = new Date(selectedDate)
      const hours = Math.floor(newTimeSlot)
      const minutes = (newTimeSlot % 1) * 60
      updatedDate.setHours(hours, minutes, 0, 0)
      
      // Maintain task duration when dragging
      let updates: Partial<Task> = {
        start_time: formatTime(hours, minutes),
        due_date: updatedDate.toISOString()
      }

      if (task?.end_time && task.start_time) {
        const [startHour, startMin] = task.start_time.split(':').map(Number)
        const [endHour, endMin] = task.end_time.split(':').map(Number)
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin)
        
        const endTime = addMinutes(updatedDate, duration)
        updates.end_time = formatTime(endTime.getHours(), endTime.getMinutes())
      }

      await onTaskUpdate(taskId, updates)
    } catch (error) {
      console.error('Error updating task time:', error)
    }
  }, [selectedDate, tasks, onTaskUpdate])

  /**
   * Creates a new task at the specified time slot
   * 
   * @param {number} timeSlot - The time slot to create the task in (0-47, representing 30-minute intervals)
   */
  const handleAddTask = useCallback(async (timeSlot: number) => {
    if (!selectedDate) return

    try {
      const date = new Date(selectedDate)
      const hours = Math.floor(timeSlot)
      const minutes = (timeSlot % 1) * 60
      date.setHours(hours, minutes, 0, 0)

      const endTime = addMinutes(date, 30) // Default 30 min duration

      await onAddTask({
        title: 'New Task',
        status: 'To Do',
        priority: 'Medium',
        due_date: date.toISOString(),
        start_time: formatTime(hours, minutes),
        end_time: formatTime(endTime.getHours(), endTime.getMinutes())
      })
    } catch (error) {
      console.error('Error adding new task:', error)
    }
  }, [selectedDate, onAddTask])

  /**
   * Filters tasks that belong to a specific time slot
   * 
   * @param {number} timeSlot - The time slot to get tasks for
   * @returns {Task[]} Array of tasks that start at the specified time slot
   */
  const getTasksForTimeSlot = useCallback((timeSlot: number): Task[] => {
    if (!selectedDate) return []
    
    return measurePerformance(() => {
      return tasks.filter(task => {
        if (!task.start_time || !task.due_date) return false
        
        try {
          const taskDate = new Date(task.due_date)
          if (taskDate.toDateString() !== selectedDate.toDateString()) return false
          
          const [startHour, startMin] = task.start_time.split(':').map(Number)
          const taskTimeSlot = startHour + (startMin / 60)
          return Math.abs(taskTimeSlot - timeSlot) < 0.001 // Account for floating point precision
        } catch (error) {
          console.error('Error filtering tasks for time slot:', error)
          return false
        }
      })
    }, `getTasksForTimeSlot(${timeSlot})`)
  }, [selectedDate, tasks])

  // Memoize the task mapping for each time slot to avoid recalculation
  const timeSlotTasksMap = useMemo(() => {
    if (!selectedDate) return new Map<number, Task[]>()
    
    return measurePerformance(() => {
      const map = new Map<number, Task[]>()
      
      timeSlots.forEach(slot => {
        map.set(slot, [])
      })
      
      tasks.forEach(task => {
        if (!task.start_time || !task.due_date) return
        
        try {
          const taskDate = new Date(task.due_date)
          if (taskDate.toDateString() !== selectedDate.toDateString()) return
          
          const [startHour, startMin] = task.start_time.split(':').map(Number)
          const taskTimeSlot = startHour + (startMin / 60)
          
          // Find the closest time slot
          const closestSlot = timeSlots.find(slot => 
            Math.abs(slot - taskTimeSlot) < 0.001
          )
          
          if (closestSlot !== undefined) {
            const tasksForSlot = map.get(closestSlot) || []
            tasksForSlot.push(task)
            map.set(closestSlot, tasksForSlot)
          }
        } catch (error) {
          console.error('Error mapping task to time slot:', error)
        }
      })
      
      return map
    }, 'timeSlotTasksMap')
  }, [selectedDate, tasks, timeSlots])

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
          <h2 className="font-medium text-sm">
            {selectedDate ? formatHeaderDate(selectedDate) : "Select a date"}
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="relative pb-12">
            {timeSlots.map((timeSlot) => {
              const hours = Math.floor(timeSlot)
              const minutes = (timeSlot % 1) * 60
              const formattedTime = formatTime(hours, minutes)
              const slotId = timeSlot.toString()
              const tasksForSlot = timeSlotTasksMap.get(timeSlot) || []
              
              return (
                <div key={slotId} className="relative group">
                  <div className={cn(
                    "sticky top-0 z-10 bg-background/95 backdrop-blur-sm",
                    minutes !== 0 && "opacity-50"
                  )}>
                    <div className="flex items-center h-8 px-4 group-hover:bg-accent/50 transition-colors">
                      <span className="text-sm font-medium text-muted-foreground w-16">
                        {formattedTime}
                      </span>
                      <Separator className="flex-1 ml-2" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleAddTask(timeSlot)}
                        aria-label={`Add task at ${formattedTime}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Droppable droppableId={slotId}>
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "px-4 transition-colors",
                          "min-h-[30px]",
                          snapshot.isDraggingOver && "bg-accent/50",
                          isDragging && !snapshot.isDraggingOver && "bg-muted/50"
                        )}
                        aria-label={`Time slot ${formattedTime}`}
                      >
                        {tasksForSlot.map((task: Task, index: number) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id.toString()}
                            index={index}
                          >
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                              <TimelineTask
                                task={task}
                                onUpdate={onTaskUpdate}
                                onDelete={onTaskDelete}
                                onEdit={onTaskEdit}
                                provided={provided}
                                snapshot={snapshot}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <VersionIndicator className="sticky bottom-0 z-20" />
      </div>
    </DragDropContext>
  )
} 