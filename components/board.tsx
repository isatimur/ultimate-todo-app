"use client"

import React, { useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { TaskCard } from "./task-card"
import { CreateTaskDialog } from "./create-task-dialog"
import type { Column, Task, TaskStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"

const initialColumns: Column[] = [
  {
    id: "todo",
    title: "to do",
    tasks: [
      {
        id: "1",
        title: "Finance Landing Page",
        description: "Create a modern landing page for a finance company with focus on user experience and conversion optimization.",
        priority: "Low",
        date: "31 Oct",
        due_date: "2023-10-31",
        status: "To Do",
        category: "Errands",
        user_id: "user123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recurrence: "None",
      },
    ],
    order: 0
  },
  {
    id: "in-progress",
    title: "In Progress",
    tasks: [
      {
        id: "2",
        title: "Rent Car Mobile Apps",
        priority: "Medium",
        date: "20 Oct",
        due_date: "2023-10-20",
        status: "In Progress",
        category: "Errands",
        user_id: "user123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        recurrence: "None",
        description: "Develop a mobile application for car rental services with booking and payment features.",
      }
    ],
    order: 1
  },
  {
    id: "done",
    title: "Done",
    tasks: [],
    order: 2
  }
];

export function Board() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination, do nothing
    if (!destination) return;

    // If the destination is the same as the source and the index is the same, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the source and destination columns
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // If moving within the same column
    if (sourceColumn.id === destColumn.id) {
      const newTasks = Array.from(sourceColumn.tasks);
      const [movedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, movedTask);

      const newColumn = {
        ...sourceColumn,
        tasks: newTasks,
      };

      setColumns(
        columns.map(col => (col.id === newColumn.id ? newColumn : col))
      );
    } else {
      // Moving from one column to another
      const sourceTasks = Array.from(sourceColumn.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      
      // Update the task's status based on the destination column
      const updatedTask = {
        ...movedTask,
        status: destColumn.title as TaskStatus,
      };
      
      const destTasks = Array.from(destColumn.tasks);
      destTasks.splice(destination.index, 0, updatedTask);

      const newSourceColumn = {
        ...sourceColumn,
        tasks: sourceTasks,
      };

      const newDestColumn = {
        ...destColumn,
        tasks: destTasks,
      };

      setColumns(
        columns.map(col => {
          if (col.id === newSourceColumn.id) return newSourceColumn;
          if (col.id === newDestColumn.id) return newDestColumn;
          return col;
        })
      );
    }
  };

  const handleCreateTask = (newTask: Omit<Task, "id">) => {
    if (!targetColumnId) return;
    
    const column = columns.find(col => col.id === targetColumnId);
    if (!column) return;
    
    const task: Task = {
      ...newTask,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const updatedColumn = {
      ...column,
      tasks: [...column.tasks, task],
    };
    
    setColumns(
      columns.map(col => (col.id === targetColumnId ? updatedColumn : col))
    );
    
    setIsCreateTaskOpen(false);
    setTargetColumnId(null);
  };

  const addNewColumn = () => {
    const newColumnId = `column-${columns.length + 1}`;
    const newColumn: Column = {
      id: newColumnId,
      title: `Column ${columns.length + 1}`,
      tasks: [],
      order: columns.length
    };
    
    setColumns([...columns, newColumn]);
  };

  const openCreateTaskDialog = (columnId: string) => {
    setTargetColumnId(columnId);
    setIsCreateTaskOpen(true);
  };

  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter(col => col.id !== columnId));
  };

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card className="h-full flex flex-col">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium capitalize">{column.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openCreateTaskDialog(column.id)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add task</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => deleteColumn(column.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete column</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </div>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <CardContent
                      className="flex-1 overflow-y-auto p-2"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2"
                            >
                              <TaskCard task={task} columnId={column.id} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            </div>
          ))}
          <div className="flex-shrink-0 w-80">
            <Button
              variant="outline"
              className="h-full w-full border-dashed"
              onClick={addNewColumn}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Column
            </Button>
          </div>
        </div>
      </DragDropContext>
      
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}

