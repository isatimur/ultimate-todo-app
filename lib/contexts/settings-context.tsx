'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';

interface UserSettings {
    // Appearance
    theme: 'light' | 'dark' | 'system';
    color_scheme: 'blue' | 'green' | 'purple' | 'orange';
    reduced_motion: boolean;
    compact_mode: boolean;
    font_size: 'small' | 'normal' | 'large';

    // Notifications
    email_notifications: boolean;
    push_notifications: boolean;
    task_reminders: boolean;
    due_date_reminders: boolean;
    team_updates: boolean;

    // Pomodoro
    pomodoro_length: number;
    auto_break: boolean;
    sound_enabled: boolean;
}

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const defaultSettings: UserSettings = {
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
    };

    const [settings, setSettings] = useState<UserSettings>(defaultSettings);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setSettings(data);
            } else {
                // Create default settings for new user
                const { error: insertError } = await supabase
                    .from('user_settings')
                    .insert({
                        id: user.id,
                        ...defaultSettings,
                        updated_at: new Date().toISOString(),
                    });

                if (insertError) throw insertError;
                setSettings(defaultSettings);
            }
        } catch (error) {
            toast.error('Failed to load settings');
            console.error('Settings error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateSettings(newSettings: Partial<UserSettings>) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);

            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    id: user.id,
                    ...updatedSettings,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            toast.success('Settings updated successfully');
        } catch (error: unknown) {
            toast.error('Failed to update settings');
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}