"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
  fontSize: z.enum(["sm", "md", "lg", "xl"], {
    required_error: "Please select a font size.",
  }),
  colorScheme: z.enum(["default", "blue", "green", "purple", "orange"], {
    required_error: "Please select a color scheme.",
  }),
  reduceMotion: z.boolean().default(false),
  enableSounds: z.boolean().default(true),
  compactMode: z.boolean().default(false),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export default function AppearanceSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme } = useTheme();

  // Default values from user data
  const defaultValues: Partial<AppearanceFormValues> = {
    theme: (user.user_metadata?.theme as "light" | "dark" | "system") || "system",
    fontSize: (user.user_metadata?.font_size as "sm" | "md" | "lg" | "xl") || "md",
    colorScheme: (user.user_metadata?.color_scheme as "default" | "blue" | "green" | "purple" | "orange") || "default",
    reduceMotion: user.user_metadata?.reduce_motion || false,
    enableSounds: user.user_metadata?.enable_sounds !== false, // Default to true
    compactMode: user.user_metadata?.compact_mode || false,
  };

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  });

  async function onSubmit(data: AppearanceFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          theme: data.theme,
          font_size: data.fontSize,
          color_scheme: data.colorScheme,
          reduce_motion: data.reduceMotion,
          enable_sounds: data.enableSounds,
          compact_mode: data.compactMode,
        },
      });

      if (error) {
        throw error;
      }

      // Update theme in real-time
      setTheme(data.theme);

      // Apply font size to document
      document.documentElement.setAttribute('data-font-size', data.fontSize);
      
      // Apply color scheme
      document.documentElement.setAttribute('data-color-scheme', data.colorScheme);
      
      // Apply compact mode
      if (data.compactMode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }

      toast.success("Appearance settings updated successfully.");
    } catch (error) {
      console.error("Error updating appearance settings:", error);
      toast.error("Failed to update appearance settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Theme</FormLabel>
                  <FormDescription>
                    Select the theme for the application.
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="light"
                            className="sr-only"
                            id="theme-light"
                          />
                        </FormControl>
                        <label
                          htmlFor="theme-light"
                          className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground ${
                            field.value === "light" ? "border-primary" : ""
                          }`}
                        >
                          <div className="mb-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-2 w-8 rounded-lg bg-[#eaeaea]" />
                          </div>
                          <span className="block w-full text-center font-normal">
                            Light
                          </span>
                        </label>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="dark"
                            className="sr-only"
                            id="theme-dark"
                          />
                        </FormControl>
                        <label
                          htmlFor="theme-dark"
                          className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground ${
                            field.value === "dark" ? "border-primary" : ""
                          }`}
                        >
                          <div className="mb-2 rounded-md bg-slate-950 p-2 shadow-sm">
                            <div className="h-2 w-8 rounded-lg bg-slate-800" />
                          </div>
                          <span className="block w-full text-center font-normal">
                            Dark
                          </span>
                        </label>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="system"
                            className="sr-only"
                            id="theme-system"
                          />
                        </FormControl>
                        <label
                          htmlFor="theme-system"
                          className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground ${
                            field.value === "system" ? "border-primary" : ""
                          }`}
                        >
                          <div className="mb-2 rounded-md bg-gradient-to-r from-white to-slate-950 p-2 shadow-sm">
                            <div className="h-2 w-8 rounded-lg bg-gradient-to-r from-[#eaeaea] to-slate-800" />
                          </div>
                          <span className="block w-full text-center font-normal">
                            System
                          </span>
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fontSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Font Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Adjust the font size for better readability.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="colorScheme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Scheme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color scheme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a color scheme for the application.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="reduceMotion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Reduce Motion</FormLabel>
                      <FormDescription>
                        Minimize animations throughout the application.
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
                name="enableSounds"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Sounds</FormLabel>
                      <FormDescription>
                        Play sounds for notifications and actions.
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
                name="compactMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Compact Mode</FormLabel>
                      <FormDescription>
                        Reduce spacing to fit more content on screen.
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