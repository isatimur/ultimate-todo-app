'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Sidebar } from '@/components/ui/sidebar';
import { AppHeader } from '@/components/app-header';
import { VoiceTaskSidebar } from '@/components/voice-task-sidebar';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';
import { Database } from '@/lib/database.types';

export default function ClientWrapper({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: any;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(initialUser);

  // Create Supabase client
  const createClient = () => {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  };

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle sidebar collapse state
  const handleSidebarCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  // Close sidebar when clicking outside on mobile
  const handleBackdropClick = () => {
    setIsSidebarOpen(false);
  };

  // Add a task to the database
  async function addTask(task: Partial<Task>) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('You must be logged in to add a task');
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          { 
            ...task,
            user_id: user.id 
          }
        ])
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader 
        user={user}
        toggleSidebar={toggleSidebar} 
        onAddTask={addTask} 
      />
      
      {/* Backdrop for mobile sidebar */}
      <div 
        className={cn(
          "fixed inset-0 z-20 bg-background/80 backdrop-blur-sm transition-all duration-100",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleBackdropClick}
      />
      
      <div className="flex flex-1 relative">
        <Sidebar 
          user={user} 
          isOpen={isSidebarOpen}
          onCollapseChange={handleSidebarCollapse}
        />
        
        <main className={cn(
          "flex-1 transition-all duration-200 ease-in-out",
          isCollapsed ? "md:ml-16" : "md:ml-64",
          "pt-14" // Space for header
        )}>
          <div className="flex justify-center w-full">
            <div className="w-full max-w-[1400px]">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <VoiceTaskSidebar onAddTask={addTask} />
    </div>
  );
} 