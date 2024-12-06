'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-browser';
import { Separator } from './ui/separator';
import { IconBell, IconBrush, IconClock, IconSettings, IconVolume } from '@tabler/icons-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SettingsProps {
    user: User | null;
}

interface UserSettings {
    id: string;
    theme: 'light' | 'dark' | 'system';
    color_scheme: 'blue' | 'green' | 'purple' | 'orange';
    reduced_motion: boolean;
    compact_mode: boolean;
    font_size: 'small' | 'normal' | 'large';
    email_notifications: boolean;
    push_notifications: boolean;
    task_reminders: boolean;
    due_date_reminders: boolean;
    team_updates: boolean;
    pomodoro_length: number;
    auto_break: boolean;
    sound_enabled: boolean;
    updated_at: string;
}

export default function Settings({ user }: SettingsProps) {
    const { setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<UserSettings | null>(null);


    useEffect(() => {
        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {

            if (!user) return;

            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setSettings(data);
                setTheme(data.theme);
            } else {
                // Create initial settings with proper user ID
                const initialSettings: UserSettings = {
                    id: user.id,  // Ensure user ID is set
                    theme: 'system',
                    color_scheme: 'blue',
                    reduced_motion: false,
                    compact_mode: false,
                    font_size: 'normal',
                    email_notifications: true,
                    push_notifications: true,
                    task_reminders: true,
                    due_date_reminders: true,
                    team_updates: true,
                    pomodoro_length: 25,
                    auto_break: true,
                    sound_enabled: true,
                    updated_at: new Date().toISOString()
                };

                const { error: insertError } = await supabase
                    .from('user_settings')
                    .upsert([initialSettings], {
                        onConflict: 'id'
                    });

                if (insertError) throw insertError;

                setSettings(initialSettings);
                setTheme(initialSettings.theme);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Error fetching settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
        try {
            if (!user?.id) {
                throw new Error('User ID is required');
            }

            const updatedSettings = {
                ...settings,
                ...updates,
                id: user.id,  // Ensure user ID is set
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_settings')
                .upsert(updatedSettings, {
                    onConflict: 'id'
                });

            if (error) throw error;

            setSettings(updatedSettings as UserSettings);
            if (updates.theme) setTheme(updates.theme);
            toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Error updating settings');
        }
    };

    // Add debug logging
    console.log('Settings state:', { loading, settings, userId: user?.id });

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Please sign in to view settings</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Unable to load settings</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6 p-6"
        >
            <Tabs defaultValue="appearance">
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="appearance">
                        <IconBrush className="h-4 w-4 mr-2" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <IconBell className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="pomodoro">
                        <IconClock className="h-4 w-4 mr-2" />
                        Pomodoro
                    </TabsTrigger>
                    <TabsTrigger value="preferences">
                        <IconSettings className="h-4 w-4 mr-2" />
                        Preferences
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Theme</Label>
                                <Select
                                    value={settings.theme}
                                    onValueChange={(value: UserSettings['theme']) =>
                                        handleUpdateSettings({ theme: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="system">System</SelectItem>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Color Scheme</Label>
                                <Select
                                    value={settings.color_scheme}
                                    onValueChange={(value: UserSettings['color_scheme']) =>
                                        handleUpdateSettings({ color_scheme: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select color scheme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="blue">Blue</SelectItem>
                                        <SelectItem value="green">Green</SelectItem>
                                        <SelectItem value="purple">Purple</SelectItem>
                                        <SelectItem value="orange">Orange</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Font Size</Label>
                                <Select
                                    value={settings.font_size}
                                    onValueChange={(value: UserSettings['font_size']) =>
                                        handleUpdateSettings({ font_size: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select font size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="large">Large</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Reduced Motion</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Reduce animation and motion effects
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.reduced_motion}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ reduced_motion: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Compact Mode</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Use compact layout for denser content
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.compact_mode}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ compact_mode: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive email notifications
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.email_notifications}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ email_notifications: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Push Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive push notifications
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.push_notifications}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ push_notifications: checked })}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Task Reminders</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get reminded about upcoming tasks
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.task_reminders}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ task_reminders: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Due Date Reminders</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get reminded about due dates
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.due_date_reminders}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ due_date_reminders: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Team Updates</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive team activity updates
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.team_updates}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ team_updates: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pomodoro" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pomodoro Timer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Session Length (minutes)</Label>
                                <Select
                                    value={settings.pomodoro_length.toString()}
                                    onValueChange={(value) =>
                                        handleUpdateSettings({ pomodoro_length: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select length" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="25">25 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="45">45 minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Auto-start Breaks</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically start break timer after session
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.auto_break}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ auto_break: checked })}
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
                                        checked={settings.sound_enabled}
                                        onCheckedChange={(checked) =>
                                            handleUpdateSettings({ sound_enabled: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add any additional preferences here */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}