'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Send, Bot, Settings2, Sparkles, Brain, History, Eraser } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface AISettings {
  model: string
  temperature: number
  maxTokens: number
  autoSuggest: boolean
  saveHistory: boolean
}

interface AIInteraction {
  id: string
  user_id: string
  prompt: string
  response: string
  created_at: string
  model: string
}

interface AIViewProps {
  userId: string
  settings?: AISettings
  initialHistory: AIInteraction[]
}

export function AIView({ userId, settings: initialSettings, initialHistory }: AIViewProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<AIInteraction[]>(initialHistory)
  const [settings, setSettings] = useState<AISettings>(initialSettings || {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    autoSuggest: true,
    saveHistory: true
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    scrollToBottom()
  }, [history])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    try {
      // Call your AI endpoint
      const response = await fetch('/api/tools/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          settings
        }),
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()

      // Save interaction to history if enabled
      if (settings.saveHistory) {
        const { error } = await supabase
          .from('ai_interactions')
          .insert({
            user_id: userId,
            prompt,
            response: data.response,
            model: settings.model
          })

        if (error) throw error
      }

      setHistory(prev => [{
        id: Date.now().toString(),
        user_id: userId,
        prompt,
        response: data.response,
        created_at: new Date().toISOString(),
        model: settings.model
      }, ...prev])

      setPrompt('')
    } catch (error) {
      console.error('Error getting AI response:', error)
      toast.error('Failed to get AI response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ai_settings: settings
        })

      if (error) throw error

      setIsSettingsOpen(false)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleClearHistory = async () => {
    try {
      const { error } = await supabase
        .from('ai_interactions')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      setHistory([])
      toast.success('History cleared successfully')
    } catch (error) {
      console.error('Error clearing history:', error)
      toast.error('Failed to clear history')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <select
                      className="w-full rounded-md border p-2"
                      value={settings.model}
                      onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                    >
                      <option value="gpt-4">GPT-4 (Most Capable)</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature (Creativity)</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto-suggest completions</Label>
                    <Switch
                      checked={settings.autoSuggest}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSuggest: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Save chat history</Label>
                    <Switch
                      checked={settings.saveHistory}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, saveHistory: checked }))}
                    />
                  </div>

                  <Button className="w-full" onClick={handleSaveSettings}>
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={handleClearHistory}>
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-[400px] overflow-y-auto space-y-4 p-4 border rounded-lg">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2" />
                  <p>No chat history yet. Start a conversation!</p>
                </div>
              ) : (
                <>
                  {history.map((interaction) => (
                    <div key={interaction.id} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/10 rounded-lg p-3 flex-1">
                          <p className="text-sm">{interaction.prompt}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-accent rounded-lg p-3 flex-1">
                          <p className="text-sm whitespace-pre-wrap">{interaction.response}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me anything..."
                className="min-h-[60px]"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !prompt.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 