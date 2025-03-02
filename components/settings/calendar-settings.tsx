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
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { IconCalendar, IconCalendarEvent, IconCalendarTime, IconCalendarStats } from "@tabler/icons-react";

const calendarFormSchema = z.object({
  defaultView: z.enum(["month", "week", "day", "agenda"], {
    required_error: "Please select a default calendar view.",
  }),
  firstDayOfWeek: z.enum(["sunday", "monday"], {
    required_error: "Please select the first day of the week.",
  }),
  workingHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in 24-hour format (HH:MM).",
  }),
  workingHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Please enter a valid time in 24-hour format (HH:MM).",
  }),
  showWeekends: z.boolean().default(true),
  showWeekNumbers: z.boolean().default(false),
  enableReminders: z.boolean().default(true),
  defaultReminderTime: z.enum(["0", "5", "10", "15", "30", "60", "1440"], {
    required_error: "Please select a default reminder time.",
  }),
  autoAddDueDates: z.boolean().default(true),
  syncWithExternalCalendars: z.boolean().default(false),
  timeFormat: z.enum(["12hour", "24hour"], {
    required_error: "Please select a time format.",
  }),
});

type CalendarFormValues = z.infer<typeof calendarFormSchema>;

export function CalendarSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);

  // Default values from user data
  const defaultValues: Partial<CalendarFormValues> = {
    defaultView: (user.user_metadata?.calendar_default_view as "month" | "week" | "day" | "agenda") || "month",
    firstDayOfWeek: (user.user_metadata?.first_day_of_week as "sunday" | "monday") || "monday",
    workingHoursStart: user.user_metadata?.working_hours_start || "09:00",
    workingHoursEnd: user.user_metadata?.working_hours_end || "17:00",
    showWeekends: user.user_metadata?.show_weekends !== false, // Default to true
    showWeekNumbers: user.user_metadata?.show_week_numbers || false,
    enableReminders: user.user_metadata?.enable_calendar_reminders !== false, // Default to true
    defaultReminderTime: (user.user_metadata?.default_reminder_time as "0" | "5" | "10" | "15" | "30" | "60" | "1440") || "15",
    autoAddDueDates: user.user_metadata?.auto_add_due_dates !== false, // Default to true
    syncWithExternalCalendars: user.user_metadata?.sync_with_external_calendars || false,
    timeFormat: (user.user_metadata?.time_format as "12hour" | "24hour") || "24hour",
  };

  const form = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues,
  });

  async function onSubmit(data: CalendarFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          calendar_default_view: data.defaultView,
          first_day_of_week: data.firstDayOfWeek,
          working_hours_start: data.workingHoursStart,
          working_hours_end: data.workingHoursEnd,
          show_weekends: data.showWeekends,
          show_week_numbers: data.showWeekNumbers,
          enable_calendar_reminders: data.enableReminders,
          default_reminder_time: data.defaultReminderTime,
          auto_add_due_dates: data.autoAddDueDates,
          sync_with_external_calendars: data.syncWithExternalCalendars,
          time_format: data.timeFormat,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Calendar settings updated successfully.");
    } catch (error) {
      console.error("Error updating calendar settings:", error);
      toast.error("Failed to update calendar settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Calendar Settings</CardTitle>
        <CardDescription>
          Configure how your calendar displays and behaves.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Display Options</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultView"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default View</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default view" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="month">Month</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="agenda">Agenda</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The default calendar view when opening the calendar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="firstDayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Day of Week</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select first day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sunday">Sunday</SelectItem>
                          <SelectItem value="monday">Monday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Which day should be shown as the first day of the week.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="12hour">12-hour (1:00 PM)</SelectItem>
                          <SelectItem value="24hour">24-hour (13:00)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How times should be displayed in the calendar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="showWeekends"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Weekends</FormLabel>
                          <FormDescription>
                            Display weekend days in the calendar.
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
                    name="showWeekNumbers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Week Numbers</FormLabel>
                          <FormDescription>
                            Display week numbers in the calendar.
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
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconCalendarTime className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Working Hours</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="workingHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Hours Start</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        When your working day typically starts.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="workingHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Hours End</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        When your working day typically ends.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <IconCalendarEvent className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Events & Reminders</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="enableReminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Reminders</FormLabel>
                        <FormDescription>
                          Receive reminders for calendar events.
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
                
                {form.watch("enableReminders") && (
                  <FormField
                    control={form.control}
                    name="defaultReminderTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Reminder Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reminder time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">At time of event</SelectItem>
                            <SelectItem value="5">5 minutes before</SelectItem>
                            <SelectItem value="10">10 minutes before</SelectItem>
                            <SelectItem value="15">15 minutes before</SelectItem>
                            <SelectItem value="30">30 minutes before</SelectItem>
                            <SelectItem value="60">1 hour before</SelectItem>
                            <SelectItem value="1440">1 day before</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          When to send reminders for calendar events by default.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="autoAddDueDates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-add Due Dates</FormLabel>
                        <FormDescription>
                          Automatically add tasks with due dates to the calendar.
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
                  name="syncWithExternalCalendars"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Sync External Calendars</FormLabel>
                        <FormDescription>
                          Sync with external calendar services (Google, Outlook, etc.).
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