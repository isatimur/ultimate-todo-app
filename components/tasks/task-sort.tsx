'use client'

import { Button } from '@/components/ui/button'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TaskSortProps {
  sortConfig: {
    key: string
    direction: 'asc' | 'desc'
  }
  onSortChange: (config: {
    key: string
    direction: 'asc' | 'desc'
  }) => void
}

export function TaskSort({ sortConfig, onSortChange }: TaskSortProps) {
  const sortOptions = [
    { key: 'created_at', label: 'Creation Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'priority', label: 'Priority' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
  ]

  const toggleDirection = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  const currentOption = sortOptions.find(option => option.key === sortConfig.key)

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Sort by: {currentOption?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuLabel>Sort Tasks By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.key}
              onSelect={() => onSortChange({ key: option.key, direction: sortConfig.direction })}
              className="flex items-center justify-between"
            >
              {option.label}
              {sortConfig.key === option.key && (
                sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleDirection}
        className="px-2"
      >
        {sortConfig.direction === 'asc' ? (
          <ArrowUpIcon className="h-4 w-4" />
        ) : (
          <ArrowDownIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
} 