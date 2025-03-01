'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, X, Mic, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Task } from '@/lib/types'
import { parseTaskInput } from '@/lib/task-parser'
import { SpeechRecognitionService } from '@/lib/speech-recognition'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface QuickCaptureFieldProps {
  onAddTask: (task: Partial<Task>) => Promise<void>
}

export function QuickCaptureField({ onAddTask }: QuickCaptureFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [speechService] = useState(() => new SpeechRecognitionService())
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global keyboard shortcut to open the quick capture field
  useHotkeys('alt+q', () => {
    setIsOpen(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, {
    enableOnFormTags: false,
    enableOnContentEditable: false
  })

  // Focus the input when the field is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    try {
      const taskData = parseTaskInput(input)
      await onAddTask(taskData)
      setInput('')
      toast.success('Task created successfully', {
        description: `"${taskData.title}" added for ${new Date(taskData.due_date!).toLocaleDateString()}`,
        icon: <Sparkles className="h-4 w-4" />,
      })
      setIsOpen(false)
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
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

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="sm"
                variant="outline"
                className="rounded-full h-9 w-9 p-0 bg-primary/5 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all"
                onClick={() => setIsOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Quick Add Task</span>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Quick Add Task (Alt+Q)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="relative"
        initial={{ width: "40px" }}
        animate={{ width: "100%" }}
        exit={{ width: "40px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <form 
          onSubmit={handleSubmit}
          className={cn(
            "quick-capture-field flex items-center gap-1 bg-background border rounded-full overflow-hidden pl-3 pr-1 shadow-sm transition-all",
            isFocused && "border-primary shadow-sm ring-1 ring-primary/20"
          )}
        >
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Add task naturally: 'Meeting tomorrow at 3pm'"
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 pl-0"
            disabled={isLoading || isListening}
          />
          
          <div className="flex items-center">
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
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={!input.trim() || isLoading || isListening}
                    className={cn(
                      "h-7 w-7 rounded-full transition-colors",
                      input.trim() && !isLoading && !isListening ? "hover:bg-primary/10 hover:text-primary" : "opacity-50"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Add task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Cancel (Esc)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  )
} 