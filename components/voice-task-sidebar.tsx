'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpeechRecognitionService } from '@/lib/speech-recognition'
import { parseTaskInput } from '@/lib/task-parser'
import { Task } from '@/lib/types'
import { 
  Mic, 
  Loader2, 
  X, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Flag, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Wand2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'

interface VoiceTaskSidebarProps {
  onAddTask: (task: Partial<Task>) => Promise<Task | any>
}

export function VoiceTaskSidebar({ onAddTask }: VoiceTaskSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [parsedTask, setParsedTask] = useState<Partial<Task> | null>(null)
  const [speechService] = useState(() => new SpeechRecognitionService())
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const audioContext = useRef<AudioContext | null>(null)
  const analyzer = useRef<AnalyserNode | null>(null)
  const dataArray = useRef<Uint8Array | null>(null)
  const animationFrameId = useRef<number | null>(null)

  // Examples of voice commands for the UI
  const exampleCommands = [
    "Meeting with team tomorrow at 3pm",
    "High priority finish report by Friday",
    "Low priority buy groceries next week",
    "Call client on Monday morning",
    "Plan quarterly review for next month"
  ]

  // Global keyboard shortcut to open the sidebar
  useHotkeys('alt+t', () => {
    setIsOpen(true)
  }, {
    enableOnFormTags: false,
    enableOnContentEditable: false
  })

  useEffect(() => {
    // Initialize audio context for visualization
    if (isListening && !audioContext.current) {
      setupAudioVisualization();
    }

    // Clean up
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      if (audioContext.current) {
        audioContext.current.close().catch(console.error);
        audioContext.current = null;
      }
    };
  }, [isListening]);

  const setupAudioVisualization = async () => {
    try {
      audioContext.current = new AudioContext();
      analyzer.current = audioContext.current.createAnalyser();
      analyzer.current.fftSize = 256;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyzer.current);
      
      const bufferLength = analyzer.current.frequencyBinCount;
      dataArray.current = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (!analyzer.current || !dataArray.current) return;
        
        analyzer.current.getByteFrequencyData(dataArray.current);
        
        // Calculate average level
        const average = dataArray.current.reduce((acc, val) => acc + val, 0) / dataArray.current.length;
        const normalized = Math.min(average / 128, 1); // Normalize to 0-1 range
        setAudioLevel(normalized);
        
        animationFrameId.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  };

  const toggleRecording = async () => {
    try {
      if (!isListening) {
        // Start recording
        await speechService.startRecording();
        setIsListening(true);
        setTranscript('');
        setParsedTask(null);
        toast.info('Listening... Speak your task now', {
          icon: <Mic className="h-4 w-4 text-primary" />
        });
      } else {
        // Stop recording and process speech
        setIsProcessing(true);
        const text = await speechService.stopRecording();
        setTranscript(text);
        
        try {
          const taskData = parseTaskInput(text);
          setParsedTask(taskData);
          
          // Add to recent commands
          setRecentCommands(prev => [text, ...prev.slice(0, 4)]);
          
          toast.success('Task recognized successfully', {
            icon: <Sparkles className="h-4 w-4" />
          });
        } catch (error) {
          console.error('Error parsing task:', error);
          toast.error('Could not understand task. Please try again.', {
            icon: <AlertCircle className="h-4 w-4" />
          });
        }
        
        setIsListening(false);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast.error('Microphone access error. Please check permissions.', {
        icon: <AlertCircle className="h-4 w-4" />
      });
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!parsedTask) return;
    
    setIsProcessing(true);
    try {
      await onAddTask(parsedTask);
      toast.success('Task created successfully', {
        icon: <CheckCircle2 className="h-4 w-4" />
      });
      setTranscript('');
      setParsedTask(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task. Please try again.', {
        icon: <AlertCircle className="h-4 w-4" />
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseExample = (example: string) => {
    setTranscript(example);
    try {
      const taskData = parseTaskInput(example);
      setParsedTask(taskData);
    } catch (error) {
      console.error('Error parsing example task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'status-todo';
      case 'In Progress': return 'status-in-progress';
      case 'In Review': return 'status-in-review';
      case 'Complete': return 'status-complete';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      case 'Urgent': return 'priority-urgent';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <>
      {/* Floating Mic Button */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50 shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            size="lg"
            className={cn(
              "rounded-full p-4 flex items-center justify-center w-14 h-14",
              isOpen 
                ? "bg-muted-foreground/10 hover:bg-muted-foreground/20" 
                : "bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg"
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Mic className={cn(
              "h-6 w-6 transition-colors", 
              isOpen ? "text-foreground" : "text-white"
            )} />
          </Button>
        </motion.div>
      </motion.div>

      {/* Voice Command Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div 
              className="voice-task-sidebar fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-background/95 backdrop-blur-md border-l z-40 shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex flex-col h-full p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <motion.h2 
                    className="text-xl font-semibold flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Wand2 className="h-5 w-5 text-primary" />
                    Voice Task Creator
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Recording Button & Visualization */}
                  <motion.div 
                    className="mb-6 flex items-center flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="relative mb-4"
                      animate={{
                        scale: isListening ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        repeat: isListening ? Infinity : 0,
                        duration: 1.5,
                      }}
                    >
                      {/* Audio Level Visualization */}
                      {isListening && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full border-8 border-primary/10 -z-10"
                            animate={{
                              scale: 1 + audioLevel * 0.3,
                              opacity: 0.3 + audioLevel * 0.7,
                            }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-4 border-primary/20 -z-10"
                            animate={{
                              scale: 1 + audioLevel * 0.6,
                              opacity: 0.2 + audioLevel * 0.5,
                            }}
                          />
                        </>
                      )}
                      
                      <Button
                        size="lg"
                        className={cn(
                          "rounded-full w-20 h-20 flex items-center justify-center",
                          isListening 
                            ? "bg-red-500 hover:bg-red-600 shadow-lg" 
                            : "bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-shadow"
                        )}
                        onClick={toggleRecording}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-10 w-10 text-white animate-spin" />
                        ) : (
                          <Mic className="h-10 w-10 text-white" />
                        )}
                      </Button>
                    </motion.div>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      {isListening 
                        ? "Listening... Click to stop" 
                        : transcript 
                          ? "Ready to create task"
                          : "Click to start recording"}
                    </p>
                  </motion.div>

                  {/* Transcript & Task Preview */}
                  <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                    <AnimatePresence>
                      {transcript && (
                        <motion.div
                          className="border rounded-lg p-4 bg-muted/30"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                          <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                            <Mic className="h-3.5 w-3.5 text-primary" />
                            You said:
                          </h3>
                          <p className="text-md">{transcript}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Task Preview Card */}
                    <AnimatePresence>
                      {parsedTask && (
                        <motion.div
                          className="task-card border rounded-lg overflow-hidden bg-background"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
                        >
                          <div className="task-card-header">
                            <h3 className="font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              Task Preview
                            </h3>
                          </div>
                          
                          <div className="task-card-body space-y-3">
                            <div className="text-lg font-medium">
                              {parsedTask.title}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {parsedTask.status && (
                                <span className={cn(
                                  "status-badge",
                                  getStatusColor(parsedTask.status)
                                )}>
                                  <CheckCircle2 className="h-3 w-3" />
                                  {parsedTask.status}
                                </span>
                              )}
                              
                              {parsedTask.priority && (
                                <span className={cn(
                                  "status-badge",
                                  getPriorityColor(parsedTask.priority)
                                )}>
                                  <Flag className="h-3 w-3" />
                                  {parsedTask.priority} Priority
                                </span>
                              )}
                              
                              {parsedTask.due_date && (
                                <span className="status-badge status-todo">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(parsedTask.due_date).toLocaleDateString()}
                                </span>
                              )}
                              
                              {parsedTask.start_time && (
                                <span className="status-badge status-in-review">
                                  <Clock className="h-3 w-3" />
                                  {parsedTask.start_time}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="task-card-footer flex justify-end">
                            <Button
                              className="gap-1 rounded-full px-4 btn-gradient"
                              onClick={handleCreateTask}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  Create Task
                                  <ChevronRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Example Commands */}
                    <AnimatePresence>
                      {!transcript && (
                        <motion.div
                          className="border rounded-lg p-4 bg-muted/30"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <h3 className="font-medium mb-3 text-sm flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            Try saying:
                          </h3>
                          <ul className="space-y-2">
                            {exampleCommands.map((example, i) => (
                              <motion.li 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start text-sm py-1 h-auto hover:bg-primary/5 hover:text-primary transition-colors"
                                  onClick={() => handleUseExample(example)}
                                >
                                  <span className="truncate">{example}</span>
                                </Button>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Recent Commands */}
                    <AnimatePresence>
                      {recentCommands.length > 0 && (
                        <motion.div
                          className="border rounded-lg p-4 bg-muted/30"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <h3 className="font-medium mb-3 text-sm flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            Recent commands:
                          </h3>
                          <ul className="space-y-2">
                            {recentCommands.map((cmd, i) => (
                              <motion.li 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start text-sm py-1 h-auto text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                                  onClick={() => handleUseExample(cmd)}
                                >
                                  <span className="truncate">{cmd}</span>
                                </Button>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Help Text */}
                <motion.div 
                  className="mt-4 text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <p>You can say things like: "High priority review report tomorrow at 2pm" or "Buy groceries next Saturday"</p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 