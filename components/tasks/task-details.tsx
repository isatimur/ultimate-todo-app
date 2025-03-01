'use client'

import { useState } from 'react'
import { Task } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Save
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface TaskDetailsProps {
  task: Task & {
    subtasks?: {
      id: string
      title: string
      completed: boolean
    }[]
  }
}

export function TaskDetails({ task: initialTask }: TaskDetailsProps) {
  const [task, setTask] = useState(initialTask)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description || '')
  const [editedDueDate, setEditedDueDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  )
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleStatusChange = async (checked: boolean) => {
    setIsLoading(true)
    try {
      const newStatus = checked ? 'Complete' : 'To Do'
      const updates = {
        status: newStatus,
        completed: checked,
        completed_at: checked ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id)

      if (error) throw error

      setTask(prev => ({ ...prev, ...updates }))
      toast.success(checked ? 'Task completed!' : 'Task reopened')
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    try {
      const updates = {
        title: editedTitle,
        description: editedDescription,
        due_date: editedDueDate?.toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', task.id)

      if (error) throw error

      setTask(prev => ({ ...prev, ...updates }))
      setIsEditing(false)
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error

      toast.success('Task deleted successfully')
      router.push('/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    } finally {
      setIsLoading(false)
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-start gap-4 flex-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleStatusChange}
              disabled={isLoading}
            />
            <div className="space-y-1 flex-1">
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-semibold"
                />
              ) : (
                <h2 className={`text-xl font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </h2>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>
                  {task.priority}
                </Badge>
                <Badge variant="outline">
                  {task.status}
                </Badge>
                {task.project_details && (
                  <Badge 
                    variant="outline"
                    style={{
                      backgroundColor: task.project_details.color + '10',
                      borderColor: task.project_details.color
                    }}
                  >
                    {task.project_details.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <CardTitle className="text-sm font-medium">Description</CardTitle>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add a description..."
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <DatePicker
                  date={editedDueDate}
                  setDate={setEditedDueDate}
                />
              ) : (
                <span className={isOverdue ? 'text-destructive' : ''}>
                  Due {task.due_date ? formatDistanceToNow(new Date(task.due_date), { addSuffix: true }) : 'No due date'}
                </span>
              )}
            </div>
            {task.time_tracked > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{task.time_tracked}h tracked</span>
              </div>
            )}
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2">
              <CardTitle className="text-sm font-medium">Subtasks</CardTitle>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={subtask.completed}
                      disabled
                    />
                    <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </div>
            {task.completed && task.completed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
              </div>
            )}
            {isOverdue && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Overdue
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 