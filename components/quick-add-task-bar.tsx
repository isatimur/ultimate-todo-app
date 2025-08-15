"use client"

import { useState, useEffect, useRef } from 'react'
import { Plus, Wand2, Mic, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Task, TaskTemplate } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SpeechRecognitionService } from '@/lib/speech-recognition'

interface QuickAddTaskBarProps {
  columnId: string
  onAddTask: (task: Partial<Task>) => Promise<void>
  templates?: TaskTemplate[]
  getAISuggestions?: (input: string) => Promise<Partial<Task>[]>
  projects: Array<{ id: string; name: string; color?: string }>
}

export function QuickAddTaskBar({
  columnId,
  onAddTask,
  templates = [],
  getAISuggestions,
  projects = []
}: QuickAddTaskBarProps) {
  const [mounted, setMounted] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('none')
  const [suggestions, setSuggestions] = useState<Partial<Task>[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechService] = useState(() => new SpeechRecognitionService())
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setMounted(true)
    return () => {
      if (speechService.isCurrentlyRecording()) {
        speechService.stopRecording().catch(console.error)
      }
    }
  }, [speechService])

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !onAddTask) return

    try {
      const newTask: Partial<Task> = {
        title: taskTitle.trim(),
        status: columnId === 'backlog' ? undefined : getStatusFromColumnId(columnId),
        project: selectedProject === 'none' ? undefined : selectedProject,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        priority: 'Medium',
        category: 'Personal'
      }
      
      await onAddTask(newTask)
      setTaskTitle('')
      setSelectedProject('none')
      setIsAdding(false)
      toast.success('Task added successfully')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const handleGetSuggestions = async () => {
    if (!getAISuggestions || !taskTitle.trim()) return

    try {
      setIsLoadingSuggestions(true)
      const newSuggestions = await getAISuggestions(taskTitle)
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Error getting suggestions:', error)
      toast.error('Failed to get suggestions')
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleApplySuggestion = async (suggestion: Partial<Task>) => {
    if (!onAddTask) return

    try {
      const newTask: Partial<Task> = {
        ...suggestion,
        status: columnId === 'backlog' ? undefined : getStatusFromColumnId(columnId),
        project: selectedProject === 'none' ? undefined : selectedProject,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      await onAddTask(newTask)
      setTaskTitle('')
      setSelectedProject('none')
      setIsAdding(false)
      setSuggestions([])
      toast.success('Task added successfully')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const toggleRecording = async () => {
    try {
      if (!isListening) {
        await speechService.startRecording()
        setIsListening(true)
        toast.info('Recording...')
      } else {
        const text = await speechService.stopRecording()
        setTaskTitle(text)
        setIsListening(false)
        toast.success('Transcribed voice input')
      }
    } catch (error) {
      console.error('Speech recognition error:', error)
      toast.error('Failed to process audio')
      setIsListening(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsProcessingImage(true)
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/vision', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract text')
      }
      setTaskTitle(data.text)
      toast.success('Extracted text from image')
    } catch (error) {
      console.error('Image processing error:', error)
      toast.error('Failed to extract text')
    } finally {
      setIsProcessingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleAddTask()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setTaskTitle('')
      setSelectedProject('none')
      setSuggestions([])
    }
  }

  const resetForm = () => {
    setIsAdding(false)
    setTaskTitle('')
    setSelectedProject('none')
    setSuggestions([])
  }

  if (!mounted) {
    return null
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add task
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter task title..."
          autoFocus
        />
        <Button
          variant="outline"
          size="icon"
          className={cn(isListening && 'animate-pulse')}
          onClick={() => void toggleRecording()}
          disabled={isProcessingImage}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isListening || isProcessingImage}
        >
          <Camera className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        {getAISuggestions && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(isLoadingSuggestions && "animate-pulse")}
                onClick={() => void handleGetSuggestions()}
                disabled={!taskTitle.trim() || isLoadingSuggestions}
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="space-y-2 p-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={`suggestion-${index}`}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => void handleApplySuggestion(suggestion)}
                  >
                    {suggestion.title}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={selectedProject}
          onValueChange={setSelectedProject}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="no-project" value="none">No Project</SelectItem>
            {projects.map((project) => project && project.id ? (
              <SelectItem key={`project-${project.id}`} value={project.id}>
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </div>
              </SelectItem>
            ) : null)}
          </SelectContent>
        </Select>

        <div className="flex justify-end gap-2 flex-1">
          <Button
            variant="ghost"
            onClick={resetForm}
          >
            Cancel
          </Button>
          <Button onClick={() => void handleAddTask()}>Add Task</Button>
        </div>
      </div>
    </div>
  )
}

function getStatusFromColumnId(columnId: string) {
  switch (columnId) {
    case 'todo':
      return 'To Do'
    case 'in-progress':
      return 'In Progress'
    case 'in-review':
      return 'In Review'
    case 'complete':
      return 'Complete'
    default:
      return 'To Do'
  }
}