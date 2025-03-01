"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/types";
import { SettingsLayout } from "./settings/settings-layout";
import { SettingsProvider } from "@/lib/contexts/settings-context";

interface SettingsProps {
  user: UserProfile;
  children?: React.ReactNode;
}

export function Settings({ user, children }: SettingsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SettingsProvider>
      <div className="container mx-auto py-6">
        <SettingsLayout user={user}>
          {children}
        </SettingsLayout>
      </div>
    </SettingsProvider>
  );
}