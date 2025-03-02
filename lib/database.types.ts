export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

interface TimerSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
}

export interface Database {
  public: {
    Tables: {
      invitations: {
        Row: {
          email: string
          id: number
          invited_at: string
          responded_at: string | null
          status: string | null
          team_id: number | null
          token: string
        }
        Insert: {
          email: string
          id?: number
          invited_at?: string
          responded_at?: string | null
          status?: string | null
          team_id?: number | null
          token: string
        }
        Update: {
          email?: string
          id?: number
          invited_at?: string
          responded_at?: string | null
          status?: string | null
          team_id?: number | null
          token?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          location: string | null
          phone: string | null
          privacy_settings: Json | null
          skills: string[] | null
          social_links: Json | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          location?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          skills?: string[] | null
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          skills?: string[] | null
          social_links?: Json | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: number
          name: string
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          id?: number
          name: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string
          completed_at: string | null
          created_at: string
          updated_at: string
          project_id: string | null
          team_id: string | null
          user_id: string
          time_tracked: number | null
          tags: string[] | null
          position_key: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          project_id?: string | null
          team_id?: string | null
          user_id: string
          time_tracked?: number | null
          tags?: string[] | null
          position_key?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          project_id?: string | null
          team_id?: string | null
          user_id?: string
          time_tracked?: number | null
          tags?: string[] | null
          position_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subtasks: {
        Row: {
          id: string
          title: string
          completed: boolean
          task_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          completed?: boolean
          task_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          completed?: boolean
          task_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      team_invitations: {
        Row: {
          email: string
          expires_at: string | null
          id: string
          invited_at: string | null
          role: string
          status: string
          team_id: string
          token: string | null
        }
        Insert: {
          email: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          role: string
          status?: string
          team_id: string
          token?: string | null
        }
        Update: {
          email?: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          role?: string
          status?: string
          team_id?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          user_id: string
          team_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          id: number
          name: string
          tasks: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          tasks?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          tasks?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          end_time: string | null
          id: string
          project_id: number | null
          start_time: string
          task_id: number | null
          updated_at: string | null
          user_id: string | null
          type: 'pomodoro' | 'break' | 'manual'
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          end_time?: string | null
          id?: string
          project_id?: number | null
          start_time: string
          task_id?: number | null
          updated_at?: string | null
          user_id?: string | null
          type?: 'pomodoro' | 'break' | 'manual'
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          end_time?: string | null
          id?: string
          project_id?: number | null
          start_time?: string
          task_id?: number | null
          updated_at?: string | null
          user_id?: string | null
          type?: 'pomodoro' | 'break' | 'manual'
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          notifications: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          notifications?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          notifications?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          created_at: string | null
          updated_at: string | null
          timer_settings: TimerSettings | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string | null
          updated_at?: string | null
          timer_settings?: TimerSettings | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
          timer_settings?: TimerSettings | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          assigned_by: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          assigned_by: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          assigned_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      color_scheme: "blue" | "green" | "purple" | "orange"
      font_size: "small" | "normal" | "large"
      theme_type: "light" | "dark" | "system"
      task_status: 'To Do' | 'In Progress' | 'In Review' | 'Complete'
      task_priority: 'Low' | 'Medium' | 'High'
      team_role: 'owner' | 'admin' | 'member'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type DbTable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type DbEnum<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  job_title?: string;
  company?: string;
  phone?: string;
  date_of_birth?: string;
  social_links?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  skills?: string[];
  privacy_settings?: {
    show_email: boolean;
    show_phone: boolean;
    profile_visibility: 'public' | 'private' | 'friends_only';
  };
  created_at?: string;
  updated_at?: string;
}

export type TeamWithMembers = DbTable<'teams'> & {
  members: (DbTable<'team_members'> & {
    profiles: DbTable<'profiles'>
  })[]
}

export type TeamMemberWithProfile = DbTable<'team_members'> & {
  profiles: DbTable<'profiles'>
}

export type TeamInvitation = DbTable<'team_invitations'>