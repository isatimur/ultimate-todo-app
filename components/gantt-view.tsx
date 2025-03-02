"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Task } from '@/lib/types'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { toast } from 'sonner'

interface GanttViewProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}

type ZoomLevel = 'days' | 'weeks' | 'months'

export function GanttView({ tasks, onUpdateTask }: GanttViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('weeks')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [visibleStartDate, setVisibleStartDate] = useState(new Date())
  const [visibleEndDate, setVisibleEndDate] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate task duration in days
  const getTaskDuration = (task: Task): number => {
    if (!task.due_date) return 1; // Default to 1 day if no due date
    
    const startDate = new Date(task.date);
    const dueDate = new Date(task.due_date);
    
    // Calculate difference in days
    const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 1; // Ensure at least 1 day
  };

  useEffect(() => {
    if (tasks.length > 0) {
      const dates = tasks.flatMap(task => [
        new Date(task.date), 
        new Date(task.due_date || task.date) // Use due_date if available, otherwise use date
      ]);
      setStartDate(new Date(Math.min(...dates.map(d => d.getTime()))));
      setEndDate(new Date(Math.max(...dates.map(d => d.getTime()))));
    }
  }, [tasks]);

  useEffect(() => {
    setVisibleStartDate(startDate)
    setVisibleEndDate(endDate)
  }, [startDate, endDate])

  const addDays = (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  const getDaysBetween = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
  }

  const getWeeksBetween = (start: Date, end: Date) => {
    return Math.ceil(getDaysBetween(start, end) / 7)
  }

  const getMonthsBetween = (start: Date, end: Date) => {
    return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1
  }

  const getUnitsBetween = (start: Date, end: Date) => {
    switch (zoomLevel) {
      case 'days':
        return getDaysBetween(start, end)
      case 'weeks':
        return getWeeksBetween(start, end)
      case 'months':
        return getMonthsBetween(start, end)
    }
  }

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.date)
    const totalUnits = getUnitsBetween(visibleStartDate, visibleEndDate)
    const taskUnits = getUnitsBetween(visibleStartDate, taskStart)
    return (taskUnits / totalUnits) * 100
  }

  const getTaskWidth = (task: Task) => {
    const totalUnits = getUnitsBetween(visibleStartDate, visibleEndDate)
    const taskDuration = getTaskDuration(task)
    return (taskDuration / totalUnits) * 100
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const draggedTaskId = result.draggableId;
    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    if (!draggedTask) return;

    const totalUnits = getUnitsBetween(visibleStartDate, visibleEndDate);
    const unitsPerPixel = totalUnits / (containerRef.current?.clientWidth || 1);
    const unitsMoved = Math.round(result.destination.index * unitsPerPixel);

    const newStartDate = addDays(new Date(draggedTask.date), unitsMoved);
    
    // Ensure we update both date and due_date to maintain task duration
    const duration = getTaskDuration(draggedTask);
    const newDueDate = addDays(newStartDate, duration);

    try {
      await onUpdateTask(draggedTaskId, { 
        date: newStartDate.toISOString().split('T')[0],
        due_date: newDueDate.toISOString().split('T')[0]
      });
    } catch (error: unknown) {
      console.error('Failed to update task dates:', error);
      toast.error('Failed to update task dates');
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel === 'months') setZoomLevel('weeks')
    else if (zoomLevel === 'weeks') setZoomLevel('days')
  }

  const handleZoomOut = () => {
    if (zoomLevel === 'days') setZoomLevel('weeks')
    else if (zoomLevel === 'weeks') setZoomLevel('months')
  }

  const handleScroll = (direction: 'left' | 'right') => {
    const scrollAmount = getUnitsBetween(visibleStartDate, visibleEndDate) * 0.1
    if (direction === 'left') {
      setVisibleStartDate(addDays(visibleStartDate, -scrollAmount))
      setVisibleEndDate(addDays(visibleEndDate, -scrollAmount))
    } else {
      setVisibleStartDate(addDays(visibleStartDate, scrollAmount))
      setVisibleEndDate(addDays(visibleEndDate, scrollAmount))
    }
  }

  const renderTimeScale = () => {
    const units = getUnitsBetween(visibleStartDate, visibleEndDate)
    return Array.from({ length: units }, (_, i) => {
      const date = addDays(visibleStartDate, i * (zoomLevel === 'days' ? 1 : zoomLevel === 'weeks' ? 7 : 30))
      return (
        <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-r border-border">
          {date.toLocaleDateString(undefined, {
            day: zoomLevel === 'days' ? 'numeric' : undefined,
            month: zoomLevel === 'months' ? 'short' : 'numeric',
            year: zoomLevel === 'months' ? 'numeric' : undefined,
          })}
        </div>
      )
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleScroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleScroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoomLevel === 'months'}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoomLevel === 'days'}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-full h-full flex flex-col">
          <div className="flex border-b border-border h-8">
            {renderTimeScale()}
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="gantt" direction="vertical">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1">
                  {tasks.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={String(task.id)}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="h-12 relative"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  className="absolute top-1 h-10 rounded-md bg-primary cursor-move"
                                  style={{
                                    left: `${getTaskPosition(task)}%`,
                                    width: `${getTaskWidth(task)}%`,
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <div className="px-2 py-1 text-xs text-primary-foreground truncate">
                                    {task.title}
                                  </div>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p><strong>{task.title}</strong></p>
                                <p>Start: {task.date}</p>
                                <p>Duration: {getTaskDuration(task)} days</p>
                                <p>Category: {task.category}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  )
}

