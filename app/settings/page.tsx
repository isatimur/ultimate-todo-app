"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase-browser";
import { User } from "@supabase/supabase-js";

import SettingsLayout from "@/components/settings/settings-layout";
import GeneralSettings from "@/components/settings/general-settings";
import AppearanceSettings from "@/components/settings/appearance-settings";
import NotificationsSettings from "@/components/settings/notifications-settings";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "general";

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (!user) {
          // Redirect to login if no user
          router.push("/login");
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, [router]);

  // Render the appropriate settings component based on the current tab
  const renderSettingsContent = () => {
    if (!user) return null;
    
    switch (tab) {
      case "general":
        return <GeneralSettings user={user} />;
      case "appearance":
        return <AppearanceSettings user={user} />;
      case "notifications":
        return <NotificationsSettings user={user} />;
      default:
        return <GeneralSettings user={user} />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="space-y-6">
          <Skeleton className="h-8 w-[250px]" />
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <div className="md:border-r pr-6">
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[500px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <SettingsLayout currentTab={tab}>
        <Card className="w-full">
          {renderSettingsContent()}
        </Card>
      </SettingsLayout>
    </div>
  );
} 