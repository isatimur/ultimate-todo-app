"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calendar } from 'lucide-react'
import { TaskCard } from "./task-card"
import type { Column, Task, TaskStatus, TaskTemplate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { QuickAddTaskBar } from "./quick-add-task-bar"

interface BoardTaskCardProps {
  task: Task;
  columnId: string;
  onTaskUpdate: (taskId: string | number, updates: Partial<Task>) => Promise<void>;
  onTaskDelete: (id: string | number) => Promise<void>;
  onTaskStatusChange: (id: string | number) => Promise<void>;
  projects: any[];
}

function BoardTaskCard({ task, columnId, onTaskUpdate, onTaskDelete, onTaskStatusChange, projects }: BoardTaskCardProps) {
  return (
    <div className="relative group">
      <TaskCard task={task} columnId={columnId} />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onTaskStatusChange(task.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={() => onTaskDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const getStatusFromColumnId = (columnId: string): TaskStatus => {
  switch (columnId) {
    case 'backlog':
      return 'To Do';
    case 'todo':
      return 'To Do';
    case 'in-progress':
      return 'In Progress';
    case 'in-review':
      return 'In Review';
    case 'complete':
      return 'Complete';
    default:
      return 'To Do';
  }
};

interface BoardViewProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string | number, updates: Partial<Task>) => Promise<void>
  onTaskDelete: (id: string | number) => Promise<void>
  onTaskStatusChange: (id: string | number) => Promise<void>
  projects: any[]
  onAddTask: (task: Partial<Task>) => Promise<void>
  templates?: TaskTemplate[]
  getAISuggestions?: (input: string) => Promise<Partial<Task>[]>
}

export function BoardView({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskStatusChange,
  projects,
  onAddTask,
  templates = [],
  getAISuggestions
}: BoardViewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAddTask = useCallback(async (task: Partial<Task>) => {
    try {
      await onAddTask(task)
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }, [onAddTask])

  const columns = useMemo(() => {
    const baseColumns = [
      {
        id: 'backlog',
        title: 'Backlog',
        tasks: [],
        order: 0
      },
      {
        id: 'todo',
        title: 'To Do',
        tasks: [],
        order: 1
      },
      {
        id: 'in-progress',
        title: 'In Progress',
        tasks: [],
        order: 2
      },
      {
        id: 'in-review',
        title: 'In Review',
        tasks: [],
        order: 3
      },
      {
        id: 'complete',
        title: 'Complete',
        tasks: [],
        order: 4
      }
    ];

    return baseColumns.map(column => ({
      ...column,
      tasks: tasks.filter(task => {
        switch (column.id) {
          case 'backlog':
            return !task.status || (task.status as string | undefined | null) === '';
          case 'todo':
            return task.status === 'To Do';
          case 'in-progress':
            return task.status === 'In Progress';
          case 'in-review':
            return task.status === 'In Review';
          case 'complete':
            return task.status === 'Complete';
          default:
            return false;
        }
      })
    }));
  }, [tasks]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Find the task being dragged
    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    const task = sourceColumn.tasks[source.index]
    if (!task) return

    try {
      // If moving to a different column, update the task status
      if (sourceColumn.id !== destColumn.id) {
        const newStatus = getStatusFromColumnId(destColumn.id)
        await onTaskUpdate(task.id, {
          status: newStatus
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task status')
    }
  }, [columns, onTaskUpdate])

  if (!mounted) {
    return (
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col w-80 shrink-0 rounded-lg animate-pulse">
            <div className="h-[60px] bg-muted/50 rounded-t-lg" />
            <div className="h-[400px] bg-muted/30 rounded-b-lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <div
              key={column.id}
              className={cn(
                "flex flex-col w-80 shrink-0 rounded-lg"
              )}
            >
              <div
                className="bg-muted/50 p-4 rounded-t-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="text-muted-foreground text-sm">
                    {column.tasks.length}
                  </span>
                </div>
              </div>
              <Droppable droppableId={column.id} type="task">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 p-4 space-y-4 bg-muted/30 rounded-b-lg min-h-[200px]",
                      snapshot.isDraggingOver && "bg-muted/50"
                    )}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              snapshot.isDragging && "opacity-70"
                            )}
                          >
                            <BoardTaskCard
                              task={task}
                              columnId={column.id}
                              onTaskUpdate={onTaskUpdate}
                              onTaskDelete={onTaskDelete}
                              onTaskStatusChange={onTaskStatusChange}
                              projects={projects}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <QuickAddTaskBar
                      key={`${column.id}-quick-add`}
                      columnId={column.id}
                      onAddTask={handleAddTask}
                      templates={templates}
                      getAISuggestions={getAISuggestions}
                      projects={projects}
                    />
                  </div>
                )}
              </Droppable>
            </div>
          ))}
      </div>
    </DragDropContext>
  )
}

