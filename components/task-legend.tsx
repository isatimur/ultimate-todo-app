import React from 'react'
import { Badge } from '@/components/ui/badge'

export function TaskLegend() {
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-medium mb-2">Task Priority</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-red-500">High</Badge>
          <span className="text-sm text-muted-foreground">Urgent tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-500">Medium</Badge>
          <span className="text-sm text-muted-foreground">Important tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-500">Low</Badge>
          <span className="text-sm text-muted-foreground">Regular tasks</span>
        </div>
      </div>
    </div>
  )
}

