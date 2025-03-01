"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserProfile } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { GeneralSettings } from "./general-settings";
import { NotificationSettings } from "./notification-settings";
import { PrivacySettings } from "./privacy-settings";
import { AppearanceSettings } from "./appearance-settings";

interface SettingsLayoutProps {
  user: UserProfile;
  children?: React.ReactNode;
}

const tabs = [
  { id: "general", label: "General" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy" },
  { id: "appearance", label: "Appearance" },
];

export function SettingsLayout({ user, children }: SettingsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const getCurrentTab = () => {
    const path = pathname.split("/");
    const tab = path[path.length - 1];
    return tabs.some(t => t.id === tab) ? tab : "general";
  };

  const handleTabChange = (value: string) => {
    router.push(`/settings/${value}`);
  };

  const renderSettingsContent = () => {
    if (children) {
      return children;
    }

    const currentTab = getCurrentTab();

    switch (currentTab) {
      case "general":
        return <GeneralSettings user={user} />;
      case "notifications":
        return <NotificationSettings user={user} />;
      case "privacy":
        return <PrivacySettings user={user} />;
      case "appearance":
        return <AppearanceSettings user={user} />;
      default:
        return <GeneralSettings user={user} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="p-6">
        {renderSettingsContent()}
      </Card>
    </div>
  );
}