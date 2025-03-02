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
import { Slider } from "@/components/ui/slider";
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
import { Textarea } from "@/components/ui/textarea";
import { IconRobot, IconBrain, IconCalendarStats } from "@tabler/icons-react";

const aiPlanningFormSchema = z.object({
  enableAI: z.boolean().default(true),
  aiModel: z.enum(["gpt-3.5", "gpt-4", "claude", "custom"], {
    required_error: "Please select an AI model.",
  }),
  customEndpoint: z.string().optional(),
  taskSuggestions: z.boolean().default(true),
  taskPrioritization: z.boolean().default(true),
  timeEstimation: z.boolean().default(true),
  dailyPlanning: z.boolean().default(true),
  weeklyReview: z.boolean().default(true),
  aiAggressiveness: z.number().min(1).max(10).default(5),
  customInstructions: z.string().optional(),
  dataSharing: z.boolean().default(false),
});

type AIPlanningFormValues = z.infer<typeof aiPlanningFormSchema>;

export function AIPlanningSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);

  // Default values from user data
  const defaultValues: Partial<AIPlanningFormValues> = {
    enableAI: user.user_metadata?.enable_ai !== false, // Default to true
    aiModel: (user.user_metadata?.ai_model as "gpt-3.5" | "gpt-4" | "claude" | "custom") || "gpt-4",
    customEndpoint: user.user_metadata?.custom_endpoint || "",
    taskSuggestions: user.user_metadata?.task_suggestions !== false, // Default to true
    taskPrioritization: user.user_metadata?.task_prioritization !== false, // Default to true
    timeEstimation: user.user_metadata?.time_estimation !== false, // Default to true
    dailyPlanning: user.user_metadata?.daily_planning !== false, // Default to true
    weeklyReview: user.user_metadata?.weekly_review !== false, // Default to true
    aiAggressiveness: user.user_metadata?.ai_aggressiveness || 5,
    customInstructions: user.user_metadata?.custom_instructions || "",
    dataSharing: user.user_metadata?.data_sharing || false,
  };

  const form = useForm<AIPlanningFormValues>({
    resolver: zodResolver(aiPlanningFormSchema),
    defaultValues,
  });

  async function onSubmit(data: AIPlanningFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          enable_ai: data.enableAI,
          ai_model: data.aiModel,
          custom_endpoint: data.customEndpoint,
          task_suggestions: data.taskSuggestions,
          task_prioritization: data.taskPrioritization,
          time_estimation: data.timeEstimation,
          daily_planning: data.dailyPlanning,
          weekly_review: data.weeklyReview,
          ai_aggressiveness: data.aiAggressiveness,
          custom_instructions: data.customInstructions,
          data_sharing: data.dataSharing,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("AI planning settings updated successfully.");
    } catch (error) {
      console.error("Error updating AI planning settings:", error);
      toast.error("Failed to update AI planning settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>AI Planning</CardTitle>
        <CardDescription>
          Configure AI-powered features to enhance your productivity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="enableAI"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-3">
                      <IconRobot className="h-6 w-6 text-primary" />
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable AI Features</FormLabel>
                        <FormDescription>
                          Use AI to help plan and organize your tasks.
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
            </div>
            
            {form.watch("enableAI") && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <IconBrain className="h-5 w-5 mr-2" />
                    AI Configuration
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="aiModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select AI model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gpt-3.5">GPT-3.5 (Faster)</SelectItem>
                            <SelectItem value="gpt-4">GPT-4 (Smarter)</SelectItem>
                            <SelectItem value="claude">Claude</SelectItem>
                            <SelectItem value="custom">Custom Endpoint</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select which AI model to use for task planning.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("aiModel") === "custom" && (
                    <FormField
                      control={form.control}
                      name="customEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom API Endpoint</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your custom API endpoint"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            URL for your custom AI model API.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="aiAggressiveness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Aggressiveness</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              min={1}
                              max={10}
                              step={1}
                              defaultValue={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Conservative</span>
                              <span>Value: {field.value}</span>
                              <span>Aggressive</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          How proactive the AI should be in making suggestions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter custom instructions for the AI"
                            className="resize-none h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide specific instructions on how the AI should plan your tasks.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <IconCalendarStats className="h-5 w-5 mr-2" />
                    AI Features
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="taskSuggestions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Task Suggestions</FormLabel>
                          <FormDescription>
                            AI will suggest new tasks based on your existing ones.
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
                    name="taskPrioritization"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Task Prioritization</FormLabel>
                          <FormDescription>
                            AI will help prioritize your tasks based on importance and deadlines.
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
                    name="timeEstimation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Time Estimation</FormLabel>
                          <FormDescription>
                            AI will estimate how long tasks will take to complete.
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
                    name="dailyPlanning"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Daily Planning</FormLabel>
                          <FormDescription>
                            AI will suggest a daily plan based on your tasks and calendar.
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
                    name="weeklyReview"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Weekly Review</FormLabel>
                          <FormDescription>
                            AI will provide a weekly summary and insights on your productivity.
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
                
                <Separator />
                
                <FormField
                  control={form.control}
                  name="dataSharing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Data Sharing</FormLabel>
                        <FormDescription>
                          Allow anonymous usage data to be shared to improve AI features.
                          No personal information or task content will be shared.
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
              </>
            )}
            
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