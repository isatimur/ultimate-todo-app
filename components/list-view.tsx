import React from 'react'
import { Task } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface ListViewProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
}

export function ListView({ tasks, onTaskUpdate }: ListViewProps) {
  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Done</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => 
                    onTaskUpdate(task.id, { completed: checked as boolean })
                  }
                />
              </TableCell>
              <TableCell>{task.title}</TableCell>
              <TableCell>
                <Badge variant={
                  task.priority === 'High' ? 'destructive' :
                  task.priority === 'Medium' ? 'default' :
                  'secondary'
                }>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>{task.category}</TableCell>
              <TableCell>{task.date}</TableCell>
              <TableCell>{task.progress}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

