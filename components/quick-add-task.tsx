import React, { useState } from 'react'
import { Task } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

interface QuickAddTaskProps {
  onAddTask: (task: Omit<Task, 'id'>) => void
}

export function QuickAddTask({ onAddTask }: QuickAddTaskProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAddTask({
        title,
        date: new Date().toISOString().split('T')[0],
        category: 'Personal',
        priority: 'Medium',
        completed: false,
        progress: 0,
        recurrence: 'None',
      })
      setTitle('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="Quick add task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit" size="sm" className="shrink-0">
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  )
}

