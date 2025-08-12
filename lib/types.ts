import { ProjectsProps } from "@/components/projects";
import type { Database } from './database.types'

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Complete'
export type TaskCategory = 'Work' | 'Personal' | 'Errands' | 'Other'
export type RecurrencePattern = "Daily" | "Weekly" | "Monthly" | "Yearly" | "None"

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  date: string;
  due_date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
  project?: string;
  project_details?: {
    id: string;
    name: string;
    color: string;
    description?: string;
  } | null;
  time_tracked?: number;
  start_time?: string; // HH:MM format
  end_time?: string;  // HH:MM format
  subtasks?: any[];
  tags?: string[];
  dependencies?: string[];
  recurrence?: string | null;
  assignees?: string[];
  team_id?: string;
  importance?: number;
  urgency?: number;
  position_key?: string;
}

export type Project = Database['public']['Tables']['projects']['Row']
export type Subtask = Database['public']['Tables']['subtasks']['Row']

export interface Attachment {
  id: string
  task_id: string
  file_path: string
  file_name: string
  file_size: number
  content_type: string
  uploaded_by: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    full_name: string
    avatar_url: string
  }
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  settings?: {
    default_task_view?: 'list' | 'board' | 'calendar';
    task_statuses?: TaskStatus[];
    task_priorities?: TaskPriority[];
    custom_fields?: {
      id: string;
      name: string;
      type: 'text' | 'number' | 'date' | 'select';
      options?: string[];
    }[];
  };
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  expires_at: string;
  invited_by_id: string;
}

export interface Notification {
  id: string
  user_id: string
  type: string
  data: Record<string, any>
  read: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  updated_at?: string
  timezone?: string
  language?: string
}

export interface Column {
  id: string
  title: string
  tasks: Task[]
  order: number
}

export type View = "board" | "calendar" | "list" | "gantt" | "table"

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  tasks: {
    title: string;
    description?: string;
    checklist: {
      id: string;
      title: string;
      completed: boolean;
    }[];
    estimatedTime?: number;
    priority?: TaskPriority;
    category?: TaskCategory;
    dueDate?: string;
  }[];
  teamId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  permissions: {
    canView: string[];  // User IDs
    canEdit: string[];  // User IDs
    canShare: string[]; // User IDs
  };
  tags: string[];
  category?: string;
  version: number;
  lastUsed?: string;
  usageCount: number;
}

export interface TaskType {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignees?: string[]
  importance: number
  urgency: number
  project?: string
  due_date?: string
  time_tracked?: number
  tags?: string[]
  recurrence?: RecurrencePattern
  team_id?: string
  user_id: string
  subtasks?: Subtask[]
  dependencies?: string[]
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface TasksProps {
  taskList: TaskType[]
  projects: ProjectsProps[]
  user: UserProfile
  addTask: (task: Partial<Task>) => Promise<void>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  generateSubtasks: (taskId: string) => Promise<void>
  toggleTaskStatus: (id: string) => Promise<void>
  setEditingTask: (task: Task | null) => void
}

export interface ProjectType {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
  updated_at: string
  owner_id: string
}

export interface Template {
  id: string
  name: string
  tasks: Omit<Task, 'id' | 'time_tracked'>[]
}