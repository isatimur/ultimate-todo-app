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
import { IconDeviceMobile, IconQrcode, IconRefresh, IconCloudUpload } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";

const mobileFormSchema = z.object({
  enableMobileSync: z.boolean().default(true),
  syncFrequency: z.enum(["realtime", "hourly", "daily", "manual"], {
    required_error: "Please select a sync frequency.",
  }),
  syncOnWifiOnly: z.boolean().default(false),
  enableOfflineMode: z.boolean().default(true),
  enablePushNotifications: z.boolean().default(true),
  enableLocationBasedReminders: z.boolean().default(false),
  enableBiometricAuth: z.boolean().default(true),
  defaultView: z.enum(["list", "calendar", "kanban", "focus"], {
    required_error: "Please select a default view.",
  }),
  enableWidgets: z.boolean().default(true),
});

type MobileFormValues = z.infer<typeof mobileFormSchema>;

export function MobileSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  // Default values from user data
  const defaultValues: Partial<MobileFormValues> = {
    enableMobileSync: user.user_metadata?.enable_mobile_sync !== false, // Default to true
    syncFrequency: (user.user_metadata?.sync_frequency as "realtime" | "hourly" | "daily" | "manual") || "realtime",
    syncOnWifiOnly: user.user_metadata?.sync_on_wifi_only || false,
    enableOfflineMode: user.user_metadata?.enable_offline_mode !== false, // Default to true
    enablePushNotifications: user.user_metadata?.enable_push_notifications !== false, // Default to true
    enableLocationBasedReminders: user.user_metadata?.enable_location_based_reminders || false,
    enableBiometricAuth: user.user_metadata?.enable_biometric_auth !== false, // Default to true
    defaultView: (user.user_metadata?.default_view as "list" | "calendar" | "kanban" | "focus") || "list",
    enableWidgets: user.user_metadata?.enable_widgets !== false, // Default to true
  };

  const form = useForm<MobileFormValues>({
    resolver: zodResolver(mobileFormSchema),
    defaultValues,
  });

  async function onSubmit(data: MobileFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          enable_mobile_sync: data.enableMobileSync,
          sync_frequency: data.syncFrequency,
          sync_on_wifi_only: data.syncOnWifiOnly,
          enable_offline_mode: data.enableOfflineMode,
          enable_push_notifications: data.enablePushNotifications,
          enable_location_based_reminders: data.enableLocationBasedReminders,
          enable_biometric_auth: data.enableBiometricAuth,
          default_view: data.defaultView,
          enable_widgets: data.enableWidgets,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Mobile settings updated successfully.");
    } catch (error) {
      console.error("Error updating mobile settings:", error);
      toast.error("Failed to update mobile settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSyncNow = () => {
    setSyncStatus("syncing");
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus("success");
      toast.success("Sync completed successfully.");
      
      // Reset status after a delay
      setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);
    }, 2000);
  };

  const handleShowQRCode = () => {
    setShowQRCode(!showQRCode);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Mobile Settings</CardTitle>
        <CardDescription>
          Configure how the app works on your mobile devices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <IconDeviceMobile className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-medium">Mobile App</h3>
                </div>
                
                <div className="p-4 border rounded-md bg-muted/50">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-medium">Connect Mobile App</h4>
                      <p className="text-sm text-muted-foreground">
                        Scan this QR code with your mobile device
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShowQRCode}
                    >
                      <IconQrcode className="h-4 w-4 mr-2" />
                      {showQRCode ? "Hide Code" : "Show Code"}
                    </Button>
                  </div>
                  
                  {showQRCode && (
                    <div className="flex justify-center p-4 bg-white rounded-md">
                      {/* Placeholder for QR code - in a real app, this would be a generated QR code */}
                      <div className="w-40 h-40 bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">QR Code Placeholder</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Last synced:</p>
                      <p className="text-xs text-muted-foreground">
                        {user.user_metadata?.last_sync_time || "Never"}
                      </p>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleSyncNow}
                      disabled={syncStatus === "syncing"}
                    >
                      <IconRefresh className={`h-4 w-4 mr-2 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                      {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <IconCloudUpload className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-medium">Sync Settings</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="enableMobileSync"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Mobile Sync</FormLabel>
                        <FormDescription>
                          Sync your tasks and settings across devices.
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
                
                {form.watch("enableMobileSync") && (
                  <>
                    <FormField
                      control={form.control}
                      name="syncFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sync Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sync frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="realtime">Real-time</SelectItem>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How often to sync data with the server.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="syncOnWifiOnly"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Sync on Wi-Fi Only</FormLabel>
                            <FormDescription>
                              Only sync when connected to Wi-Fi to save data.
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
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Mobile Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="enableOfflineMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Offline Mode</FormLabel>
                        <FormDescription>
                          Access and edit tasks without an internet connection.
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
                  name="enablePushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Push Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications on your mobile device.
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
                  name="enableLocationBasedReminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Location Reminders</FormLabel>
                        <FormDescription>
                          Get reminders based on your location.
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
                  name="enableBiometricAuth"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Biometric Authentication</FormLabel>
                        <FormDescription>
                          Use fingerprint or face recognition to unlock the app.
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
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Display Preferences</h3>
              
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
                        <SelectItem value="list">List View</SelectItem>
                        <SelectItem value="calendar">Calendar View</SelectItem>
                        <SelectItem value="kanban">Kanban Board</SelectItem>
                        <SelectItem value="focus">Focus Mode</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The default view when opening the mobile app.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enableWidgets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Widgets</FormLabel>
                      <FormDescription>
                        Show task widgets on your home screen.
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