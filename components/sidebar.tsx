import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Bell, FolderKanban, Calendar, UserCircle, Users, Settings } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-white p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 px-2 py-4">
        <div className="w-8 h-8 bg-blue-500 rounded-lg" />
        <span className="font-semibold text-xl">WizTask</span>
      </div>
      
      <div className="space-y-1">
        <h2 className="text-sm font-medium px-2 py-2 text-gray-500">Menu</h2>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Bell className="w-4 h-4" />
          Notification
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <FolderKanban className="w-4 h-4" />
          Project
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Calendar className="w-4 h-4" />
          Calendar
        </Button>
      </div>

      <div className="space-y-1 mt-4">
        <h2 className="text-sm font-medium px-2 py-2 text-gray-500">Account</h2>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <UserCircle className="w-4 h-4" />
          Profile
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Users className="w-4 h-4" />
          Teams
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}

