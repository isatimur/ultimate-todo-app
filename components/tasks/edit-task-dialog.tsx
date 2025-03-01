'use client'

import { useState } from 'react'
import { Task, TaskStatus, TaskPriority, Project } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EditTaskDialogProps {
  task: Task
  onSave: (task: Partial<Task>) => Promise<void>
  projects?: Project[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTaskDialog({
  task,
  onSave,
  projects = [],
  open,
  onOpenChange
}: EditTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  )
  const [projectId, setProjectId] = useState<string | undefined>(task.project_id)
  const [subtasks, setSubtasks] = useState(task.subtasks || [])

  const supabase = createClient()

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setIsLoading(true)
    try {
      const updates = {
        title,
        description: description || null,
        status,
        priority,
        due_date: dueDate?.toISOString() || null,
        project_id: projectId || null,
        updated_at: new Date().toISOString(),
        subtasks
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id)

      if (error) throw error

      toast.success('Task updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSubtask = () => {
    setSubtasks([
      ...subtasks,
      { id: crypto.randomUUID(), title: '', completed: false }
    ])
  }

  const handleSubtaskChange = (id: string, value: string) => {
    setSubtasks(subtasks.map(st => 
      st.id === id ? { ...st, title: value } : st
    ))
  }

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id))
  }

  const handleGenerateDescription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, currentDescription: description })
      })
      
      if (!response.ok) throw new Error('Failed to generate description')
      
      const data = await response.json()
      setDescription(data.description)
      toast.success('Description generated')
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error('Failed to generate description')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateSubtasks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/generate-subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })
      
      if (!response.ok) throw new Error('Failed to generate subtasks')
      
      const data = await response.json()
      setSubtasks([...subtasks, ...data.subtasks])
      toast.success('Subtasks generated')
    } catch (error) {
      console.error('Error generating subtasks:', error)
      toast.error('Failed to generate subtasks')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Description</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isLoading}
              >
                Generate with AI
              </Button>
            </div>
            <Textarea
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
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
              <label className="text-sm font-medium">Priority</label>
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
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Project</label>
            <Select 
              value={projectId || 'none'} 
              onValueChange={(value) => setProjectId(value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="none" value="none">No Project</SelectItem>
                {projects?.map((project: Project) => (
                  <SelectItem key={project?.id} value={project?.id.toString()}>
                    {project?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Subtasks</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSubtasks}
                  disabled={isLoading}
                >
                  Generate with AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubtask}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex gap-2">
                  <Input
                    placeholder="Subtask title"
                    value={subtask.title}
                    onChange={(e) => handleSubtaskChange(subtask.id, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 