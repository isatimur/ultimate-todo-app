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
import { 
  IconCloudUpload, 
  IconDownload, 
  IconUpload, 
  IconHistory, 
  IconRefresh, 
  IconCalendarTime,
  IconLock
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const backupFormSchema = z.object({
  enableAutoBackup: z.boolean().default(true),
  backupFrequency: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Please select a backup frequency.",
  }),
  backupRetention: z.enum(["7days", "30days", "90days", "1year", "forever"], {
    required_error: "Please select a retention period.",
  }),
  encryptBackups: z.boolean().default(true),
  backupLocation: z.enum(["cloud", "local"], {
    required_error: "Please select a backup location.",
  }),
  includeAttachments: z.boolean().default(true),
  includeCompletedTasks: z.boolean().default(true),
  backupOnWifiOnly: z.boolean().default(true),
  notifyOnBackupComplete: z.boolean().default(true),
});

type BackupFormValues = z.infer<typeof backupFormSchema>;

export function BackupExportSettings({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(
    user.user_metadata?.last_backup_date || null
  );

  // Default values from user data
  const defaultValues: Partial<BackupFormValues> = {
    enableAutoBackup: user.user_metadata?.enable_auto_backup !== false, // Default to true
    backupFrequency: (user.user_metadata?.backup_frequency as "daily" | "weekly" | "monthly") || "weekly",
    backupRetention: (user.user_metadata?.backup_retention as "7days" | "30days" | "90days" | "1year" | "forever") || "30days",
    encryptBackups: user.user_metadata?.encrypt_backups !== false, // Default to true
    backupLocation: (user.user_metadata?.backup_location as "cloud" | "local") || "cloud",
    includeAttachments: user.user_metadata?.include_attachments !== false, // Default to true
    includeCompletedTasks: user.user_metadata?.include_completed_tasks !== false, // Default to true
    backupOnWifiOnly: user.user_metadata?.backup_on_wifi_only !== false, // Default to true
    notifyOnBackupComplete: user.user_metadata?.notify_on_backup_complete !== false, // Default to true
  };

  const form = useForm<BackupFormValues>({
    resolver: zodResolver(backupFormSchema),
    defaultValues,
  });

  async function onSubmit(data: BackupFormValues) {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          enable_auto_backup: data.enableAutoBackup,
          backup_frequency: data.backupFrequency,
          backup_retention: data.backupRetention,
          encrypt_backups: data.encryptBackups,
          backup_location: data.backupLocation,
          include_attachments: data.includeAttachments,
          include_completed_tasks: data.includeCompletedTasks,
          backup_on_wifi_only: data.backupOnWifiOnly,
          notify_on_backup_complete: data.notifyOnBackupComplete,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Backup settings updated successfully.");
    } catch (error) {
      console.error("Error updating backup settings:", error);
      toast.error("Failed to update backup settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleBackupNow = async () => {
    toast.info("Starting backup...");
    
    // Simulate backup process
    const now = new Date();
    const formattedDate = now.toLocaleString();
    
    // In a real app, this would trigger an actual backup process
    setTimeout(() => {
      setLastBackupDate(formattedDate);
      
      // Update user metadata with last backup date
      supabase.auth.updateUser({
        data: {
          last_backup_date: formattedDate,
        },
      });
      
      toast.success("Backup completed successfully.");
    }, 2000);
  };

  const handleExportData = (format: string) => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export process
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            toast.success(`Data exported as ${format} successfully.`);
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    // Simulate import process
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsImporting(false);
            toast.success(`Data imported from ${file.name} successfully.`);
            // Reset the file input
            event.target.value = "";
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  // Mock backup history data - in a real app, this would come from the database
  const backupHistory = [
    { id: 1, date: "2023-06-15 09:30:22", size: "2.4 MB", type: "Auto", status: "Completed" },
    { id: 2, date: "2023-06-08 14:15:07", size: "2.3 MB", type: "Manual", status: "Completed" },
    { id: 3, date: "2023-06-01 08:45:33", size: "2.2 MB", type: "Auto", status: "Completed" },
    { id: 4, date: "2023-05-25 19:20:11", size: "2.1 MB", type: "Auto", status: "Completed" },
  ];

  return (
    <>
      <CardHeader>
        <CardTitle>Backup & Export</CardTitle>
        <CardDescription>
          Manage your data backup, export, and import options.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backup">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup">Backup Settings</TabsTrigger>
            <TabsTrigger value="export">Export & Import</TabsTrigger>
            <TabsTrigger value="history">Backup History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-6 mt-6">
            <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
              <div className="flex items-center gap-3">
                <IconCloudUpload className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-medium">Backup Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {lastBackupDate 
                      ? `Last backup: ${lastBackupDate}` 
                      : "No backups yet"}
                  </p>
                </div>
              </div>
              <Button onClick={handleBackupNow}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Backup Now
              </Button>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="enableAutoBackup"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Automatic Backups</FormLabel>
                          <FormDescription>
                            Regularly back up your data automatically.
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
                  
                  {form.watch("enableAutoBackup") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-muted ml-2">
                      <FormField
                        control={form.control}
                        name="backupFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Backup Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How often backups should be created.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="backupRetention"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retention Period</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select retention period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="7days">7 days</SelectItem>
                                <SelectItem value="30days">30 days</SelectItem>
                                <SelectItem value="90days">90 days</SelectItem>
                                <SelectItem value="1year">1 year</SelectItem>
                                <SelectItem value="forever">Forever</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How long to keep backup files.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="backupOnWifiOnly"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Backup on Wi-Fi Only</FormLabel>
                              <FormDescription>
                                Only perform backups when connected to Wi-Fi.
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
                        name="notifyOnBackupComplete"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Backup Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications when backups complete.
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
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Backup Options</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="backupLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Backup Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cloud">Cloud Storage</SelectItem>
                              <SelectItem value="local">Local Storage</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Where to store your backup files.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="encryptBackups"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-base">Encrypt Backups</FormLabel>
                              <IconLock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormDescription>
                              Secure your backups with encryption.
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
                      name="includeAttachments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Include Attachments</FormLabel>
                            <FormDescription>
                              Include file attachments in backups.
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
                      name="includeCompletedTasks"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Include Completed Tasks</FormLabel>
                            <FormDescription>
                              Include completed tasks in backups.
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
                    {isLoading ? "Saving..." : "Save Settings"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div className="border rounded-md p-6">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <IconDownload className="h-5 w-5" />
                  Export Data
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your tasks and settings to a file that you can save or import later.
                </p>
                
                {isExporting ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Exporting data...</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="h-2" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => handleExportData("JSON")}>
                      Export as JSON
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData("CSV")}>
                      Export as CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExportData("PDF")}>
                      Export as PDF
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="border rounded-md p-6">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <IconUpload className="h-5 w-5" />
                  Import Data
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import tasks and settings from a previously exported file.
                </p>
                
                {isImporting ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importing data...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Input 
                      type="file" 
                      accept=".json,.csv" 
                      onChange={handleImportData}
                    />
                    <div className="text-sm text-muted-foreground">
                      Supported formats: JSON, CSV
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6 mt-6">
            <div className="border rounded-md">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <IconHistory className="h-5 w-5" />
                  Backup History
                </h3>
                <p className="text-sm text-muted-foreground">
                  View and restore from previous backups.
                </p>
              </div>
              
              <div className="divide-y">
                {backupHistory.map((backup) => (
                  <div key={backup.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <IconCalendarTime className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{backup.date}</p>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          <span>{backup.size}</span>
                          <span>•</span>
                          <span>{backup.type}</span>
                          <span>•</span>
                          <span className="text-green-600">{backup.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Restore
                      </Button>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {backupHistory.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No backup history available.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );
} 