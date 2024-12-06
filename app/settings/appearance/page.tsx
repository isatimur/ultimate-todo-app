'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/lib/contexts/settings-context';
import { IconSun, IconMoon, IconDeviceDesktop, IconPalette } from '@tabler/icons-react';

export default function AppearanceSettings() {
    const { settings, updateSettings, loading } = useSettings();

    const themes = [
        {
            value: 'light',
            label: 'Light',
            icon: IconSun
        },
        {
            value: 'dark',
            label: 'Dark',
            icon: IconMoon
        },
        {
            value: 'system',
            label: 'System',
            icon: IconDeviceDesktop
        }
    ];

    const colorSchemes = [
        { value: 'blue', label: 'Blue' },
        { value: 'green', label: 'Green' },
        { value: 'purple', label: 'Purple' },
        { value: 'orange', label: 'Orange' }
    ];

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold mb-8">Appearance</h1>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconPalette className="h-5 w-5" />
                            Theme
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RadioGroup
                            value={settings.theme}
                            onValueChange={(value: 'light' | 'dark' | 'system') => updateSettings({ theme: value })}
                            className="grid grid-cols-3 gap-4"
                        >
                            {themes.map(({ value, label, icon: Icon }) => (
                                <Label
                                    key={value}
                                    className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 hover:bg-accent cursor-pointer"
                                >
                                    <RadioGroupItem value={value} className="sr-only" />
                                    <Icon className="h-6 w-6" />
                                    <span>{label}</span>
                                </Label>
                            ))}
                        </RadioGroup>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Color Scheme</Label>
                                <Select
                                    value={settings.color_scheme}
                                    onValueChange={(value: 'blue' | 'green' | 'purple' | 'orange') =>
                                        updateSettings({ color_scheme: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select color scheme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colorSchemes.map(({ value, label }) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Compact Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Make the interface more compact
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.compact_mode}
                                    onCheckedChange={(checked) => updateSettings({ compact_mode: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Reduced Motion</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Reduce interface animations
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.reduced_motion}
                                    onCheckedChange={(checked) => updateSettings({ reduced_motion: checked })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 