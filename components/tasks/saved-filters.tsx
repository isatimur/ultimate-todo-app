'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Bookmark, Save, Star, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { TaskStatus, TaskPriority } from '@/lib/types'

interface SavedFilter {
  id: string
  name: string
  filters: {
    status: TaskStatus[]
    priority: TaskPriority[]
    search: string
  }
  is_default: boolean
}

interface SavedFiltersProps {
  currentFilters: {
    status: TaskStatus[]
    priority: TaskPriority[]
    search: string
  }
  onFilterSelect: (filters: SavedFilter['filters']) => void
}

export function SavedFilters({ currentFilters, onFilterSelect }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newFilterName, setNewFilterName] = useState('')
  const [makeDefault, setMakeDefault] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSavedFilters()
  }, [])

  const loadSavedFilters = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedFilters(data)
    } catch (error) {
      console.error('Error loading saved filters:', error)
      toast.error('Failed to load saved filters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFilter = async () => {
    try {
      if (!newFilterName.trim()) {
        toast.error('Please enter a filter name')
        return
      }

      const newFilter = {
        name: newFilterName.trim(),
        filters: currentFilters,
        is_default: makeDefault
      }

      // If making this filter default, remove default from others
      if (makeDefault) {
        await supabase
          .from('saved_filters')
          .update({ is_default: false })
          .eq('is_default', true)
      }

      const { error } = await supabase
        .from('saved_filters')
        .insert([newFilter])

      if (error) throw error

      toast.success('Filter saved successfully')
      setSaveDialogOpen(false)
      setNewFilterName('')
      setMakeDefault(false)
      loadSavedFilters()
    } catch (error) {
      console.error('Error saving filter:', error)
      toast.error('Failed to save filter')
    }
  }

  const handleDeleteFilter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Filter deleted successfully')
      loadSavedFilters()
    } catch (error) {
      console.error('Error deleting filter:', error)
      toast.error('Failed to delete filter')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all filters
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('is_default', true)

      // Set new default
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      toast.success('Default filter updated')
      loadSavedFilters()
    } catch (error) {
      console.error('Error setting default filter:', error)
      toast.error('Failed to set default filter')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Filters
            {savedFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {savedFilters.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {savedFilters.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No saved filters yet
            </div>
          ) : (
            savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between"
                onSelect={(e) => {
                  e.preventDefault()
                  onFilterSelect(filter.filters)
                }}
              >
                <div className="flex items-center gap-2">
                  {filter.is_default && <Star className="h-4 w-4 text-yellow-500" />}
                  <span>{filter.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {!filter.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetDefault(filter.id)
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFilter(filter.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Current Filter
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter settings for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Filter Name</Label>
              <Input
                id="name"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="Enter a name for this filter"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="makeDefault"
                checked={makeDefault}
                onChange={(e) => setMakeDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="makeDefault">Set as default filter</Label>
            </div>
            <div className="space-y-2">
              <Label>Current Filter Settings</Label>
              <div className="rounded-md border p-4 space-y-2">
                {currentFilters.status.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {currentFilters.status.map((status) => (
                      <Badge key={status} variant="secondary">
                        {status}
                      </Badge>
                    ))}
                  </div>
                )}
                {currentFilters.priority.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Priority:</span>
                    {currentFilters.priority.map((priority) => (
                      <Badge key={priority} variant="secondary">
                        {priority}
                      </Badge>
                    ))}
                  </div>
                )}
                {currentFilters.search && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Badge variant="secondary">{currentFilters.search}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter}>Save Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 