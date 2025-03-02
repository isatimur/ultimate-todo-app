'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, X, Tag } from 'lucide-react'

interface TagsViewProps {
  userId: string
  initialTags: string[]
}

export function TagsView({ userId, initialTags }: TagsViewProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      }, () => {
        // Refresh tags when tasks are updated
        fetchTags()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchTags = async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('tags')
        .eq('user_id', userId)

      if (error) throw error

      const uniqueTags = Array.from(new Set(
        tasks
          .flatMap(task => task.tags || [])
          .filter(Boolean)
      ))

      setTags(uniqueTags)
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error('Failed to fetch tags')
    }
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return

    setIsLoading(true)
    try {
      // Update all tasks that have this tag
      const { error } = await supabase
        .from('tasks')
        .update({ tags: [...tags, newTag] })
        .eq('user_id', userId)
        .is('tags', null)

      if (error) throw error

      setTags(prev => [...prev, newTag])
      setNewTag('')
      toast.success('Tag added successfully')
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error('Failed to add tag')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTag = async (tagToDelete: string) => {
    setIsLoading(true)
    try {
      // Remove tag from all tasks that have it
      const { data: tasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id, tags')
        .eq('user_id', userId)
        .contains('tags', [tagToDelete])

      if (fetchError) throw fetchError

      // Update each task to remove the tag
      for (const task of tasks) {
        const updatedTags = (task.tags || []).filter((tag: string) => tag !== tagToDelete)
        const { error } = await supabase
          .from('tasks')
          .update({ tags: updatedTags })
          .eq('id', task.id)

        if (error) throw error
      }

      setTags(prev => prev.filter(tag => tag !== tagToDelete))
      toast.success('Tag deleted successfully')
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTag} className="flex gap-2 mb-6">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Enter new tag"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !newTag.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </form>

        <div className="space-y-4">
          {tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-2" />
              <p>No tags yet. Create your first tag to organize your tasks!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-sm py-1 px-2 flex items-center gap-1"
                >
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleDeleteTag(tag)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 