import React from 'react'
import { Task } from '@/lib/types'
import { motion } from 'framer-motion'

interface WeekViewProps {
  currentDate: Date
  tasks: Task[]
  onTaskClick: (task: Task) => void
  getTaskColor: (category: Task['category']) => string
}

export function WeekView({ currentDate, tasks, onTaskClick, getTaskColor }: WeekViewProps) {
  const weekDays = [
    { key: 'sunday', label: 'Sun' },
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' }
  ]
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDates = weekDays.map((_, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)
    return date
  })

  return (
    <div className="grid grid-cols-8 gap-px bg-border p-4">
      <div className="bg-background p-3 text-center text-sm font-medium text-muted-foreground">
        Time
      </div>
      {weekDays.map((day, index) => (
        <div key={day.key} className="bg-background p-3 text-center text-sm font-medium text-muted-foreground">
          {day.label} {weekDates[index].getDate()}
        </div>
      ))}
      {timeSlots.map((hour) => (
        <React.Fragment key={hour}>
          <div className="bg-background p-2 text-right text-xs text-muted-foreground">
            {hour.toString().padStart(2, '0')}:00
          </div>
          {weekDates.map((date) => {
            const cellDate = new Date(date)
            cellDate.setHours(hour)
            const cellTasks = tasks.filter(
              (task) =>
                new Date(task.date).toDateString() === cellDate.toDateString() &&
                parseInt(task.startTime?.split(':')[0] || '0') === hour
            )

            return (
              <div key={cellDate.toISOString()} className="bg-card p-1 min-h-[60px] relative">
                {cellTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`text-xs p-1 mb-1 rounded-md cursor-pointer ${getTaskColor(task.category)}`}
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="font-medium truncate">{task.title}</div>
                    <div className="text-[10px] opacity-80">{task.startTime} - {task.endTime}</div>
                  </motion.div>
                ))}
              </div>
            )
          })}
        </React.Fragment>
      ))}
    </div>
  )
}

