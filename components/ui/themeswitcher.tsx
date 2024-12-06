"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface ThemeSwitcherButtonProps {
    className?: string;
    collapsed?: boolean;
}

export function ThemeSwitcherButton({ className, collapsed = false }: ThemeSwitcherButtonProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "w-full h-11",
                collapsed ? "justify-center" : "justify-start px-3",
                className
            )}
        >
            <div className="flex items-center gap-3">
                {isDark ? (
                    <Moon className="h-5 w-5 shrink-0" />
                ) : (
                    <Sun className="h-5 w-5 shrink-0" />
                )}
                {!collapsed && (
                    <span className="text-sm font-medium">
                        {isDark ? "Light Mode" : "Dark Mode"}
                    </span>
                )}
            </div>
        </Button>
    );
}
