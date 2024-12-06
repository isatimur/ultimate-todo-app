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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { MiniMonth } from './mini-month'
import { TaskLegend } from './task-legend'
import { WeekView } from './week-view'
import { QuickAddTask } from './quick-add-task'
import { TaskDetails } from './task-details'
import { TaskStatistics } from './task-statistics'

interface CalendarViewProps {}

export function CalendarView({}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<'month' | 'week'>('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    const storedTasks = localStorage.getItem('tasks')
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDayOfMonth = getFirstDayOfMonth(currentDate)
  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => null)
  const allDays = [...blanks, ...days]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
    return tasks.reduce((acc, task) => {
      const taskDate = new Date(task.date + 'T00:00:00').toDateString()
      if (!acc[taskDate]) {
        acc[taskDate] = []
      }
      acc[taskDate].push(task)
      return acc
    }, {} as Record<string, Task[]>)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tasks, searchTerm])

  const onCreateTask = (newTask: Omit<Task, "id">) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      date: new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0]
    }
    setTasks([...tasks, task])
    setIsCreateTaskOpen(false)
  }

  const onUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, ...updates } : task))
    setIsEditTaskOpen(false)
    setEditingTask(null)
  }

  const onDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
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

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceDate = new Date(parseInt(result.source.droppableId))
    const destinationDate = new Date(parseInt(result.destination.droppableId))

    const updatedTasks = Array.from(tasks)
    const [reorderedTask] = updatedTasks.splice(result.source.index, 1)
    reorderedTask.date = destinationDate.toISOString().split('T')[0]
    updatedTasks.splice(result.destination.index, 0, reorderedTask)

    setTasks(updatedTasks)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-semibold">{monthYear}</h1>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={handlePrevPeriod}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextPeriod}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleToday}
              className="h-9"
            >
              Today
            </Button>
            <Select value={view} onValueChange={(value: 'month' | 'week') => setView(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-[200px]"
              />
            </div>
            <Button 
              onClick={() => setIsCreateTaskOpen(true)}
              className="h-9 bg-black text-white hover:bg-black/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
        <div className="p-4">
          <TaskStatistics tasks={tasks} />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r p-4 flex flex-col gap-4">
            <MiniMonth 
              currentDate={currentDate} 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
            <TaskLegend />
            <QuickAddTask onAddTask={onCreateTask} />
          </div>
          <div className="flex-1 overflow-auto">
            {view === 'month' ? (
              <div className="grid grid-cols-7 gap-px bg-border p-4">
                {weekDays.map((day) => (
                  <div key={day} className="bg-background p-3 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {allDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`blank-${index}`} className="bg-background p-3" />
                  }

                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isSelected = date.toDateString() === selectedDate.toDateString()
                  const dayTasks = tasksByDate[date.toDateString()] || []

                  return (
                    <Droppable droppableId={date.getTime().toString()} key={date.getTime().toString()}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`bg-card p-2 min-h-[120px] transition-colors duration-200 cursor-pointer hover:bg-accent/50 ${
                            isSelected ? 'ring-2 ring-primary' : ''
                          } ${isToday ? 'bg-accent/50' : ''} ${
                            snapshot.isDraggingOver ? 'bg-accent' : ''
                          }`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                            {day}
                          </span>
                          <AnimatePresence>
                            {dayTasks.map((task, taskIndex) => (
                              <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      transition={{ duration: 0.2 }}
                                      className={`mt-1 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTask(task)
                                      }}
                                    >
                                      <div
                                        className={`text-xs p-1 rounded-md ${getTaskColor(task.category)} transition-colors duration-200`}
                                      >
                                        <div className="flex items-center gap-1">
                                          <span className="truncate">{task.title}</span>
                                          {task.startTime && (
                                            <Clock className="h-3 w-3 flex-shrink-0" />
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </AnimatePresence>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )
                })}
              </div>
            ) : (
              <WeekView
                currentDate={currentDate}
                tasks={filteredTasks}
                onTaskClick={setSelectedTask}
                getTaskColor={getTaskColor}
              />
            )}
          </div>

          <div className="w-[300px] border-l bg-card">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Tasks for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="relative">
                {timeSlots.map((hour) => (
                  <div key={hour} className="relative">
                    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                      <div className="flex items-center h-12 px-4">
                        <span className="text-sm font-medium text-muted-foreground w-16">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                        <Separator className="flex-1 ml-2" />
                      </div>
                    </div>
                    <div className="px-4">
                      {tasksByDate[selectedDate.toDateString()]?.filter(task => {
                        const taskHour = task.startTime ? parseInt(task.startTime.split(':')[0]) : null
                        return taskHour === hour
                      }).map((task) => (
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
                                  id={`task-${task.id}`}
                                  checked={task.completed}
                                  onCheckedChange={(checked) => {
                                    onUpdateTask(task.id, { completed: checked as boolean })
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <label 
                                      htmlFor={`task-${task.id}`}
                                      className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
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
                                    <span>{task.startTime} - {task.endTime}</span>
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
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <CreateTaskDialog
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
          onCreateTask={onCreateTask}
        />

        <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                onUpdateTask(editingTask.id, {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as Task['category'],
                  startTime: formData.get('startTime') as string,
                  endTime: formData.get('endTime') as string,
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
                      defaultValue={editingTask.startTime} 
                      className="col-span-3" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endTime" className="text-right">End Time</Label>
                    <Input 
                      id="endTime" 
                      name="endTime" 
                      type="time" 
                      defaultValue={editingTask.endTime} 
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
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onEdit={() => {
              setEditingTask(selectedTask)
              setIsEditTaskOpen(true)
              setSelectedTask(null)
            }}
            onDelete={() => {
              onDeleteTask(selectedTask.id)
              setSelectedTask(null)
            }}
          />
        )}
      </div>
    </DragDropContext>
  )
}

