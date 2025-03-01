'use client'

import { useState, useEffect } from 'react'
import { Task, Project, TaskStatus, ProjectType } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock, MoreVertical, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { EditTaskDialog } from './edit-task-dialog'
import { Progress } from '@/components/ui/progress'

interface TaskCardProps {
  task: Task
  projects?: Project[]
  onDelete: (taskId: string) => Promise<void>
}

// Extended Task interface to handle project_details
interface ExtendedTask extends Task {
  project_details?: {
    id: string;
    name: string;
    color: string;
    description?: string;
  } | null;
}

export function TaskCard({ task, projects = [], onDelete }: TaskCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [localTask, setLocalTask] = useState<ExtendedTask>(task as ExtendedTask)
  const supabase = createClient()

  const handleStatusChange = async (checked: boolean) => {
    setIsLoading(true)
    try {
      const newStatus = checked ? 'Complete' : 'To Do' as TaskStatus
      const now = new Date().toISOString()
      const updates = {
        status: newStatus,
        updated_at: now,
        subtasks: localTask.subtasks?.map(st => ({
          ...st,
          completed: checked
        }))
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id)

      if (error) throw error

      setLocalTask(prev => ({
        ...prev,
        ...updates
      } as ExtendedTask))
      
      toast.success(checked ? 'Task completed!' : 'Task reopened')
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubtaskStatusChange = async (subtaskId: string, checked: boolean) => {
    setIsLoading(true)
    try {
      const updatedSubtasks = localTask.subtasks?.map(st => 
        st.id === subtaskId ? { ...st, completed: checked } : st
      ) || []

      // Check if all subtasks are completed
      const allSubtasksCompleted = updatedSubtasks.every(st => st.completed)
      const updates = {
        subtasks: updatedSubtasks,
        status: allSubtasksCompleted ? 'Complete' as TaskStatus : localTask.status
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id)

      if (error) throw error

      setLocalTask(prev => ({
        ...prev,
        ...updates
      } as ExtendedTask))

      toast.success(allSubtasksCompleted ? 'All subtasks completed!' : 'Subtask updated')
    } catch (error) {
      console.error('Error updating subtask:', error)
      toast.error('Failed to update subtask')
    } finally {
      setIsLoading(false)
    }
  }

  const isCompleted = localTask.status === 'Complete'
  const hasSubtasks = localTask.subtasks && localTask.subtasks.length > 0
  
  // Calculate subtask progress
  const subtasksCount = localTask.subtasks?.length || 0
  const completedSubtasksCount = localTask.subtasks?.filter(st => st.completed).length || 0
  const completionPercentage = subtasksCount > 0 
    ? Math.round((completedSubtasksCount / subtasksCount) * 100) 
    : 0

  const handleSave = async (updatedTask: Partial<Task>) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updatedTask)
        .eq('id', task.id)

      if (error) throw error
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-500 bg-red-50 dark:bg-red-950/30'
      case 'High': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
      case 'Medium': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
      case 'Low': return 'text-green-500 bg-green-50 dark:bg-green-950/30'
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-950/30'
    }
  }

  return (
    <>
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200 task-card">
        <CardContent className="p-0">
          <div className="flex items-start gap-3 p-4">
            <div className="pt-0.5">
              <Checkbox
                checked={localTask.status === 'Complete'}
                onCheckedChange={handleStatusChange}
                disabled={isLoading}
                className="h-5 w-5"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 
                  className={`text-base font-medium leading-tight ${
                    localTask.status === 'Complete' ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {localTask.title}
                </h3>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Badge 
                    className={`${getPriorityColor(localTask.priority)} border-none`}
                    variant="outline"
                  >
                    {localTask.priority}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(localTask.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {localTask.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {localTask.description}
                </p>
              )}
              
              {subtasksCount > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{completedSubtasksCount}/{subtasksCount}</span>
                  </div>
                  <Progress value={completionPercentage} className="h-1.5" />
                  
                  <Accordion type="single" collapsible className="mt-2">
                    <AccordionItem value="subtasks" className="border-b-0">
                      <AccordionTrigger className="py-1 hover:no-underline">
                        <span className="text-xs font-medium">Subtasks</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-1">
                          {localTask.subtasks?.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={(checked) => 
                                  handleSubtaskStatusChange(subtask.id, checked as boolean)
                                }
                                disabled={isLoading}
                                className="h-4 w-4"
                              />
                              <span className={`text-xs ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-3">
                {localTask.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Due {formatDistanceToNow(new Date(localTask.due_date), { addSuffix: true })}</span>
                  </div>
                )}
                
                {localTask.time_tracked && localTask.time_tracked > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{localTask.time_tracked}h</span>
                  </div>
                )}

                {localTask.project_details && (
                  <Badge 
                    variant="outline" 
                    className="text-xs font-normal"
                    style={{ 
                      backgroundColor: `${localTask.project_details.color}15`,
                      borderColor: localTask.project_details.color,
                      color: localTask.project_details.color
                    }}
                  >
                    {localTask.project_details.name}
                  </Badge>
                )}
                
                {localTask.tags && localTask.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {localTask.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {localTask.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{localTask.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        task={localTask}
        projects={projects}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSave}
      />
    </>
  )
} 