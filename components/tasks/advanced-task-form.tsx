'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Task, Project, TaskStatus, TaskPriority } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, addDays, addBusinessDays, isToday, isTomorrow, isPast } from 'date-fns'
import { 
  CalendarIcon, Plus, Trash, Mic, Loader2, Tags, Clock, Users, 
  Link, ArrowRight, Sparkles, Calendar as CalendarIcon2, 
  GripVertical, Zap, Copy, CalendarRange, BrainCircuit, Check,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpeechRecognitionService } from '@/lib/speech-recognition'
import { parseTaskInput } from '@/lib/task-parser'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-browser'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useHotkeys } from 'react-hotkeys-hook'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface AdvancedTaskFormProps {
  projects: Project[]
  teamId?: string
  userId: string
}

export function AdvancedTaskForm({ projects, teamId, userId }: AdvancedTaskFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('details')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('To Do')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [dueDate, setDueDate] = useState<Date>()
  const [projectId, setProjectId] = useState<string>()
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState('daily')
  const [dependencies, setDependencies] = useState<string[]>([])
  const [assignees, setAssignees] = useState<string[]>([userId])
  const [speechService] = useState(() => new SpeechRecognitionService())
  const [formCompletion, setFormCompletion] = useState(0)
  const [suggestedTags, setSuggestedTags] = useState(['work', 'personal', 'urgent', 'meeting', 'admin'])
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  // Smart defaults based on time
  useEffect(() => {
    const hour = new Date().getHours()
    if (!priority) {
      // Set higher priority for tasks created during work hours
      if (hour >= 9 && hour <= 17) {
        setPriority('High')
      } else {
        setPriority('Medium')
      }
    }
    
    // Default due date to tomorrow if created in the evening
    if (!dueDate && hour >= 17) {
      setDueDate(addDays(new Date(), 1))
    }
  }, [])

  // Auto-save draft
  useEffect(() => {
    const saveDraft = () => {
      if (title || description) {
        localStorage.setItem('taskDraft', JSON.stringify({
          title,
          description,
          priority,
          status,
          dueDate,
          projectId,
          subtasks,
          tags
        }))
      }
    }
    
    const interval = setInterval(saveDraft, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [title, description, priority, status, dueDate, projectId, subtasks, tags])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('taskDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (parsed.title) setTitle(parsed.title)
        if (parsed.description) setDescription(parsed.description)
        if (parsed.priority) setPriority(parsed.priority)
        if (parsed.status) setStatus(parsed.status)
        if (parsed.dueDate) setDueDate(new Date(parsed.dueDate))
        if (parsed.projectId) setProjectId(parsed.projectId)
        if (parsed.subtasks) setSubtasks(parsed.subtasks)
        if (parsed.tags) setTags(parsed.tags)
      } catch (e) {
        console.error('Error loading draft:', e)
      }
    }
  }, [])

  // Clear draft after successful submission
  const clearDraft = useCallback(() => {
    localStorage.removeItem('taskDraft')
  }, [])

  // Enhanced handleSubmit with draft clearing
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Format subtasks for the database
      const formattedSubtasks = subtasks.map((st, index) => ({
        title: st.title,
        completed: st.completed,
        position: index
      }))
      
      // Create the task with subtasks as an embedded structure
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          status,
          priority,
          due_date: dueDate?.toISOString(),
          project_id: projectId === 'no_project' ? null : projectId,
          user_id: userId,
          team_id: teamId,
          tags,
          subtasks: formattedSubtasks, // Store subtasks directly in the task
          // Remove fields that don't exist in the database yet
          // estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
          // recurrence: isRecurring ? recurrencePattern : null,
          // assignees,
        })
        .select()
        .single()

      if (error) {
        console.error('Error details:', error)
        throw error
      }

      // No need to insert subtasks separately anymore

      // Create dependencies if any
      if (dependencies.length > 0) {
        const { error: depError } = await supabase
          .from('task_dependencies')
          .insert(
            dependencies.map(depId => ({
              task_id: task.id,
              depends_on_id: depId
            }))
          )

        if (depError) throw depError
      }

      // Store the task as a template for future use
      localStorage.setItem('lastTaskTemplate', JSON.stringify({
        title: '',  // Don't save the actual title
        description: description,
        priority: priority,
        tags: tags,
        subtasks: subtasks.map(st => ({ ...st, title: '' }))  // Don't save actual subtask titles
      }))

      clearDraft() // Clear draft after successful submission
      toast.success('Task created successfully')
      router.push(`/tasks/${task.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initialize keyboard shortcuts after handleSubmit is defined
  useHotkeys('alt+1', () => setActiveTab('details'), { enableOnFormTags: true })
  useHotkeys('alt+2', () => setActiveTab('schedule'), { enableOnFormTags: true })
  useHotkeys('alt+3', () => setActiveTab('subtasks'), { enableOnFormTags: true })
  useHotkeys('alt+4', () => setActiveTab('advanced'), { enableOnFormTags: true })
  useHotkeys('ctrl+enter, cmd+enter', (keyboardEvent) => {
    keyboardEvent.preventDefault();
    handleSubmit();
  }, { enableOnFormTags: true })
  useHotkeys('esc', () => router.back(), { enableOnFormTags: true })
  
  // Additional keyboard shortcuts for quick actions
  useHotkeys('alt+p', () => {
    const priorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent']
    const currentIndex = priorities.indexOf(priority)
    const nextIndex = (currentIndex + 1) % priorities.length
    setPriority(priorities[nextIndex])
  }, { enableOnFormTags: true })

  useHotkeys('alt+d', () => {
    setDueDate(addDays(new Date(), 1))
  }, { enableOnFormTags: true })

  useHotkeys('alt+t', () => {
    handleAddSubtask()
  }, { enableOnFormTags: true })
  
  // Calculate form completion
  useEffect(() => {
    let points = 0
    let total = 5 // Basic required fields
    
    if (title.trim()) points++
    if (status) points++
    if (priority) points++
    if (dueDate) points++
    if (description.trim()) points++
    
    // Optional fields add to total and points if filled
    if (projectId && projectId !== 'no_project') { points++; total++ }
    if (subtasks.length > 0 && subtasks.every(st => st.title.trim() !== '')) { points++; total++ }
    if (tags.length > 0) { points++; total++ }
    if (estimatedTime) { points++; total++ }
    
    setFormCompletion(Math.floor((points / total) * 100))
  }, [title, description, status, priority, dueDate, projectId, subtasks, tags, estimatedTime])
  
  // Focus title input on mount
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

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

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()])
      }
      setNewTag('')
    }
  }

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    
    const items = Array.from(subtasks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setSubtasks(items)
  }

  const generateWithAI = async (type: 'subtasks' | 'description') => {
    if (!title.trim()) {
      toast.error("Please enter a task title first")
      return
    }

    setIsAiGenerating(true)
    try {
      // This is a mock implementation. In a real app, you would call an API
      // that uses an LLM to generate content based on the title and description
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (type === 'subtasks') {
        // Mock AI-generated subtasks
        const generatedSubtasks = [
          { id: crypto.randomUUID(), title: `Research ${title.toLowerCase().includes('research') ? 'options' : 'background'} for ${title}`, completed: false },
          { id: crypto.randomUUID(), title: `Create draft of ${title}`, completed: false },
          { id: crypto.randomUUID(), title: `Review ${title} with team`, completed: false },
          { id: crypto.randomUUID(), title: `Finalize ${title}`, completed: false },
        ]
        setSubtasks([...subtasks, ...generatedSubtasks])
        toast.success("AI generated subtasks for you")
      } else if (type === 'description') {
        // Mock AI-generated description
        setDescription(`<p>This task involves ${title}. The goal is to complete it efficiently while maintaining high quality.</p><ul><li>Make sure to follow best practices</li><li>Collaborate with team members as needed</li><li>Document progress and decisions</li></ul>`)
        toast.success("AI generated description for you")
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error('Failed to generate with AI. Please try again.')
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleDueDatePreset = (days: number, business: boolean = false) => {
    const today = new Date()
    const newDate = business ? addBusinessDays(today, days) : addDays(today, days)
    setDueDate(newDate)
  }

  const getPriorityStyles = (priority: TaskPriority) => {
    switch (priority) {
      case 'Low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Medium':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'High':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      {/* Progress Bar and Form Header */}
      <Card className="overflow-hidden border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mb-4">
            <h1 className="text-2xl font-bold">Create Task</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">
                  {formCompletion}% Complete
                </div>
                <Progress value={formCompletion} className="w-24" />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const template = localStorage.getItem('lastTaskTemplate')
                        if (template) {
                          const parsed = JSON.parse(template)
                          setTitle(parsed.title || '')
                          setDescription(parsed.description || '')
                          setPriority(parsed.priority || 'Medium')
                          setTags(parsed.tags || [])
                          setSubtasks(parsed.subtasks || [])
                          toast.success('Template applied')
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Use Last as Template
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Apply settings from your last task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Title with Voice Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={titleInputRef}
                placeholder={isListening ? 'Listening...' : "What needs to be done? (Press '/' for templates)"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === '/' && !title) {
                    e.preventDefault()
                    // Show template suggestions
                    const templates = ['Daily standup', 'Weekly review', 'Bug fix', 'Feature request']
                    toast.message('Quick templates', {
                      description: (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {templates.map(t => (
                            <Button
                              key={t}
                              variant="outline"
                              size="sm"
                              onClick={() => setTitle(t)}
                            >
                              {t}
                            </Button>
                          ))}
                        </div>
                      )
                    })
                  }
                }}
                className={cn(
                  "flex-1 text-xl font-medium h-12 rounded-lg pr-24",
                  isListening && "ring-2 ring-red-500 animate-pulse"
                )}
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {dueDate && isPast(dueDate) && !isToday(dueDate) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Due date is in the past</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Badge variant={getPriorityVariant(priority)} className="h-6">
                  {priority}
                </Badge>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className="h-12 w-12"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use voice to create task (Alt+M)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDueDatePreset(0)}
              className={cn(
                "text-xs",
                dueDate && isToday(dueDate) && "bg-primary text-primary-foreground"
              )}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDueDatePreset(1)}
              className={cn(
                "text-xs",
                dueDate && isTomorrow(dueDate) && "bg-primary text-primary-foreground"
              )}
            >
              Tomorrow
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDueDatePreset(2, true)}
              className="text-xs"
            >
              In 2 workdays
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDueDatePreset(7)}
              className="text-xs"
            >
              Next week
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextPriority = {
                        Low: 'Medium',
                        Medium: 'High',
                        High: 'Urgent',
                        Urgent: 'Low'
                      }[priority] as TaskPriority
                      setPriority(nextPriority)
                    }}
                    className={cn("text-xs", getPriorityStyles(priority))}
                  >
                    {priority} Priority (Alt+P)
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to change priority</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="sticky top-0 z-10 bg-background pt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="details" className="data-[state=active]:bg-muted">
              Details
              <span className="text-xs ml-1.5 text-muted-foreground">(Alt+1)</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-muted">
              Schedule
              <span className="text-xs ml-1.5 text-muted-foreground">(Alt+2)</span>
            </TabsTrigger>
            <TabsTrigger value="subtasks" className="data-[state=active]:bg-muted">
              Subtasks
              <span className="text-xs ml-1.5 text-muted-foreground">(Alt+3)</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-muted">
              Advanced
              <span className="text-xs ml-1.5 text-muted-foreground">(Alt+4)</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Description</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => generateWithAI('description')}
                    disabled={isAiGenerating || !title.trim()}
                    className="text-xs"
                  >
                    {isAiGenerating ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <BrainCircuit className="h-3 w-3 mr-1" />
                    )}
                    AI Generate
                  </Button>
                </div>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Describe your task in detail..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                    <SelectTrigger className={cn("transition-colors", getPriorityStyles(priority))}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low" className={getPriorityStyles('Low')}>Low</SelectItem>
                      <SelectItem value="Medium" className={getPriorityStyles('Medium')}>Medium</SelectItem>
                      <SelectItem value="High" className={getPriorityStyles('High')}>High</SelectItem>
                      <SelectItem value="Urgent" className={getPriorityStyles('Urgent')}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <label className="text-sm font-medium">Project</label>
                <Select 
                  value={projectId || 'no_project'} 
                  onValueChange={setProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_project">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        No Project
                      </span>
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem 
                        key={project.id} 
                        value={String(project.id) || `project_${project.name.replace(/\s+/g, '_').toLowerCase()}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: project.color || '#888888' }}></span>
                          {project.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Due Date</label>
                    {dueDate && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDueDate(undefined)}
                        className="h-6 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                      <div className="border-t p-3 flex flex-wrap gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDueDatePreset(1)}
                        >
                          Tomorrow
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDueDatePreset(2, true)}
                        >
                          In 2 workdays
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDueDatePreset(7)}
                        >
                          Next week
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <label className="text-sm font-medium">Recurring Task</label>
                  <div className="flex items-center justify-between p-4 rounded-md border">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Repeat this task</span>
                      <span className="text-xs text-muted-foreground">Task will automatically regenerate</span>
                    </div>
                    <Switch
                      checked={isRecurring}
                      onCheckedChange={setIsRecurring}
                    />
                  </div>
                  {isRecurring && (
                    <div className="pt-2">
                      <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">
                            <div className="flex items-center gap-2">
                              <CalendarRange className="h-4 w-4" />
                              <span>Daily</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="weekly">
                            <div className="flex items-center gap-2">
                              <CalendarRange className="h-4 w-4" />
                              <span>Weekly</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <div className="flex items-center gap-2">
                              <CalendarRange className="h-4 w-4" />
                              <span>Monthly</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="yearly">
                            <div className="flex items-center gap-2">
                              <CalendarRange className="h-4 w-4" />
                              <span>Yearly</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <label className="text-sm font-medium">Time Estimation</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="Estimated minutes"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm text-muted-foreground">
                      {estimatedTime ? (
                        <>
                          {parseInt(estimatedTime) >= 60 ? (
                            <span>{Math.floor(parseInt(estimatedTime) / 60)}h {parseInt(estimatedTime) % 60}m</span>
                          ) : (
                            <span>{estimatedTime} minutes</span>
                          )}
                        </>
                      ) : (
                        'Enter estimated completion time'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subtasks Tab */}
        <TabsContent value="subtasks" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Subtasks</label>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => generateWithAI('subtasks')}
                      disabled={isAiGenerating || !title.trim()}
                    >
                      {isAiGenerating ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <BrainCircuit className="h-4 w-4 mr-1" />
                      )}
                      AI Generate
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask}>
                      <Plus className="h-4 w-4 mr-1" /> Add Subtask
                    </Button>
                  </div>
                </div>
                
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="subtasks">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        <AnimatePresence>
                          {subtasks.length === 0 ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-md"
                            >
                              No subtasks yet. Add some to break down your task.
                            </motion.div>
                          ) : (
                            subtasks.map((subtask, index) => (
                              <Draggable key={subtask.id} draggableId={subtask.id} index={index}>
                                {(provided) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-2 bg-card rounded-md border p-1 pr-2"
                                  >
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="cursor-grab p-2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <Input
                                      placeholder="Subtask title"
                                      value={subtask.title}
                                      onChange={(e) => handleSubtaskChange(subtask.id, e.target.value)}
                                      className="border-0 focus-visible:ring-0 px-0"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveSubtask(subtask.id)}
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))
                          )}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  <label className="text-sm font-medium">Tags</label>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <AnimatePresence>
                    {tags.map((tag) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge
                          variant="secondary"
                          className="cursor-pointer flex items-center gap-1 group py-1 px-2"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <span className="opacity-50 group-hover:opacity-100">×</span>
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-24 h-7 text-xs"
                  />
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <div className="text-xs text-muted-foreground mb-1 mr-1">Suggested:</div>
                  {suggestedTags.filter(tag => !tags.includes(tag)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddSuggestedTag(tag)}
                      className="text-xs px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Buttons - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" disabled={isLoading} className="px-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Task
                    <span className="ml-2 text-xs opacity-70">(Ctrl+Enter)</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Press Ctrl+Enter to submit</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </form>
  )
}

// Helper function for priority styling variants
function getPriorityVariant(priority: TaskPriority): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 'Low': return "outline"
    case 'Medium': return "secondary"
    case 'High': return "default"
    case 'Urgent': return "destructive"
    default: return "default"
  }
} 