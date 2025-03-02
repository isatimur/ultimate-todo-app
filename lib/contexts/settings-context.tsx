'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { toast } from 'sonner';

/**
 * Interface defining user settings structure
 * 
 * @interface UserSettings
 * @property {string} theme - UI theme preference ('light', 'dark', or 'system')
 * @property {string} color_scheme - Color scheme preference
 * @property {boolean} reduced_motion - Whether to reduce UI animations
 * @property {boolean} compact_mode - Whether to use compact UI mode
 * @property {string} font_size - Font size preference
 * @property {boolean} email_notifications - Whether to send email notifications
 * @property {boolean} push_notifications - Whether to send push notifications
 * @property {boolean} task_reminders - Whether to send task reminders
 * @property {boolean} due_date_reminders - Whether to send due date reminders
 * @property {boolean} team_updates - Whether to send team updates
 * @property {number} pomodoro_length - Length of pomodoro sessions in minutes
 * @property {boolean} auto_break - Whether to automatically start breaks
 * @property {boolean} sound_enabled - Whether to play sounds
 */
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

/**
 * Interface for the settings context
 * 
 * @interface SettingsContextType
 * @property {UserSettings} settings - Current user settings
 * @property {Function} updateSettings - Function to update settings
 * @property {boolean} loading - Whether settings are currently loading
 */
interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    loading: boolean;
}

// Create context with undefined default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Provider component for settings context
 * Manages loading, storing, and updating user settings
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with settings context
 */
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

    /**
     * Loads user settings from Supabase
     * Creates default settings for new users
     */
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

    /**
     * Updates user settings in state and database
     * 
     * @param {Partial<UserSettings>} newSettings - Settings to update
     * @returns {Promise<void>} Promise that resolves when update is complete
     */
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

/**
 * Custom hook to access settings context
 * 
 * @returns {SettingsContextType} Settings context with current settings and update function
 * @throws {Error} If used outside of SettingsProvider
 * 
 * @example
 * // In a component
 * const { settings, updateSettings, loading } = useSettings();
 * 
 * // Update a setting
 * updateSettings({ theme: 'dark' });
 */
export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}