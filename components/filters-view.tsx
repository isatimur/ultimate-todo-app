'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, X, Filter, Star, StarOff } from 'lucide-react'
import { TaskStatus, TaskPriority } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface SavedFilter {
  id: string
  name: string
  user_id: string
  filters: {
    status: TaskStatus[]
    priority: TaskPriority[]
    search: string
  }
  is_default: boolean
  created_at: string
  updated_at: string
}

interface FiltersViewProps {
  userId: string
  initialFilters: SavedFilter[]
}

export function FiltersView({ userId, initialFilters }: FiltersViewProps) {
  const [filters, setFilters] = useState<SavedFilter[]>(initialFilters)
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newFilter, setNewFilter] = useState({
    name: '',
    status: [] as TaskStatus[],
    priority: [] as TaskPriority[],
    search: '',
    is_default: false
  })
  const supabase = createClient()

  const handleCreateFilter = async () => {
    if (!newFilter.name.trim()) {
      toast.error('Please enter a filter name')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          name: newFilter.name,
          user_id: userId,
          filters: {
            status: newFilter.status,
            priority: newFilter.priority,
            search: newFilter.search
          },
          is_default: newFilter.is_default
        })
        .select()
        .single()

      if (error) throw error

      setFilters(prev => [data, ...prev])
      setNewFilter({
        name: '',
        status: [],
        priority: [],
        search: '',
        is_default: false
      })
      setIsDialogOpen(false)
      toast.success('Filter saved successfully')
    } catch (error) {
      console.error('Error creating filter:', error)
      toast.error('Failed to save filter')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFilter = async (id: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id)

      if (error) throw error

      setFilters(prev => prev.filter(filter => filter.id !== id))
      toast.success('Filter deleted successfully')
    } catch (error) {
      console.error('Error deleting filter:', error)
      toast.error('Failed to delete filter')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleDefault = async (filter: SavedFilter) => {
    setIsLoading(true)
    try {
      // If making this filter default, remove default from others
      if (!filter.is_default) {
        await supabase
          .from('saved_filters')
          .update({ is_default: false })
          .eq('user_id', userId)
      }

      const { error } = await supabase
        .from('saved_filters')
        .update({ is_default: !filter.is_default })
        .eq('id', filter.id)

      if (error) throw error

      setFilters(prev => prev.map(f => ({
        ...f,
        is_default: f.id === filter.id ? !f.is_default : false
      })))

      toast.success(`Filter ${filter.is_default ? 'removed from' : 'set as'} default`)
    } catch (error) {
      console.error('Error updating filter:', error)
      toast.error('Failed to update filter')
    } finally {
      setIsLoading(false)
    }
  }

  const statusOptions: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Complete']
  const priorityOptions: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent']

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Saved Filters</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Filter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Filter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Filter Name</Label>
                <Input
                  id="name"
                  value={newFilter.name}
                  onChange={(e) => setNewFilter(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Filter"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newFilter.status.includes(status)}
                        onCheckedChange={(checked) => {
                          setNewFilter(prev => ({
                            ...prev,
                            status: checked
                              ? [...prev.status, status]
                              : prev.status.filter(s => s !== status)
                          }))
                        }}
                      />
                      <Label>{status}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="grid grid-cols-2 gap-2">
                  {priorityOptions.map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newFilter.priority.includes(priority)}
                        onCheckedChange={(checked) => {
                          setNewFilter(prev => ({
                            ...prev,
                            priority: checked
                              ? [...prev.priority, priority]
                              : prev.priority.filter(p => p !== priority)
                          }))
                        }}
                      />
                      <Label>{priority}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Search Term</Label>
                <Input
                  id="search"
                  value={newFilter.search}
                  onChange={(e) => setNewFilter(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search keywords"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  checked={newFilter.is_default}
                  onCheckedChange={(checked) => 
                    setNewFilter(prev => ({ ...prev, is_default: checked as boolean }))
                  }
                />
                <Label>Set as default filter</Label>
              </div>

              <Button
                className="w-full"
                onClick={handleCreateFilter}
                disabled={isLoading || !newFilter.name.trim()}
              >
                Save Filter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2" />
              <p>No saved filters yet. Create your first filter preset!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{filter.name}</h3>
                      {filter.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {filter.filters.status.length > 0 && (
                        <Badge variant="outline">
                          Status: {filter.filters.status.join(', ')}
                        </Badge>
                      )}
                      {filter.filters.priority.length > 0 && (
                        <Badge variant="outline">
                          Priority: {filter.filters.priority.join(', ')}
                        </Badge>
                      )}
                      {filter.filters.search && (
                        <Badge variant="outline">
                          Search: {filter.filters.search}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleDefault(filter)}
                      disabled={isLoading}
                    >
                      {filter.is_default ? (
                        <Star className="h-4 w-4 fill-primary" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFilter(filter.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 