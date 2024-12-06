"use client"

import React from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from 'lucide-react'
import { TaskCard } from "./task-card"
import type { Column, Task } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface BoardViewProps {
  columns: Column[]
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>
}

export function BoardView({ columns, setColumns }: BoardViewProps) {
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result

    if (!destination) return

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    const newSourceTasks = Array.from(sourceColumn.tasks)
    const newDestTasks = source.droppableId === destination.droppableId 
      ? newSourceTasks 
      : Array.from(destColumn.tasks)

    const [movedTask] = newSourceTasks.splice(source.index, 1)
    newDestTasks.splice(destination.index, 0, movedTask)

    setColumns(prevColumns => 
      prevColumns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: newSourceTasks }
        }
        if (col.id === destination.droppableId) {
          return { ...col, tasks: newDestTasks }
        }
        return col
      })
    )
  }

  const addNewColumn = () => {
    const newColumnId = `column-${Date.now()}`
    setColumns([...columns, { id: newColumnId, title: "New Column", tasks: [] }])
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-end mb-4">
          <Button onClick={addNewColumn} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Column
          </Button>
        </div>
        <div className="flex gap-4 h-full">
          {columns.map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-w-[350px] p-4 rounded-lg ${
                    snapshot.isDraggingOver ? 'bg-secondary' : 'bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={column.title}
                        onChange={(e) => {
                          const newColumns = columns.map(c =>
                            c.id === column.id ? { ...c, title: e.target.value } : c
                          )
                          setColumns(newColumns)
                        }}
                        className="font-medium capitalize bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Badge variant="secondary" className="rounded-full">
                        {column.tasks.length}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setColumns(columns.filter(c => c.id !== column.id))
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.5 : 1,
                            }}
                          >
                            <TaskCard task={task} columnId={column.id} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </div>
    </DragDropContext>
  )
}

