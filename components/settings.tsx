"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/types";
import SettingsLayout from "./settings/settings-layout";
import { SettingsProvider } from "@/lib/contexts/settings-context";

/**
 * Props interface for the Settings component
 * 
 * @interface SettingsProps
 * @property {UserProfile} user - User profile information
 * @property {React.ReactNode} [children] - Optional child components to render within settings
 * @property {string} currentTab - Current active settings tab
 */
interface SettingsProps {
  user: UserProfile;
  children?: React.ReactNode;
  currentTab: string;
}

/**
 * Main Settings component that wraps settings content with the SettingsProvider
 * and SettingsLayout components. Handles client-side rendering with useEffect.
 * 
 * @param {SettingsProps} props - Component props
 * @param {UserProfile} props.user - User profile information
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.currentTab - Current active settings tab
 * @returns {JSX.Element | null} The rendered settings component or null during SSR
 * 
 * @example
 * <Settings user={currentUser} currentTab="general">
 *   <GeneralSettings />
 * </Settings>
 */
export function Settings({ user, children, currentTab }: SettingsProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SettingsProvider>
      <div className="container mx-auto py-6">
        <SettingsLayout currentTab={currentTab}>
          {children}
        </SettingsLayout>
      </div>
    </SettingsProvider>
  );
}