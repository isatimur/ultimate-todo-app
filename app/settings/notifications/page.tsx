'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-browser';

export default function NotificationsSettings() {
    const [notifications, setNotifications] = useState({
        email_notifications: true,
        push_notifications: true,
        task_reminders: true,
        due_date_reminders: true,
        team_updates: true,
        project_updates: true
    });

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    notifications,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast.success('Notification preferences saved');
        } catch (error) {
            toast.error('Failed to save preferences');
        }
    };

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold mb-8">Notifications</h1>

            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h3 className="font-medium">Email Notifications</h3>
                            <p className="text-sm text-muted-foreground">
                                Receive email updates about your tasks and projects
                            </p>
                        </div>
                        <Switch
                            checked={notifications.email_notifications}
                            onCheckedChange={(checked) =>
                                setNotifications(prev => ({ ...prev, email_notifications: checked }))
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h3 className="font-medium">Push Notifications</h3>
                            <p className="text-sm text-muted-foreground">
                                Get notified about updates in your browser
                            </p>
                        </div>
                        <Switch
                            checked={notifications.push_notifications}
                            onCheckedChange={(checked) =>
                                setNotifications(prev => ({ ...prev, push_notifications: checked }))
                            }
                        />
                    </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                    <h2 className="text-lg font-medium">Notification Preferences</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="font-medium">Task Reminders</h3>
                                <p className="text-sm text-muted-foreground">
                                    Get reminded about upcoming and overdue tasks
                                </p>
                            </div>
                            <Switch
                                checked={notifications.task_reminders}
                                onCheckedChange={(checked) =>
                                    setNotifications(prev => ({ ...prev, task_reminders: checked }))
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="font-medium">Due Date Reminders</h3>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications before task due dates
                                </p>
                            </div>
                            <Switch
                                checked={notifications.due_date_reminders}
                                onCheckedChange={(checked) =>
                                    setNotifications(prev => ({ ...prev, due_date_reminders: checked }))
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="font-medium">Team Updates</h3>
                                <p className="text-sm text-muted-foreground">
                                    Get notified about team member activities
                                </p>
                            </div>
                            <Switch
                                checked={notifications.team_updates}
                                onCheckedChange={(checked) =>
                                    setNotifications(prev => ({ ...prev, team_updates: checked }))
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave}>Save Preferences</Button>
                </div>
            </div>
        </div>
    );
} 