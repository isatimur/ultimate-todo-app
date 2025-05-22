import React, { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppearanceSettingsPage from '@/app/settings/appearance/page'; // Assuming this is the correct path
import { SettingsContext, SettingsContextType, UserSettings } from '@/lib/contexts/settings-context';
import { toast } from 'sonner';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    // Add other toast methods if used by the component or context
  },
}));

// Mock SettingsContext
const mockUpdateSettings = jest.fn();
let mockCurrentSettings: UserSettings;

interface MockSettingsProviderProps {
  children: ReactNode;
  initialSettings: Partial<UserSettings>; // Allow providing partial settings for tests
}

const MockSettingsProvider = ({ children, initialSettings }: MockSettingsProviderProps) => {
  const defaultSettings: UserSettings = {
    theme: 'light',
    color_scheme: 'blue',
    compact_mode: false,
    reduced_motion: false,
    desktop_notifications: true,
    email_notifications: false,
    ai_suggestions: true,
    default_view: 'list',
    task_grouping: 'default',
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/dd/yyyy',
    time_format: 'hh:mm a',
    id: 'user-settings-1',
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockCurrentSettings = { ...defaultSettings, ...initialSettings };

  const contextValue: SettingsContextType = {
    settings: mockCurrentSettings,
    updateSettings: mockUpdateSettings,
    loading: false, // Can be set to true to test loading states
    setSettings: jest.fn(), // If page directly uses setSettings, mock it too
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};


describe('AppearanceSettingsPage Integration Tests', () => {

  beforeEach(() => {
    mockUpdateSettings.mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();
  });

  const initialTestSettings: UserSettings = {
    theme: 'dark',
    color_scheme: 'green',
    compact_mode: true,
    reduced_motion: false,
    // Fill in other required UserSettings fields if not optional
    desktop_notifications: true,
    email_notifications: false,
    ai_suggestions: true,
    default_view: 'list',
    task_grouping: 'default',
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/dd/yyyy',
    time_format: 'hh:mm a',
    id: 'user-settings-initial',
    user_id: 'user-test-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('Initial Rendering with Context Data', () => {
    it('should correctly reflect initial settings from SettingsContext', () => {
      render(
        <MockSettingsProvider initialSettings={initialTestSettings}>
          <AppearanceSettingsPage />
        </MockSettingsProvider>
      );

      // Assert Theme RadioGroup
      const darkThemeRadio = screen.getByRole('radio', { name: /dark/i });
      expect(darkThemeRadio).toBeChecked();
      const lightThemeRadio = screen.getByRole('radio', { name: /light/i });
      expect(lightThemeRadio).not.toBeChecked();
      const systemThemeRadio = screen.getByRole('radio', { name: /system/i });
      expect(systemThemeRadio).not.toBeChecked();
      
      // Assert Color Scheme Select
      // Shadcn Select's displayed value is often within a button or span
      expect(screen.getByText(initialTestSettings.color_scheme!, { exact: false })).toBeInTheDocument(); // Check if 'green' is displayed

      // Assert Compact Mode Switch
      const compactModeSwitch = screen.getByRole('switch', { name: /compact mode/i });
      expect(compactModeSwitch).toBeChecked(); // initialTestSettings.compact_mode is true

      // Assert Reduced Motion Switch
      const reducedMotionSwitch = screen.getByRole('switch', { name: /reduced motion/i });
      expect(reducedMotionSwitch).not.toBeChecked(); // initialTestSettings.reduced_motion is false
    });
  });

  describe('Interaction and UpdateSettings Calls', () => {
    it('should call updateSettings with { theme: "light" } when Light theme is selected', async () => {
      mockUpdateSettings.mockResolvedValueOnce({ ...initialTestSettings, theme: "light" }); // Simulate successful update

      render(
        <MockSettingsProvider initialSettings={initialTestSettings}>
          <AppearanceSettingsPage />
        </MockSettingsProvider>
      );

      const lightThemeRadio = screen.getByRole('radio', { name: /light/i });
      fireEvent.click(lightThemeRadio);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
        expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: 'light' });
      });
      
      // Optionally, check for toast message if updateSettings triggers one
      // await waitFor(() => {
      //   expect(toast.success).toHaveBeenCalledWith('Appearance settings updated!');
      // });
    });

    it('should call updateSettings with a new color scheme when selected', async () => {
      const newColorScheme = 'purple';
      mockUpdateSettings.mockResolvedValueOnce({ ...initialTestSettings, color_scheme: newColorScheme });

      render(
        <MockSettingsProvider initialSettings={initialTestSettings}>
          <AppearanceSettingsPage />
        </MockSettingsProvider>
      );

      // Shadcn Select: first click the trigger, then the item.
      // The trigger is usually a button or has role 'combobox'.
      // Let's assume the displayed value is inside the trigger.
      const selectTrigger = screen.getByRole('combobox'); // Adjust selector if needed
      fireEvent.mouseDown(selectTrigger); // Open the select dropdown

      // Find and click the new color scheme option.
      // The options might be rendered in a portal, so screen.findByText might be global.
      const purpleOption = await screen.findByText(newColorScheme, { selector: '[role="option"]' });
      fireEvent.click(purpleOption);

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
        expect(mockUpdateSettings).toHaveBeenCalledWith({ color_scheme: newColorScheme });
      });
    });

    it('should call updateSettings with { compact_mode: false } when Compact Mode switch is toggled off', async () => {
      // initialTestSettings.compact_mode is true, so toggling it will set to false.
      mockUpdateSettings.mockResolvedValueOnce({ ...initialTestSettings, compact_mode: false });

      render(
        <MockSettingsProvider initialSettings={initialTestSettings}>
          <AppearanceSettingsPage />
        </MockSettingsProvider>
      );

      const compactModeSwitch = screen.getByRole('switch', { name: /compact mode/i });
      expect(compactModeSwitch).toBeChecked(); // Initial state

      fireEvent.click(compactModeSwitch); // Toggle off

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
        expect(mockUpdateSettings).toHaveBeenCalledWith({ compact_mode: false });
      });
    });

    it('should call updateSettings with { reduced_motion: true } when Reduced Motion switch is toggled on', async () => {
      // initialTestSettings.reduced_motion is false, so toggling it will set to true.
      mockUpdateSettings.mockResolvedValueOnce({ ...initialTestSettings, reduced_motion: true });
      
      render(
        <MockSettingsProvider initialSettings={initialTestSettings}>
          <AppearanceSettingsPage />
        </MockSettingsProvider>
      );

      const reducedMotionSwitch = screen.getByRole('switch', { name: /reduced motion/i });
      expect(reducedMotionSwitch).not.toBeChecked(); // Initial state

      fireEvent.click(reducedMotionSwitch); // Toggle on

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
        expect(mockUpdateSettings).toHaveBeenCalledWith({ reduced_motion: true });
      });
    });
    
    it('should show success toast when updateSettings resolves successfully', async () => {
        mockUpdateSettings.mockResolvedValueOnce({ ...initialTestSettings, theme: "system" });
        render(
            <MockSettingsProvider initialSettings={initialTestSettings}>
              <AppearanceSettingsPage />
            </MockSettingsProvider>
          );
        
        const systemThemeRadio = screen.getByRole('radio', { name: /system/i });
        fireEvent.click(systemThemeRadio);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Appearance settings updated successfully!');
        });
    });

    it('should show error toast when updateSettings rejects', async () => {
        mockUpdateSettings.mockRejectedValueOnce(new Error('Failed to update'));
        render(
            <MockSettingsProvider initialSettings={initialTestSettings}>
              <AppearanceSettingsPage />
            </MockSettingsProvider>
          );

        const lightThemeRadio = screen.getByRole('radio', { name: /light/i });
        fireEvent.click(lightThemeRadio);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to update appearance settings.');
        });
    });
  });
});
