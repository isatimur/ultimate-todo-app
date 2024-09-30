"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export const ThemeSwitcherButton = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, [setTheme]);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    if (!mounted) {
        return null; // Prevent rendering until client-side
    }

    return (
        <button
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-md border border-neutral-500/10 bg-white px-2 py-1 font-medium text-neutral-600 tracking-tight hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            onClick={toggleTheme}
            type="button"
        >
            <span
                className={cn(
                    "relative size-6 scale-75 rounded-full bg-gradient-to-tr",
                )}
            >
                <span
                    className={cn(
                        "absolute top-0 left-0 z-10 h-full w-full transform-gpu rounded-full bg-gradient-to-tr from-indigo-400 to-sky-200 transition-transform duration-500",
                        theme === "dark" ? "scale-100" : "scale-0",
                    )}
                />
                <span
                    className={cn(
                        "absolute top-0 left-0 z-10 h-full w-full transform-gpu rounded-full bg-gradient-to-tr from-rose-400 to-amber-300 transition-transform duration-500 dark:from-rose-600 dark:to-amber-600",
                        theme === "light" ? "scale-100" : "scale-0",
                    )}
                />
                <span
                    className={cn(
                        "absolute top-0 right-0 z-20 size-4 origin-top-right transform-gpu rounded-full bg-white transition-transform duration-500 group-hover:bg-neutral-100 dark:bg-neutral-800 group-hover:dark:bg-neutral-700",
                        theme === "dark" ? "scale-100" : "scale-0",
                    )}
                />
            </span>
            <span className="relative h-6 w-12">
                <span
                    className={cn(
                        "absolute top-0 left-0 transition-all duration-1000",
                        theme === "light"
                            ? "-translate-y-4 opacity-0 blur-lg"
                            : "translate-y-0 opacity-100 blur-0",
                    )}
                >
                    Dark
                </span>
                <span
                    className={cn(
                        "absolute top-0 left-0 transition-all duration-1000",
                        theme === "dark"
                            ? "translate-y-4 opacity-0 blur-lg"
                            : "translate-y-0 opacity-100 blur-0",
                    )}
                >
                    Light
                </span>
            </span>
        </button>
    );
};
