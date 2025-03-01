"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MiniMonthProps {
  currentDate: Date
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function MiniMonth({
  currentDate,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth
}: MiniMonthProps) {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const isToday = date.toDateString() === new Date().toDateString()
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()

      days.push(
        <Button
          key={day}
          variant="ghost"
          className={cn(
            "h-8 w-8 p-0 font-normal",
            isToday && "bg-muted text-muted-foreground",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            !isToday && !isSelected && "hover:bg-muted"
          )}
          onClick={() => onDateSelect(date)}
        >
          {day}
        </Button>
      )
    }

    return days
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {weekDays.map((day) => (
          <div key={day} className="h-8 font-medium">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>
    </div>
  )
}

