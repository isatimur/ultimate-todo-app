'use client';

import { Sidebar } from '@/components/ui/sidebar';
import { DashboardView } from '@/components/dashboard-view';
import { Tasks } from '@/components/tasks';
import { CalendarView } from '@/components/calendar-view';
import Projects from '@/components/projects';
import Profile from '@/components/profile';
import TeamsView from '@/components/teams-view';
import { PomodoroTimer } from '@/components/pomodoro-timer';
import { useStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';

interface ClientHomeProps {
  user: any;
}

export function ClientHome({ user }: ClientHomeProps) {
  const {
    tasks,
    projects,
    activeTimer,
    activeTask,
    isPomodoro,
    pomodoroTime,
    fetchTasks,
    fetchProjects,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    addProject,
    updateProject,
    deleteProject,
    generateSubtasks,
    setEditingTask,
    toggleTimer,
    formatTime,
    handlePomodoroComplete,
    setPomodoroTime
  } = useStore();

  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pomodoroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            tasks={tasks}
            projects={projects}
            onTaskUpdate={updateTask}
            onTaskDelete={deleteTask}
            onAddTask={addTask}
          />
        );
      case 'tasks':
        return (
          <Tasks
            initialTasks={tasks}
            projects={projects}
            addTask={addTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
            generateSubtasks={generateSubtasks}
            toggleTaskStatus={toggleTaskStatus}
            setEditingTask={setEditingTask}
            activeTimer={activeTimer}
            toggleTimer={toggleTimer}
            formatTime={formatTime}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            tasks={tasks}
            projects={projects}
            onTaskUpdate={updateTask}
            onTaskDelete={deleteTask}
            onAddTask={addTask}
          />
        );
      case 'projects':
        return (
          <Projects
            projects={projects}
            tasks={tasks}
            addProject={addProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
          />
        );
      case 'profile':
        return <Profile user={user} />;
      case 'settings':
        return (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Please use the settings page for a full settings experience.</p>
            </CardContent>
          </Card>
        );
      case 'teams':
        return (
          <TeamsView
            userId={user?.id || ''}
            userEmail={user?.email || ''}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background">
      <Sidebar 
        user={user}
        className="border-r"
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="container mx-auto p-6 max-w-7xl"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <PomodoroTimer
        isPomodoro={isPomodoro}
        pomodoroTime={pomodoroTime}
        pomodoroRef={pomodoroRef}
        onPomodoroComplete={handlePomodoroComplete}
        onPomodoroStart={() => {}}
        onPomodoroPause={() => {}}
        onPomodoroReset={() => {}}
      />
    </div>
  );
} 