"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PomodoroTimer } from './pomodoro-timer'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { toast } from 'sonner'
import { Clock, BarChart2, Settings } from 'lucide-react'

interface TimeEntry {
  id: string
  user_id: string
  task_id?: string
  start_time: string
  end_time?: string
  duration: number
  type: 'pomodoro' | 'break' | 'manual'
  notes?: string
}

interface TimerSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
}

interface TimerViewProps {
  userId: string
  initialSettings?: TimerSettings
  initialTimeEntries?: TimeEntry[]
}

export function TimerView({ 
  userId, 
  initialSettings,
  initialTimeEntries = []
}: TimerViewProps) {
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries)
  const [settings, setSettings] = useState<TimerSettings>(initialSettings || {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true
  })
  const [activeTab, setActiveTab] = useState('timer')
  const [isPomodoro, setIsPomodoro] = useState(true)
  const [pomodoroTime, setPomodoroTime] = useState(0)
  const pomodoroRef = useRef<HTMLDivElement>(null)
  const supabase = useSupabase()

  useEffect(() => {
    // Load settings from local storage as fallback
    const savedSettings = localStorage.getItem('timerSettings')
    if (savedSettings && !initialSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [initialSettings])

  const handlePomodoroComplete = async () => {
    try {
      const timeEntry = {
        user_id: userId,
        start_time: new Date(Date.now() - settings.workDuration * 60 * 1000).toISOString(),
        end_time: new Date().toISOString(),
        duration: settings.workDuration * 60,
        type: 'pomodoro' as const
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert(timeEntry)
        .select()
        .single()

      if (error) throw error

      setTimeEntries(prev => [data, ...prev])
      toast.success('Pomodoro completed!')
    } catch (error) {
      console.error('Error saving time entry:', error)
      toast.error('Failed to save time entry')
    }
  }

  const handlePomodoroStart = () => {
    setActiveTimer('pomodoro')
    toast.info('Pomodoro started')
  }

  const handlePomodoroPause = () => {
    setActiveTimer(null)
    toast.info('Pomodoro paused')
  }

  const handlePomodoroReset = () => {
    setActiveTimer(null)
    toast.info('Pomodoro reset')
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTotalTime = (type: TimeEntry['type']): number => {
    return timeEntries
      .filter(entry => entry.type === type)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="timer">
            <Clock className="h-4 w-4 mr-2" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart2 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pomodoro Timer</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={pomodoroRef}>
                <PomodoroTimer
                  isPomodoro={isPomodoro}
                  pomodoroTime={pomodoroTime}
                  pomodoroRef={pomodoroRef}
                  onPomodoroComplete={handlePomodoroComplete}
                  onPomodoroStart={handlePomodoroStart}
                  onPomodoroPause={handlePomodoroPause}
                  onPomodoroReset={handlePomodoroReset}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="font-medium">
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.start_time).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-lg font-mono">
                        {formatTime(entry.duration)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Focus Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(getTotalTime('pomodoro'))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total time spent in Pomodoro sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Break Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(getTotalTime('break'))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total time spent in breaks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timeEntries.filter(entry => entry.type === 'pomodoro').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total Pomodoro sessions completed
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Timer Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Timer settings will be implemented in the next iteration */}
              <p className="text-muted-foreground">Timer settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 