import { User } from '@supabase/supabase-js';

export interface ProjectType {
  id: string;
  name: string;
  color: string;
  description: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  team_id?: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'To Do' | 'In Progress' | 'In Review' | 'Complete';
    priority: 'Low' | 'Medium' | 'High';
    due_date: string;
    assignees: string[];
    subtasks: Subtask[];
    time_tracked: number;
    project?: string;
    tags: string[];
    dependencies: number[];
    recurrence?: string;
    importance: number;
    urgency: number;
    user_id: string;
}

export interface Subtask {
    id: number;
    title: string;
    completed: boolean;
}

export interface Project {
    id: number;
    name: string;
    description: string;
    color: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectsProps {
    projects: Project[];
    tasks: Task[];
    addProject: (name: string, color: string, description: string) => Promise<void>;
    updateProject: (id: string, name: string, color: string, description: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

export interface TasksProps {
    user: User;
    taskList: Task[];
    projects: Project[];
    addTask: (task: Partial<Task>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: number) => Promise<void>;
    generateSubtasks: (taskId: number) => Promise<void>;
    toggleTaskStatus: (id: number) => Promise<void>;
    setEditingTask: (task: Task | null) => void;
    activeTimer: number | null;
    toggleTimer: (taskId: number) => Promise<void>;
    formatTime: (seconds: number) => string;
}

export interface AnalyticsProps {
    user: User;
    productivityData: { name: string; tasks: number; }[];
    projectTimeData: { name: string; time: number; }[];
    tasks: Task[];
    projects: Project[];
}

export interface TaskType {
    id: number;
    title: string;
    description?: string;
    status: 'To Do' | 'In Progress' | 'In Review' | 'Complete';
    priority: 'Low' | 'Medium' | 'High';
    due_date: string;
    assignees: string[];
    subtasks: Subtask[];
    time_tracked: number;
    project_id?: string;
    project_name?: string;
    tags: string[];
    dependencies: number[];
    recurrence?: string;
    importance: number;
    urgency: number;
    user_id: string;
    team_id?: string;
    created_at?: string;
} 