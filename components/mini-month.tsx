import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MiniMonthProps {
  currentDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export function MiniMonth({ currentDate, selectedDate, onDateSelect }: MiniMonthProps) {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDayOfMonth = getFirstDayOfMonth(currentDate)
  const monthYear = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => null)
  const allDays = [...blanks, ...days]

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const handlePrevMonth = () => {
    onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    onDateSelect(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <div className="bg-card rounded-lg p-2 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{monthYear}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-6 w-6 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-6 w-6 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekDays.map((day) => (
          <div key={day} className="font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {allDays.map((day, index) => {
          if (day === null) {
            return <div key={`blank-${index}`} />
          }

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
          const isToday = date.toDateString() === new Date().toDateString()
          const isSelected = date.toDateString() === selectedDate.toDateString()

          return (
            <Button
              key={date.getTime()}
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${isSelected ? 'bg-primary text-primary-foreground' : ''} ${
                isToday ? 'text-primary' : ''
              }`}
              onClick={() => onDateSelect(date)}
            >
              {day}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

