export type TaskPriority = "Low" | "Medium" | "High"
export type TaskCategory = "Work" | "Personal" | "Errands"
export type RecurrencePattern = "Daily" | "Weekly" | "Monthly" | "Yearly" | "None"

export interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  category: TaskCategory
  date: string
  startTime?: string
  endTime?: string
  completed: boolean
  progress: number
  recurrence: RecurrencePattern
  duration?: number // Add this line
}

export interface Column {
  id: string
  title: string
  tasks: Task[]
}

export type View = "board" | "calendar" | "list" | "gantt"

