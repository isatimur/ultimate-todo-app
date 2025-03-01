import React from 'react'
import { Task } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, X } from 'lucide-react'

interface TaskDetailsProps {
  task: Task
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function TaskDetails({ task, onClose, onEdit, onDelete }: TaskDetailsProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{task.title}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            View and manage task details. You can edit or delete the task using the buttons below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Badge variant="outline">{task.category}</Badge>
            <Badge variant="outline" className="ml-2">{task.priority}</Badge>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span>Date: {task.date}</span>
            <span>Time: {task.startTime} - {task.endTime}</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Progress: {task.progress}%</span>
            <div className="w-full bg-secondary mt-1 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
          <div className="text-sm">
            <span className="font-medium">Recurrence: </span>
            <span className="text-muted-foreground">{task.recurrence}</span>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

