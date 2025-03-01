"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface PrivacySettingsProps {
  user: UserProfile;
}

interface PrivacyPreferences {
  profileVisibility: "public" | "private" | "contacts";
  taskVisibility: "public" | "private" | "team";
  activityTracking: boolean;
  dataCollection: boolean;
  marketingEmails: boolean;
  thirdPartySharing: boolean;
}

export function PrivacySettings({ user }: PrivacySettingsProps) {
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    profileVisibility: "private",
    taskVisibility: "private",
    activityTracking: true,
    dataCollection: true,
    marketingEmails: false,
    thirdPartySharing: false,
  });
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('privacy_settings')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data?.privacy_settings) {
          setPreferences(data.privacy_settings as PrivacyPreferences);
        }
      } catch (error) {
        console.error('Error loading privacy preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user.id]);

  const updatePreferences = async (newPreferences: PrivacyPreferences) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          privacy_settings: newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setPreferences(newPreferences);
      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete user authentication
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) throw authError;

      toast.success('Account deleted successfully');
      // Redirect to home page or sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your privacy preferences and data settings.
        </p>

        <div className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label>Profile Visibility</Label>
            <Select
              value={preferences.profileVisibility}
              onValueChange={(value: "public" | "private" | "contacts") =>
                updatePreferences({ ...preferences, profileVisibility: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="contacts">Contacts Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Control who can see your profile information.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Task Visibility</Label>
            <Select
              value={preferences.taskVisibility}
              onValueChange={(value: "public" | "private" | "team") =>
                updatePreferences({ ...preferences, taskVisibility: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="team">Team Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Control who can see your tasks and progress.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Data Collection & Usage</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activity Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Allow us to track your app usage to improve your experience
              </p>
            </div>
            <Switch
              checked={preferences.activityTracking}
              onCheckedChange={(checked) =>
                updatePreferences({ ...preferences, activityTracking: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data Collection</Label>
              <p className="text-sm text-muted-foreground">
                Allow us to collect anonymous usage data
              </p>
            </div>
            <Switch
              checked={preferences.dataCollection}
              onCheckedChange={(checked) =>
                updatePreferences({ ...preferences, dataCollection: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive marketing and promotional emails
              </p>
            </div>
            <Switch
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) =>
                updatePreferences({ ...preferences, marketingEmails: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Third-Party Data Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow sharing of anonymous data with trusted partners
              </p>
            </div>
            <Switch
              checked={preferences.thirdPartySharing}
              onCheckedChange={(checked) =>
                updatePreferences({ ...preferences, thirdPartySharing: checked })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Permanent actions that cannot be undone.
        </p>

        <div className="mt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
} 