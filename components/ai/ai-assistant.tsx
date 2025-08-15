'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Send, Mic, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  const formatTasks = (tasks: any[], indent = 0): string => {
    return tasks
      .map(
        (task: any) =>
          `${'  '.repeat(indent)}- ${task.title}` +
          (task.tasks ? `\n${formatTasks(task.tasks, indent + 1)}` : '')
      )
      .join('\n')
  }

  const handlePlanGoal = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/project-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: userMessage.content })
      })
      const data = await res.json()
      const content = formatTasks(data.tasks || [])

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Simple mock AI response function
  const getAIResponse = (userInput: string) => {
    const input = userInput.toLowerCase()
    
    if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! How can I help you with your tasks today?'
    }
    
    if (input.includes('task') || input.includes('todo')) {
      return 'I can help you manage your tasks. Would you like me to create a new task, list your current tasks, or help you prioritize them?'
    }
    
    if (input.includes('project')) {
      return 'Projects help you organize related tasks. Would you like to create a new project or see your existing ones?'
    }
    
    return 'I\'m here to help with your tasks and projects. What would you like to do?'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              GPT-4
            </Badge>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 mb-2 text-primary/50" />
              <p className="text-lg font-medium">Ask me anything...</p>
              <p className="text-sm max-w-md mt-1">
                I can help with task management, project organization, and productivity tips.
              </p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id}
                className={cn(
                  "flex flex-col max-w-[80%] rounded-lg p-4",
                  message.role === 'user' 
                    ? "ml-auto bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 ml-auto">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center space-x-2 max-w-[80%] rounded-lg p-4 bg-muted">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                onClick={handlePlanGoal}
                disabled={!input.trim() || isLoading}
              >
                Plan this goal
              </Button>
              <Button
                size="icon"
                variant="outline"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 