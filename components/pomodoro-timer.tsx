"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface PomodoroTimerProps {
  isPomodoro: boolean
  pomodoroTime: number
  pomodoroRef: React.RefObject<HTMLDivElement>
  onPomodoroComplete?: () => void
  onPomodoroStart?: () => void
  onPomodoroPause?: () => void
  onPomodoroReset?: () => void
}

interface PomodoroSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
}

export function PomodoroTimer({
  isPomodoro,
  pomodoroTime,
  pomodoroRef,
  onPomodoroComplete,
  onPomodoroStart,
  onPomodoroPause,
  onPomodoroReset
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true
  })
  const [isWorkTime, setIsWorkTime] = useState(true)
  const timerRef = useRef<NodeJS.Timeout>()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/timer-complete.mp3')
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('pomodoroSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setTimeLeft(pomodoroTime * 60)
  }, [pomodoroTime])

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings))
  }, [settings])

  const playSound = () => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
  }

  const startTimer = () => {
    setIsRunning(true)
    onPomodoroStart?.()
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current)
          setIsRunning(false)
          onPomodoroComplete?.()
          playSound()
          
          // Switch between work and break
          setIsWorkTime((prev) => {
            if (prev) {
              // Work session completed
              const newSessionCount = sessionCount + 1
              setSessionCount(newSessionCount)
              
              // Check if it's time for a long break
              const isLongBreak = newSessionCount % settings.sessionsUntilLongBreak === 0
              const nextDuration = isLongBreak ? settings.longBreakDuration : settings.breakDuration
              
              if (settings.autoStartBreaks) {
                setTimeout(() => startTimer(), 1000)
              }
              
              toast.success(isLongBreak ? 'Time for a long break!' : 'Time for a short break!')
              return false
            } else {
              // Break completed
              if (settings.autoStartPomodoros) {
                setTimeout(() => startTimer(), 1000)
              }
              toast.success('Break complete! Back to work!')
              return true
            }
          })
          
          return isWorkTime ? 
            (sessionCount + 1) % settings.sessionsUntilLongBreak === 0 ? 
              settings.longBreakDuration * 60 : 
              settings.breakDuration * 60 : 
            settings.workDuration * 60
        }
        return prevTime - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRunning(false)
    onPomodoroPause?.()
  }

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setTimeLeft(settings.workDuration * 60)
    setIsRunning(false)
    setIsWorkTime(true)
    setSessionCount(0)
    onPomodoroReset?.()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalSeconds = isWorkTime ? 
      settings.workDuration * 60 : 
      sessionCount % settings.sessionsUntilLongBreak === 0 ?
        settings.longBreakDuration * 60 :
        settings.breakDuration * 60
    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }

  if (!isPomodoro) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.2 }}
      >
        <Card ref={pomodoroRef} className={`absolute bottom-4 right-4 transition-all ${isMinimized ? 'w-[120px]' : 'w-[300px]'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              {!isMinimized && (
                <>
                  Pomodoro Timer
                  <Badge 
                    variant={isWorkTime ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {isWorkTime ? 'Work' : sessionCount % settings.sessionsUntilLongBreak === 0 ? 'Long Break' : 'Break'}
                  </Badge>
                </>
              )}
            </CardTitle>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              {!isMinimized && (
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Timer Settings</DialogTitle>
                      <DialogDescription>
                        Customize your Pomodoro timer preferences
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Work Duration: {settings.workDuration} minutes
                        </label>
                        <Slider
                          value={[settings.workDuration]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, workDuration: value }))}
                          max={60}
                          min={1}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Break Duration: {settings.breakDuration} minutes
                        </label>
                        <Slider
                          value={[settings.breakDuration]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, breakDuration: value }))}
                          max={30}
                          min={1}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Long Break Duration: {settings.longBreakDuration} minutes
                        </label>
                        <Slider
                          value={[settings.longBreakDuration]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, longBreakDuration: value }))}
                          max={45}
                          min={5}
                          step={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Sessions until Long Break: {settings.sessionsUntilLongBreak}
                        </label>
                        <Slider
                          value={[settings.sessionsUntilLongBreak]}
                          onValueChange={([value]) => setSettings(prev => ({ ...prev, sessionsUntilLongBreak: value }))}
                          max={8}
                          min={2}
                          step={1}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-breaks">Auto-start Breaks</Label>
                        <Switch
                          id="auto-breaks"
                          checked={settings.autoStartBreaks}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, autoStartBreaks: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-pomodoros">Auto-start Pomodoros</Label>
                        <Switch
                          id="auto-pomodoros"
                          checked={settings.autoStartPomodoros}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, autoStartPomodoros: checked }))
                          }
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(prev => !prev)}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl font-bold">
                {formatTime(timeLeft)}
              </div>
              {!isMinimized && (
                <>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <motion.div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${getProgress()}%` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${getProgress()}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Session {sessionCount + 1} of {settings.sessionsUntilLongBreak}
                  </div>
                </>
              )}
              <div className="flex space-x-2">
                {!isRunning ? (
                  <Button onClick={startTimer} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={pauseTimer} size="sm" variant="secondary">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                {!isMinimized && (
                  <Button onClick={resetTimer} size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
