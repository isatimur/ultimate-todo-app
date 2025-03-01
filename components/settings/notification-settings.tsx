"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/types";
import { supabase } from "@/lib/supabase-browser";

interface NotificationSettingsProps {
  user: UserProfile;
}

interface NotificationPreferences {
  email: {
    taskReminders: boolean;
    dueDateAlerts: boolean;
    teamUpdates: boolean;
    weeklyDigest: boolean;
  };
  push: {
    enabled: boolean;
    taskReminders: boolean;
    dueDateAlerts: boolean;
    teamUpdates: boolean;
  };
  desktop: {
    enabled: boolean;
    soundEnabled: boolean;
    showPreview: boolean;
  };
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      taskReminders: true,
      dueDateAlerts: true,
      teamUpdates: true,
      weeklyDigest: true
    },
    push: {
      enabled: true,
      taskReminders: true,
      dueDateAlerts: true,
      teamUpdates: true
    },
    desktop: {
      enabled: true,
      soundEnabled: true,
      showPreview: true
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('notifications')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data?.notifications) {
          setPreferences(data.notifications as NotificationPreferences);
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user.id]);

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notifications: newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setPreferences(newPreferences);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  };

  const updateEmailPreference = (key: keyof NotificationPreferences['email'], value: boolean) => {
    const newPreferences = {
      ...preferences,
      email: { ...preferences.email, [key]: value }
    };
    updatePreferences(newPreferences);
  };

  const updatePushPreference = (key: keyof NotificationPreferences['push'], value: boolean) => {
    const newPreferences = {
      ...preferences,
      push: { ...preferences.push, [key]: value }
    };
    updatePreferences(newPreferences);
  };

  const updateDesktopPreference = (key: keyof NotificationPreferences['desktop'], value: boolean) => {
    const newPreferences = {
      ...preferences,
      desktop: { ...preferences.desktop, [key]: value }
    };
    updatePreferences(newPreferences);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Email Notifications</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Task Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive email reminders for upcoming tasks
              </p>
            </div>
            <Switch
              checked={preferences.email.taskReminders}
              onCheckedChange={(checked) => updateEmailPreference('taskReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Due Date Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when tasks are due
              </p>
            </div>
            <Switch
              checked={preferences.email.dueDateAlerts}
              onCheckedChange={(checked) => updateEmailPreference('dueDateAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Team Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about team activity
              </p>
            </div>
            <Switch
              checked={preferences.email.teamUpdates}
              onCheckedChange={(checked) => updateEmailPreference('teamUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of your tasks and progress
              </p>
            </div>
            <Switch
              checked={preferences.email.weeklyDigest}
              onCheckedChange={(checked) => updateEmailPreference('weeklyDigest', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Push Notifications</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications on your device
              </p>
            </div>
            <Switch
              checked={preferences.push.enabled}
              onCheckedChange={(checked) => updatePushPreference('enabled', checked)}
            />
          </div>

          {preferences.push.enabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications for task reminders
                  </p>
                </div>
                <Switch
                  checked={preferences.push.taskReminders}
                  onCheckedChange={(checked) => updatePushPreference('taskReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Due Date Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications for due dates
                  </p>
                </div>
                <Switch
                  checked={preferences.push.dueDateAlerts}
                  onCheckedChange={(checked) => updatePushPreference('dueDateAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Team Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications for team activity
                  </p>
                </div>
                <Switch
                  checked={preferences.push.teamUpdates}
                  onCheckedChange={(checked) => updatePushPreference('teamUpdates', checked)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Desktop Notifications</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Desktop Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications on your desktop
              </p>
            </div>
            <Switch
              checked={preferences.desktop.enabled}
              onCheckedChange={(checked) => updateDesktopPreference('enabled', checked)}
            />
          </div>

          {preferences.desktop.enabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound for notifications
                  </p>
                </div>
                <Switch
                  checked={preferences.desktop.soundEnabled}
                  onCheckedChange={(checked) => updateDesktopPreference('soundEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Preview</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notification content in preview
                  </p>
                </div>
                <Switch
                  checked={preferences.desktop.showPreview}
                  onCheckedChange={(checked) => updateDesktopPreference('showPreview', checked)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 