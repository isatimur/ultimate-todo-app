'use client'

import React, { useState, useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard, Command, Search, Mic, Plus, CheckCircle2, Clock, Calendar, Flag, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShortcutItemProps {
  keys: string[]
  description: string
  icon?: React.ReactNode
  category?: string
}

function ShortcutItem({ keys, description, icon, category }: ShortcutItemProps) {
  return (
    <motion.div 
      className="keyboard-shortcut-item flex items-center justify-between py-3"
      whileHover={{ x: 2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
        <span className="text-sm">{description}</span>
      </div>
      <div className="keyboard-shortcut-keys flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="keyboard-key">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-xs text-muted-foreground">+</span>}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  )
}

interface KeyboardShortcutsDialogProps {
  trigger?: React.ReactNode
}

export function KeyboardShortcutsDialog({ trigger }: KeyboardShortcutsDialogProps) {
  const [open, setOpen] = useState(false)
  
  // Global keyboard shortcut to open the dialog
  useHotkeys('alt+/', () => {
    setOpen(true)
  }, {
    enableOnFormTags: false,
    enableOnContentEditable: false
  })
  
  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])
  
  const shortcuts = [
    {
      category: 'Task Capture',
      items: [
        { keys: ['Alt', 'Q'], description: 'Open quick capture field', icon: <Plus className="h-4 w-4" /> },
        { keys: ['Alt', 'T'], description: 'Open voice task sidebar', icon: <Mic className="h-4 w-4" /> },
        { keys: ['Ctrl/⌘', 'K'], description: 'Open quick add task dialog', icon: <Command className="h-4 w-4" /> },
        { keys: ['Ctrl/⌘', 'N'], description: 'Create new task', icon: <Plus className="h-4 w-4" /> },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { keys: ['Alt', 'S'], description: 'Go to search', icon: <Search className="h-4 w-4" /> },
        { keys: ['Alt', '/'], description: 'Show keyboard shortcuts', icon: <Keyboard className="h-4 w-4" /> },
      ]
    },
    {
      category: 'Task Management',
      items: [
        { keys: ['Ctrl/⌘', 'A'], description: 'Select all tasks', icon: <CheckCircle2 className="h-4 w-4" /> },
        { keys: ['Escape'], description: 'Cancel selection/editing', icon: <ArrowRight className="h-4 w-4" /> },
        { keys: ['Enter'], description: 'Save while editing', icon: <CheckCircle2 className="h-4 w-4" /> },
        { keys: ['Delete'], description: 'Delete selected tasks', icon: <ArrowRight className="h-4 w-4" /> },
      ]
    },
    {
      category: 'Task Editing',
      items: [
        { keys: ['Ctrl/⌘', 'E'], description: 'Edit task', icon: <ArrowRight className="h-4 w-4" /> },
        { keys: ['Ctrl/⌘', 'S'], description: 'Save task', icon: <CheckCircle2 className="h-4 w-4" /> },
        { keys: ['Escape'], description: 'Cancel editing', icon: <ArrowRight className="h-4 w-4" /> },
        { keys: ['D'], description: 'Set due date', icon: <Calendar className="h-4 w-4" /> },
        { keys: ['T'], description: 'Set time', icon: <Clock className="h-4 w-4" /> },
        { keys: ['P'], description: 'Set priority', icon: <Flag className="h-4 w-4" /> },
      ]
    }
  ]
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <AnimatePresence>
            {shortcuts.map((category, i) => (
              <motion.div 
                key={i} 
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                  {category.category}
                  <div className="h-px flex-1 bg-border/50"></div>
                </h3>
                <div className="space-y-1">
                  {category.items.map((shortcut, j) => (
                    <ShortcutItem 
                      key={j} 
                      keys={shortcut.keys} 
                      description={shortcut.description}
                      icon={shortcut.icon}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOpen(false)}
            className="rounded-full px-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KeyboardShortcutsButton() {
  return (
    <KeyboardShortcutsDialog
      trigger={
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 rounded-full bg-primary/5 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all"
          >
            <Keyboard className="h-4 w-4" />
            <span className="hidden sm:inline">Keyboard Shortcuts</span>
            <span className="inline sm:hidden">Shortcuts</span>
          </Button>
        </motion.div>
      }
    />
  )
} 