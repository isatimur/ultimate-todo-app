'use client'

import { useState } from 'react'
import { Task, Project, TaskStatus, TaskPriority } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { CalendarIcon, Plus, Trash, Mic, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpeechRecognitionService } from '@/lib/speech-recognition'
import { parseTaskInput } from '@/lib/task-parser'
import { toast } from 'sonner'

interface CreateTaskButtonProps {
  onCreateTask: (task: Partial<Task>) => Promise<Task>
  projects?: Project[]
  disabled?: boolean
}

export function CreateTaskButton({ onCreateTask, projects = [], disabled }: CreateTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('To Do')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [dueDate, setDueDate] = useState<Date>()
  const [projectId, setProjectId] = useState<string>()
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([])
  const [speechService] = useState(() => new SpeechRecognitionService())

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    try {
      await onCreateTask({
        title,
        description: description || undefined,
        status,
        priority,
        due_date: dueDate?.toISOString(),
        project_id: projectId,
        subtasks: subtasks.length > 0 ? subtasks : undefined
      })

      // Reset form
      setTitle('')
      setDescription('')
      setStatus('To Do')
      setPriority('Medium')
      setDueDate(undefined)
      setProjectId(undefined)
      setSubtasks([])
      setIsOpen(false)
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
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

  const toggleRecording = async () => {
    try {
      if (!isListening) {
        await speechService.startRecording()
        setIsListening(true)
        toast.info('Listening... Click the mic again to stop.')
      } else {
        setIsLoading(true)
        const text = await speechService.stopRecording()
        const taskData = parseTaskInput(text)
        
        // Update form with parsed data
        setTitle(taskData.title || '')
        setDescription(taskData.description || '')
        setPriority(taskData.priority || 'Medium')
        if (taskData.due_date) {
          setDueDate(new Date(taskData.due_date))
        }
        setIsListening(false)
        toast.success('Speech recognized successfully')
      }
    } catch (error) {
      console.error('Speech recognition error:', error)
      toast.error('Failed to process speech. Please try again.')
      setIsListening(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      <Button 
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(true)
        }} 
        disabled={disabled}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Task
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder={isListening ? 'Listening...' : "Task title"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "flex-1",
                    isListening && "ring-2 ring-red-500"
                  )}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
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
                    type="button"
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
                value={projectId} 
                onValueChange={(value) => setProjectId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="no-project" value="">No Project</SelectItem>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubtask}
                >
                  Add Subtask
                </Button>
              </div>
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex gap-2">
                  <Input
                    value={subtask.title}
                    onChange={(e) => handleSubtaskChange(subtask.id, e.target.value)}
                    placeholder="Subtask title"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveSubtask(subtask.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 