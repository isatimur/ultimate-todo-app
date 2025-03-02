import { Metadata } from "next";
import SettingsProviderWrapper from "@/components/settings-provider-wrapper";

export const metadata: Metadata = {
  title: "Settings | Ultimate Todo App",
  description: "Manage your account settings and preferences",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProviderWrapper>
      {children}
    </SettingsProviderWrapper>
  );
} 