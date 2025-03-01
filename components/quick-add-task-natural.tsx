import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mic, Send, Loader2, Sparkles, Clock, Calendar, ListChecks, Wand2 } from 'lucide-react'
import { Task } from '@/lib/types'
import { toast } from 'sonner'
import { parseTaskInput } from '@/lib/task-parser'
import { SpeechRecognitionService } from '@/lib/speech-recognition'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface QuickAddTaskNaturalProps {
  onAddTask: (task: Partial<Task>) => Promise<void>
}

export function QuickAddTaskNatural({ onAddTask }: QuickAddTaskNaturalProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [speechService] = useState(() => new SpeechRecognitionService())
  const [parsedPreview, setParsedPreview] = useState<Partial<Task> | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [parsedBatchTasks, setParsedBatchTasks] = useState<Partial<Task>[]>([])

  // Preview parsing as user types
  useEffect(() => {
    if (input.trim()) {
      try {
        if (batchMode) {
          // In batch mode, try to parse multiple tasks
          const tasks = parseBatchInput(input)
          setParsedBatchTasks(tasks)
          setParsedPreview(null)
        } else {
          // In single mode, parse as one task
          const parsed = parseTaskInput(input)
          setParsedPreview(parsed)
          setParsedBatchTasks([])
        }
      } catch {
        setParsedPreview(null)
        if (batchMode) {
          setParsedBatchTasks([])
        }
      }
    } else {
      setParsedPreview(null)
      setParsedBatchTasks([])
    }
  }, [input, batchMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) {
      toast.error('Please enter a task description')
      return
    }

    setIsLoading(true)
    try {
      if (batchMode) {
        // Handle batch task creation
        const tasks = parseBatchInput(input)
        if (tasks.length === 0) {
          throw new Error('Could not parse any tasks from input')
        }
        
        // Create all tasks sequentially
        for (const task of tasks) {
          await onAddTask(task)
        }
        
        toast.success(`${tasks.length} tasks created successfully`, {
          description: `Created ${tasks.length} tasks from your input`,
          icon: <Sparkles className="h-4 w-4" />,
        })
      } else {
        // Handle single task creation
        const taskData = parseTaskInput(input)
        console.log('Submitting task data:', taskData)
        await onAddTask(taskData)
        toast.success('Task created successfully', {
          description: `"${taskData.title}" added for ${new Date(taskData.due_date!).toLocaleDateString()}`,
          icon: <Sparkles className="h-4 w-4" />,
        })
      }
      
      setInput('')
      setParsedPreview(null)
      setParsedBatchTasks([])
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Could not create task. Please try again with a different description.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !batchMode) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleRecording = async () => {
    try {
      if (!isListening) {
        await speechService.startRecording()
        setIsListening(true)
        toast.info('Listening... Click the mic again to stop.', {
          icon: <Mic className="h-4 w-4 text-primary animate-pulse" />,
        })
      } else {
        setIsLoading(true)
        const text = await speechService.stopRecording()
        setInput(text)
        setIsListening(false)
        toast.success('Speech recognized successfully', {
          icon: <Sparkles className="h-4 w-4" />,
        })
      }
    } catch (error) {
      console.error('Speech recognition error:', error)
      toast.error('Failed to process speech. Please try again.')
      setIsListening(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (speechService.isCurrentlyRecording()) {
        speechService.stopRecording().catch(console.error)
      }
    }
  }, [speechService])

  /**
   * Parse batch input into multiple tasks
   * Splits input by common delimiters like newlines, semicolons, or "then"
   */
  const parseBatchInput = (input: string): Partial<Task>[] => {
    if (!input.trim()) return []
    
    // Split by common delimiters
    let taskStrings: string[] = []
    
    // First try to split by newlines
    if (input.includes('\n')) {
      taskStrings = input.split('\n').filter(line => line.trim().length > 0)
    } 
    // Then try to split by semicolons
    else if (input.includes(';')) {
      taskStrings = input.split(';').filter(item => item.trim().length > 0)
    }
    // Then try to split by "then" keyword
    else if (input.toLowerCase().includes(' then ')) {
      taskStrings = input.split(/\s+then\s+/i).filter(item => item.trim().length > 0)
    }
    // Then try to split by "and" if it appears to be a list
    else if (input.toLowerCase().match(/\b(and)\b/g)?.length >= 2) {
      taskStrings = input.split(/\s+and\s+/i).filter(item => item.trim().length > 0)
    }
    // Then try to split by commas if there are multiple
    else if ((input.match(/,/g) || []).length >= 2) {
      taskStrings = input.split(',').filter(item => item.trim().length > 0)
    }
    // If no delimiters found, treat as a single task
    else {
      taskStrings = [input]
    }
    
    // Parse each task string
    const tasks: Partial<Task>[] = []
    for (const taskString of taskStrings) {
      try {
        const task = parseTaskInput(taskString.trim())
        tasks.push(task)
      } catch (error) {
        console.warn('Could not parse task:', taskString, error)
        // Continue with other tasks even if one fails
      }
    }
    
    return tasks
  }

  return (
    <motion.div 
      className="w-full space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          Quick Add Task
        </h3>
        <div className="flex items-center space-x-2">
          <Switch
            id="batch-mode"
            checked={batchMode}
            onCheckedChange={setBatchMode}
          />
          <Label htmlFor="batch-mode" className="text-xs">Batch Mode</Label>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        {batchMode ? (
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter multiple tasks separated by lines, semicolons, or 'then'"
            className="min-h-[120px] text-sm resize-none focus-visible:ring-primary/20"
          />
        ) : (
          <div className="quick-capture-field flex items-center gap-1 bg-background border rounded-full overflow-hidden pl-3 pr-1 shadow-sm transition-all focus-within:border-primary focus-within:shadow-sm focus-within:ring-1 focus-within:ring-primary/20">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add task naturally: 'Meeting with team tomorrow at 3pm'"
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 pl-0"
              disabled={isLoading || isListening}
            />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={cn(
                      "h-7 w-7 rounded-full transition-colors",
                      isListening ? "text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse" : "hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{isListening ? "Stop recording" : "Record voice input"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {!batchMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={cn(
                      "flex-shrink-0 rounded-full h-9 w-9",
                      isListening ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    {isListening ? (
                      <span className="animate-pulse">
                        <Mic className="h-4 w-4" />
                      </span>
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isListening ? "Stop recording" : "Record voice input"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              type="submit"
              className={cn(
                "w-full rounded-full",
                batchMode ? "btn-gradient" : ""
              )}
              disabled={isLoading || isListening || !input.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : batchMode ? (
                <>
                  <ListChecks className="mr-2 h-4 w-4" />
                  Add Tasks ({parsedBatchTasks.length})
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </form>

      {/* Preview for single task */}
      <AnimatePresence>
        {parsedPreview && !batchMode && (
          <motion.div 
            className="task-card rounded-md border p-3 text-xs"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-medium">{parsedPreview.title}</div>
            <div className="flex items-center mt-1 text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{new Date(parsedPreview.due_date!).toLocaleDateString()}</span>
              {parsedPreview.start_time && (
                <>
                  <Clock className="h-3 w-3 ml-2 mr-1" />
                  <span>{parsedPreview.start_time}</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview for batch tasks */}
      <AnimatePresence>
        {batchMode && parsedBatchTasks.length > 0 && (
          <motion.div 
            className="task-card rounded-md border p-3 text-xs max-h-40 overflow-y-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" />
              Detected {parsedBatchTasks.length} tasks:
            </div>
            <ul className="space-y-1.5">
              {parsedBatchTasks.map((task, index) => (
                <motion.li 
                  key={index} 
                  className="flex items-center"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="w-5 h-5 flex items-center justify-center bg-primary/10 text-primary rounded-full text-[10px] mr-2 font-medium">
                    {index + 1}
                  </span>
                  <span className="truncate">{task.title}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 