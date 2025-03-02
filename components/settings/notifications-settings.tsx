"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  soundNotifications: z.boolean().default(true),
  desktopNotifications: z.boolean().default(true),
  notificationFrequency: z.enum(["immediate", "hourly", "daily", "weekly"], {
    required_error: "Please select a notification frequency.",
  }),
  taskReminders: z.boolean().default(true),
  reminderTime: z.string().optional(),
  dueDateAlerts: z.boolean().default(true),
  dueDateAlertTime: z.enum(["1hour", "3hours", "1day", "2days", "1week"], {
    required_error: "Please select when to receive due date alerts.",
  }),
  mentionNotifications: z.boolean().default(true),
  teamUpdates: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

export default function NotificationsSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);

  // Default values from user data
  const defaultValues: Partial<NotificationsFormValues> = {
    emailNotifications: user.user_metadata?.email_notifications !== false, // Default to true
    pushNotifications: user.user_metadata?.push_notifications !== false, // Default to true
    soundNotifications: user.user_metadata?.sound_notifications !== false, // Default to true
    desktopNotifications: user.user_metadata?.desktop_notifications !== false, // Default to true
    notificationFrequency: (user.user_metadata?.notification_frequency as "immediate" | "hourly" | "daily" | "weekly") || "immediate",
    taskReminders: user.user_metadata?.task_reminders !== false, // Default to true
    reminderTime: user.user_metadata?.reminder_time || "09:00",
    dueDateAlerts: user.user_metadata?.due_date_alerts !== false, // Default to true
    dueDateAlertTime: (user.user_metadata?.due_date_alert_time as "1hour" | "3hours" | "1day" | "2days" | "1week") || "1day",
    mentionNotifications: user.user_metadata?.mention_notifications !== false, // Default to true
    teamUpdates: user.user_metadata?.team_updates !== false, // Default to true
    weeklyDigest: user.user_metadata?.weekly_digest !== false, // Default to true
  };

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  });

  async function onSubmit(data: NotificationsFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          email_notifications: data.emailNotifications,
          push_notifications: data.pushNotifications,
          sound_notifications: data.soundNotifications,
          desktop_notifications: data.desktopNotifications,
          notification_frequency: data.notificationFrequency,
          task_reminders: data.taskReminders,
          reminder_time: data.reminderTime,
          due_date_alerts: data.dueDateAlerts,
          due_date_alert_time: data.dueDateAlertTime,
          mention_notifications: data.mentionNotifications,
          team_updates: data.teamUpdates,
          weekly_digest: data.weeklyDigest,
        },
      });

      if (error) {
        throw error;
      }

      // Request notification permissions if desktop notifications are enabled
      if (data.desktopNotifications && "Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          await Notification.requestPermission();
        }
      }

      toast.success("Notification settings updated successfully.");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Manage how you receive notifications and alerts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">Notification Channels</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how you want to be notified
              </p>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications via email.
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
                  name="pushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Push Notifications</FormLabel>
                        <FormDescription>
                          Receive push notifications on your devices.
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
                  name="desktopNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Desktop Notifications</FormLabel>
                        <FormDescription>
                          Show notifications on your desktop.
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
                  name="soundNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Sound Notifications</FormLabel>
                        <FormDescription>
                          Play sounds for notifications.
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
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Customize when and how often you receive notifications
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="notificationFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="hourly">Hourly Digest</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often you want to receive notification summaries.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDateAlertTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date Alerts</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select alert time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1hour">1 hour before</SelectItem>
                          <SelectItem value="3hours">3 hours before</SelectItem>
                          <SelectItem value="1day">1 day before</SelectItem>
                          <SelectItem value="2days">2 days before</SelectItem>
                          <SelectItem value="1week">1 week before</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        When to receive alerts for upcoming due dates.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="taskReminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Task Reminders</FormLabel>
                        <FormDescription>
                          Receive reminders for upcoming tasks.
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
                
                {form.watch("taskReminders") && (
                  <FormField
                    control={form.control}
                    name="reminderTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Reminder Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Set the default time for daily task reminders.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium">Activity Notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose which activities trigger notifications
              </p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="mentionNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Mentions</FormLabel>
                        <FormDescription>
                          Notify when someone mentions you in comments.
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
                  name="teamUpdates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Team Updates</FormLabel>
                        <FormDescription>
                          Notify about changes to team tasks and projects.
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
                  name="weeklyDigest"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Weekly Digest</FormLabel>
                        <FormDescription>
                          Receive a weekly summary of your tasks and progress.
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