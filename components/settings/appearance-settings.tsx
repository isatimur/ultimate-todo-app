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
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

interface AppearanceSettingsProps {
  user: UserProfile;
}

interface AppearancePreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'md' | 'lg';
  reducedMotion: boolean;
  compactMode: boolean;
  highContrast: boolean;
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function AppearanceSettings({ user }: AppearanceSettingsProps) {
  const { theme: currentTheme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<AppearancePreferences>({
    theme: 'system',
    fontSize: 'md',
    reducedMotion: false,
    compactMode: false,
    highContrast: false,
    customColors: {
      primary: '#0066cc',
      secondary: '#4d4d4d',
      accent: '#ff6b6b'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('appearance')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data?.appearance) {
          setPreferences(data.appearance as AppearancePreferences);
          setTheme(data.appearance.theme);
        }
      } catch (error) {
        console.error('Error loading appearance preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user.id, setTheme]);

  const updatePreferences = async (newPreferences: AppearancePreferences) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          appearance: newPreferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setPreferences(newPreferences);
      setTheme(newPreferences.theme);
      toast.success('Appearance settings updated');
    } catch (error) {
      console.error('Error updating appearance settings:', error);
      toast.error('Failed to update appearance settings');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Theme</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of the application.
        </p>

        <div className="mt-4 space-y-4">
          <div className="grid gap-2">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={preferences.theme === 'light' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => updatePreferences({ ...preferences, theme: 'light' })}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => updatePreferences({ ...preferences, theme: 'dark' })}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={preferences.theme === 'system' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => updatePreferences({ ...preferences, theme: 'system' })}
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Font Size</Label>
            <Select
              value={preferences.fontSize}
              onValueChange={(value: 'sm' | 'md' | 'lg') =>
                updatePreferences({ ...preferences, fontSize: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Accessibility</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </p>
            </div>
            <Switch
              checked={preferences.reducedMotion}
              onCheckedChange={(checked) =>
                updatePreferences({ ...preferences, reducedMotion: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>High Contrast</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              checked={preferences.highContrast}
              onCheckedChange={(checked) =>
                updatePreferences({ ...preferences, highContrast: checked })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Layout</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Show more content in less space
              </p>
            </div>
            <Switch
              checked={preferences.compactMode}
              onCheckedChange={(checked) =>
                updatePreferences({ ...preferences, compactMode: checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
} 