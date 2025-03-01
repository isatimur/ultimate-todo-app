"use client"

import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, MoreHorizontal } from 'lucide-react'
import Image from "next/image"
import type { Task } from "@/lib/types"
import { useDraggable } from "@dnd-kit/core"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"

interface TaskCardProps {
  task: Task
  columnId: string
}

export function TaskCard({ task, columnId }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: {
      task,
      fromColumnId: columnId
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="touch-none"
        >
          <Card className="cursor-grab active:cursor-grabbing">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
                  {task.priority}
                </Badge>
                <Badge variant="outline">{task.category}</Badge>
              </div>
              <CardTitle className="text-base">{task.title}</CardTitle>
              {/* {task.thumbnail && (
                <div className="relative h-40 rounded-lg overflow-hidden">
                  <Image
                    src={task.thumbnail}
                    alt={task.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )} */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {/* {Array(task.assignees).fill(0).map((_, i) => (
                    <Avatar key={i} className="border-2 border-background w-8 h-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  ))} 
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{task.date}</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {task.comments}
                  </div>*/}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            View task details including priority, category, and other information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
              {task.priority}
            </Badge>
            <Badge variant="outline">{task.category}</Badge>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {/* {Array(task.assignees).fill(0).map((_, i) => (
                <Avatar key={i} className="border-2 border-background w-8 h-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{task.date}</span>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {task.comments}
              </div>*/}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

