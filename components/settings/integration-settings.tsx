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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IconBrandGoogle, IconBrandSlack, IconBrandTrello, IconBrandGithub, IconMail } from "@tabler/icons-react";

const integrationsFormSchema = z.object({
  googleCalendar: z.boolean().default(false),
  googleCalendarApiKey: z.string().optional(),
  slack: z.boolean().default(false),
  slackWebhookUrl: z.string().optional(),
  trello: z.boolean().default(false),
  trelloApiKey: z.string().optional(),
  github: z.boolean().default(false),
  githubToken: z.string().optional(),
  outlook: z.boolean().default(false),
  outlookClientId: z.string().optional(),
});

type IntegrationsFormValues = z.infer<typeof integrationsFormSchema>;

export function IntegrationSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);

  // Default values from user data
  const defaultValues: Partial<IntegrationsFormValues> = {
    googleCalendar: user.user_metadata?.google_calendar || false,
    googleCalendarApiKey: user.user_metadata?.google_calendar_api_key || "",
    slack: user.user_metadata?.slack || false,
    slackWebhookUrl: user.user_metadata?.slack_webhook_url || "",
    trello: user.user_metadata?.trello || false,
    trelloApiKey: user.user_metadata?.trello_api_key || "",
    github: user.user_metadata?.github || false,
    githubToken: user.user_metadata?.github_token || "",
    outlook: user.user_metadata?.outlook || false,
    outlookClientId: user.user_metadata?.outlook_client_id || "",
  };

  const form = useForm<IntegrationsFormValues>({
    resolver: zodResolver(integrationsFormSchema),
    defaultValues,
  });

  async function onSubmit(data: IntegrationsFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          google_calendar: data.googleCalendar,
          google_calendar_api_key: data.googleCalendarApiKey,
          slack: data.slack,
          slack_webhook_url: data.slackWebhookUrl,
          trello: data.trello,
          trello_api_key: data.trelloApiKey,
          github: data.github,
          github_token: data.githubToken,
          outlook: data.outlook,
          outlook_client_id: data.outlookClientId,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Integration settings updated successfully.");
    } catch (error) {
      console.error("Error updating integration settings:", error);
      toast.error("Failed to update integration settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect your todo app with other services and tools.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="googleCalendar"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <IconBrandGoogle className="h-8 w-8 text-red-500" />
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Google Calendar</FormLabel>
                        <FormDescription>
                          Sync your tasks with Google Calendar.
                        </FormDescription>
                      </div>
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
              
              {form.watch("googleCalendar") && (
                <FormField
                  control={form.control}
                  name="googleCalendarApiKey"
                  render={({ field }) => (
                    <FormItem className="ml-12">
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Google Calendar API key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="slack"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <IconBrandSlack className="h-8 w-8 text-purple-500" />
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Slack</FormLabel>
                        <FormDescription>
                          Receive notifications and updates in Slack.
                        </FormDescription>
                      </div>
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
              
              {form.watch("slack") && (
                <FormField
                  control={form.control}
                  name="slackWebhookUrl"
                  render={({ field }) => (
                    <FormItem className="ml-12">
                      <FormLabel>Webhook URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Slack webhook URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="trello"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <IconBrandTrello className="h-8 w-8 text-blue-500" />
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Trello</FormLabel>
                        <FormDescription>
                          Sync tasks with Trello boards.
                        </FormDescription>
                      </div>
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
              
              {form.watch("trello") && (
                <FormField
                  control={form.control}
                  name="trelloApiKey"
                  render={({ field }) => (
                    <FormItem className="ml-12">
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Trello API key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <IconBrandGithub className="h-8 w-8" />
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">GitHub</FormLabel>
                        <FormDescription>
                          Link tasks to GitHub issues.
                        </FormDescription>
                      </div>
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
              
              {form.watch("github") && (
                <FormField
                  control={form.control}
                  name="githubToken"
                  render={({ field }) => (
                    <FormItem className="ml-12">
                      <FormLabel>Personal Access Token</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your GitHub personal access token" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="outlook"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <IconMail className="h-8 w-8 text-blue-600" />
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Outlook</FormLabel>
                        <FormDescription>
                          Sync your tasks with Outlook Calendar.
                        </FormDescription>
                      </div>
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
              
              {form.watch("outlook") && (
                <FormField
                  control={form.control}
                  name="outlookClientId"
                  render={({ field }) => (
                    <FormItem className="ml-12">
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Outlook client ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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