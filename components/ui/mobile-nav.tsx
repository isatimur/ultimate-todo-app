"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

interface MobileNavProps {
    user: any;
}

export function MobileNav({ user }: MobileNavProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4">
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <Sidebar user={user} />
            </SheetContent>
        </Sheet>
    );
} 