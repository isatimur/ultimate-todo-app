'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/contexts/settings-context';
import { IconClock, IconBell, IconVolume } from '@tabler/icons-react';

export default function GeneralSettings() {
  const { settings, updateSettings, loading } = useSettings();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-8">General Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="h-5 w-5" />
              Pomodoro Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Session Length (minutes)</Label>
                <Input
                  type="number"
                  value={settings.pomodoroLength}
                  onChange={(e) => updateSettings({ pomodoroLength: parseInt(e.target.value) })}
                  min={1}
                  max={60}
                  className="max-w-[200px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-start Breaks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start break timer after each session
                  </p>
                </div>
                <Switch
                  checked={settings.autoBreak}
                  onCheckedChange={(checked) => updateSettings({ autoBreak: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound when timer completes
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive task and project updates via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser notifications
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 