"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Users, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Mail,
  Check,
  X,
  Settings,
  LogOut
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Skeleton } from "./ui/skeleton"
import { CreateTeamDialog } from "./create-team-dialog"
import { InviteMemberDialog } from "./invite-member-dialog"
import { toast } from "sonner"
import { useState, useEffect, useMemo } from "react"
import { Database } from '@/lib/database.types'
import { createClient } from '@/lib/supabase-browser'
import { TeamSettingsDialog } from "./team-settings-dialog"

type TeamMember = {
  id: string;
  role: string;
  user_id: string;
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

type Team = Database['public']['Tables']['teams']['Row'] & {
  role?: string;
  members: TeamMember[];
}

type TeamInvitation = Database['public']['Tables']['team_invitations']['Row']

interface TeamsViewProps {
  userId: string
  userEmail: string
}

export default function TeamsView({ userId, userEmail }: TeamsViewProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("my-teams")
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Fetch teams where user is a member
      const { data: memberTeams, error: memberError } = await supabase
        .from('team_members')
        .select(`
          teams (
            id,
            name,
            description,
            created_at,
            updated_at,
            owner_id
          ),
          role
        `)
        .eq('user_id', userId)

      if (memberError) throw memberError

      // Fetch invitations
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('email', userEmail)
        .order('invited_at', { ascending: false })

      if (invitationError) throw invitationError

      // Fetch team members for each team
      const teamsWithMembers = await Promise.all(
        (memberTeams || []).map(async (mt) => {
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select(`
              id,
              role,
              user_id,
              profiles!team_members_user_id_profiles_fkey (
                id,
                email,
                full_name,
                avatar_url
              )
            `)
            .eq('team_id', mt.teams.id)

          if (membersError) throw membersError

          const formattedTeam: Team = {
            ...mt.teams,
            role: mt.role,
            members: members?.map(m => ({
              id: m.id,
              role: m.role,
              user_id: m.user_id,
              user: m.profiles
            })) || []
          }

          return formattedTeam
        })
      )

      setTeams(teamsWithMembers)
      setInvitations(invitationData || [])
    } catch (error) {
      console.error('Error loading teams:', error)
      toast.error('Failed to load teams')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId, userEmail])

  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error

      setTeams(prev =>
        prev.filter(t => t.id !== teamId)
      )

      toast.success('Team deleted successfully')
    } catch (error) {
      console.error('Error deleting team:', error)
      toast.error('Failed to delete team')
    }
  }

  const leaveTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)

      if (error) throw error

      setTeams(prev =>
        prev.filter(t => t.id !== teamId)
      )

      toast.success('Left team successfully')
    } catch (error) {
      console.error('Error leaving team:', error)
      toast.error('Failed to leave team')
    }
  }

  const handleInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const invitation = invitations.find(i => i.id === invitationId)
      if (!invitation) return

      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: accept ? 'accepted' : 'rejected'
        })
        .eq('id', invitationId)

      if (updateError) throw updateError

      if (accept) {
        // Check if member already exists
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .match({
            team_id: invitation.team_id,
            user_id: userId
          })
          .single()

        if (!existingMember) {
          const { error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: invitation.team_id,
              user_id: userId,
              role: 'member'
            })

          if (memberError) throw memberError
        }
      }

      setInvitations(prev =>
        prev.filter(i => i.id !== invitationId)
      )

      toast.success(
        accept
          ? 'Team invitation accepted'
          : 'Team invitation declined'
      )
    } catch (error) {
      console.error('Error handling invitation:', error)
      toast.error('Failed to process invitation')
    }
  }

  const filteredTeams = useMemo(() => {
    return teams?.filter(team => {
      const searchLower = searchQuery.toLowerCase()
      return (
        team.name.toLowerCase().includes(searchLower) ||
        team.description?.toLowerCase().includes(searchLower) ||
        team.members.some(member =>
          member.user?.full_name?.toLowerCase().includes(searchLower)
        )
      )
    })
  }, [teams, searchQuery])

  const userTeams = filteredTeams.filter(team =>
    team.members.some(member => member.user_id === userId)
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage your teams and collaborations</p>
        </div>
        <Button onClick={() => setIsCreateTeamOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList>
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card key={team.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.description}</CardDescription>
                    </div>
                    {(team.owner_id === userId || team.role === 'admin') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedTeamId(team.id)
                            setIsInviteMemberOpen(true)
                          }}>
                            <Users className="w-4 h-4 mr-2" />
                            Invite Member
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTeamId(team.id)
                              setIsTeamSettingsOpen(true)
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteTeam(team.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Members</h4>
                      <div className="flex -space-x-2">
                        {team.members.map((member) => (
                          <Avatar key={member.id} className="border-2 border-background">
                            <AvatarImage src={member.user?.avatar_url || ''} />
                            <AvatarFallback>{getInitials(member.user?.full_name || '')}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {format(new Date(team.created_at || new Date()), 'MMM d, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="invitations">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
              >
                All
              </Button>
              <Button
                variant={activeTab === 'pending' ? 'default' : 'outline'}
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </Button>
              <Button
                variant={activeTab === 'accepted' ? 'default' : 'outline'}
                onClick={() => setActiveTab('accepted')}
              >
                Accepted
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {invitations.map((invitation) => (
                <Card key={`${invitation.id}-${invitation.team_id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Team Invitation</h3>
                        <p className="text-sm text-muted-foreground">
                          Role: {invitation.role}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Invited {format(new Date(invitation.invited_at || new Date()), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {invitation.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInvitation(invitation.id, true)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleInvitation(invitation.id, false)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CreateTeamDialog
        open={isCreateTeamOpen}
        onOpenChange={setIsCreateTeamOpen}
        userId={userId}
      />

      {selectedTeamId && (
        <>
          <TeamSettingsDialog
            open={isTeamSettingsOpen}
            onOpenChange={setIsTeamSettingsOpen}
            teamId={selectedTeamId}
            onClose={() => {
              setSelectedTeamId(null)
              setIsTeamSettingsOpen(false)
              loadData()
            }}
          />
          <InviteMemberDialog
            open={isInviteMemberOpen}
            onOpenChange={setIsInviteMemberOpen}
            teamId={selectedTeamId}
            onClose={() => {
              setSelectedTeamId(null)
              loadData()
            }}
          />
        </>
      )}
    </div>
  )
} 