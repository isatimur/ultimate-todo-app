"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconTrash, IconEdit, IconUserPlus } from "@tabler/icons-react";

// Mock team members data - in a real app, this would come from the database
const mockTeamMembers = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "admin",
    avatar: "https://i.pravatar.cc/150?u=alex",
    initials: "AJ"
  },
  {
    id: "2",
    name: "Sam Wilson",
    email: "sam@example.com",
    role: "member",
    avatar: "https://i.pravatar.cc/150?u=sam",
    initials: "SW"
  },
  {
    id: "3",
    name: "Taylor Kim",
    email: "taylor@example.com",
    role: "member",
    avatar: "https://i.pravatar.cc/150?u=taylor",
    initials: "TK"
  }
];

const teamFormSchema = z.object({
  teamName: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  teamDescription: z.string().optional(),
  defaultRole: z.enum(["admin", "member", "viewer"], {
    required_error: "Please select a default role for new members.",
  }),
  allowInvites: z.boolean().default(true),
  requireApproval: z.boolean().default(true),
  showTaskAssignee: z.boolean().default(true),
  allowMemberTaskCreation: z.boolean().default(true),
});

type TeamFormValues = z.infer<typeof teamFormSchema>;

export function TeamSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState(mockTeamMembers);
  const [inviteEmail, setInviteEmail] = useState("");

  // Default values from user data
  const defaultValues: Partial<TeamFormValues> = {
    teamName: user.user_metadata?.team_name || "My Team",
    teamDescription: user.user_metadata?.team_description || "",
    defaultRole: (user.user_metadata?.default_role as "admin" | "member" | "viewer") || "member",
    allowInvites: user.user_metadata?.allow_invites !== false, // Default to true
    requireApproval: user.user_metadata?.require_approval !== false, // Default to true
    showTaskAssignee: user.user_metadata?.show_task_assignee !== false, // Default to true
    allowMemberTaskCreation: user.user_metadata?.allow_member_task_creation !== false, // Default to true
  };

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues,
  });

  async function onSubmit(data: TeamFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          team_name: data.teamName,
          team_description: data.teamDescription,
          default_role: data.defaultRole,
          allow_invites: data.allowInvites,
          require_approval: data.requireApproval,
          show_task_assignee: data.showTaskAssignee,
          allow_member_task_creation: data.allowMemberTaskCreation,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Team settings updated successfully.");
    } catch (error) {
      console.error("Error updating team settings:", error);
      toast.error("Failed to update team settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleInviteMember = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // In a real app, this would send an invitation to the user
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  const handleRemoveMember = (id: string) => {
    // In a real app, this would remove the member from the team
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    toast.success("Team member removed successfully.");
  };

  const handleChangeRole = (id: string, newRole: string) => {
    // In a real app, this would update the member's role in the database
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, role: newRole as "admin" | "member" } : member
    ));
    toast.success("Role updated successfully.");
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Team Settings</CardTitle>
        <CardDescription>
          Manage your team members and collaboration settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teamDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team description (optional)" {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief description of your team's purpose.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Team Members</h3>
              
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.role === "admin" ? "default" : "outline"}>
                        {member.role === "admin" ? "Admin" : "Member"}
                      </Badge>
                      <Select
                        defaultValue={member.role}
                        onValueChange={(value) => handleChangeRole(member.id, value)}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2 mt-4">
                  <Input
                    placeholder="Enter email to invite"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button type="button" onClick={handleInviteMember}>
                    <IconUserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Team Permissions</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="defaultRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Role for New Members</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The default role assigned to new team members.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allowInvites"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Member Invites</FormLabel>
                        <FormDescription>
                          Allow team members to invite others to the team.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requireApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Require Approval</FormLabel>
                        <FormDescription>
                          Require admin approval for new members to join.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="showTaskAssignee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Task Assignee</FormLabel>
                        <FormDescription>
                          Display who is assigned to each task.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allowMemberTaskCreation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Member Task Creation</FormLabel>
                        <FormDescription>
                          Allow team members to create new tasks.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <CardFooter className="px-0 pt-6">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </>
  );
} 