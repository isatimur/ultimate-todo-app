import React, { useState, useRef } from 'react'
import { Task } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useUser } from '@/lib/hooks/useUser'
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface QuickAddTaskProps {
  onAddTask: (task: Partial<Task>) => Promise<void>
}

export function QuickAddTask({ onAddTask }: QuickAddTaskProps) {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl/Cmd + K to open quick add
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault()
    setIsOpen(true)
  })

  // Enter to submit
  useHotkeys('enter', (e) => {
    if (isOpen && title.trim()) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<Element>)
    }
  }, { enableOnFormTags: true })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAddTask({
        title,
        due_date: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: 'Personal',
        priority: 'Medium',
        status: 'To Do',
        user_id: user?.id || '',
        assignees: [],
        project_id: 'none',
        subtasks: [],
        description: '',
        
      })
      setTitle('')
      setIsOpen(false)
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full justify-between"
        onClick={() => setIsOpen(true)}
      >
        <span className="text-muted-foreground">Quick add task...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Add Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Add task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

