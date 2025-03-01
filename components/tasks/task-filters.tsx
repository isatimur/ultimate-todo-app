'use client'

import { TaskPriority, TaskStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TaskFiltersProps {
  filters: {
    status: TaskStatus[]
    priority: TaskPriority[]
    search: string
  }
  onFiltersChange: (filters: {
    status: TaskStatus[]
    priority: TaskPriority[]
    search: string
  }) => void
}

const defaultFilters = {
  status: [] as TaskStatus[],
  priority: [] as TaskPriority[],
  search: '',
}

export function TaskFilters({ 
  filters = defaultFilters,
  onFiltersChange 
}: TaskFiltersProps) {
  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Complete']
  const priorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent']

  const toggleStatus = (status: TaskStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    onFiltersChange({ ...filters, status: newStatuses })
  }

  const togglePriority = (priority: TaskPriority) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority]
    onFiltersChange({ ...filters, priority: newPriorities })
  }

  const clearFilters = () => {
    onFiltersChange(defaultFilters)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-8 w-[200px]"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Status
            {filters.status.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.status.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statuses.map((status) => (
            <DropdownMenuItem
              key={status}
              onSelect={(e) => {
                e.preventDefault()
                toggleStatus(status)
              }}
              className="flex items-center justify-between"
            >
              {status}
              {filters.status.includes(status) && (
                <Badge variant="secondary">Selected</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Priority
            {filters.priority.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.priority.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {priorities.map((priority) => (
            <DropdownMenuItem
              key={priority}
              onSelect={(e) => {
                e.preventDefault()
                togglePriority(priority)
              }}
              className="flex items-center justify-between"
            >
              {priority}
              {filters.priority.includes(priority) && (
                <Badge variant="secondary">Selected</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {(filters.status.length > 0 || filters.priority.length > 0 || filters.search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
} 