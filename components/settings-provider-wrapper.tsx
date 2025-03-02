'use client';

import { SettingsProvider } from "@/lib/contexts/settings-context";

/**
 * Client component wrapper for the SettingsProvider
 * 
 * This component serves as a client-side wrapper for the SettingsProvider context,
 * allowing it to be used in server components. It's specifically designed to be
 * imported in the settings layout to provide settings context to all settings pages.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to settings context
 * @returns {JSX.Element} The SettingsProvider wrapped around children
 * 
 * @example
 * // In a layout component
 * <SettingsProviderWrapper>
 *   {children}
 * </SettingsProviderWrapper>
 */
export default function SettingsProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
} 