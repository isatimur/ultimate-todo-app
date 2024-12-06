"use client"

import React from 'react'
import { Task } from '@/lib/types'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"

interface TableViewProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
}

export function TableView({ tasks, onTaskUpdate }: TableViewProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns: ColumnDef<Task>[] = [
    {
      id: 'completed',
      header: 'Done',
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.completed}
          onCheckedChange={(checked) => 
            onTaskUpdate(row.original.id, { completed: checked as boolean })
          }
        />
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={
          row.original.priority === 'High' ? 'destructive' :
          row.original.priority === 'Medium' ? 'default' :
          'secondary'
        }>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'date',
      header: 'Date',
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => `${row.original.progress}%`,
    },
  ]

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

