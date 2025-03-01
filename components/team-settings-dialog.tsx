"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase-browser'

interface TeamSettingsDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

export function TeamSettingsDialog({
  teamId,
  open,
  onOpenChange,
  onClose,
}: TeamSettingsDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const supabase = createClient()

  React.useEffect(() => {
    if (open && teamId) {
      loadTeamData()
    }
  }, [open, teamId])

  const loadTeamData = async () => {
    try {
      setIsLoading(true)
      const { data: team, error } = await supabase
        .from('teams')
        .select('name, description')
        .eq('id', teamId)
        .single()

      if (error) throw error

      if (team) {
        setName(team.name)
        setDescription(team.description || '')
      }
    } catch (error) {
      console.error('Error loading team:', error)
      toast.error('Failed to load team settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teamId)

      if (error) throw error

      toast.success('Team settings updated successfully')
      onClose()
    } catch (error) {
      console.error('Error updating team:', error)
      toast.error('Failed to update team settings')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Team Settings</DialogTitle>
          <DialogDescription>
            Update your team's information and preferences
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description"
              rows={4}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 