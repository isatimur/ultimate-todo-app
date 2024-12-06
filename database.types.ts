export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          assigned_to: string | null
          assignees: string[] | null
          created_at: string
          dependencies: number[] | null
          description: string | null
          due_date: string
          id: number
          importance: number | null
          priority: string
          project: string | null
          recurrence: string | null
          status: string
          subtasks: Json | null
          tags: string[] | null
          team_id: string | null
          time_tracked: number | null
          title: string
          updated_at: string
          urgency: number | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          assignees?: string[] | null
          created_at?: string
          dependencies?: number[] | null
          description?: string | null
          due_date: string
          id?: number
          importance?: number | null
          priority: string
          project?: string | null
          recurrence?: string | null
          status: string
          subtasks?: Json | null
          tags?: string[] | null
          team_id?: string | null
          time_tracked?: number | null
          title: string
          updated_at?: string
          urgency?: number | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          assignees?: string[] | null
          created_at?: string
          dependencies?: number[] | null
          description?: string | null
          due_date?: string
          id?: number
          importance?: number | null
          priority?: string
          project?: string | null
          recurrence?: string | null
          status?: string
          subtasks?: Json | null
          tags?: string[] | null
          team_id?: string | null
          time_tracked?: number | null
          title?: string
          updated_at?: string
          urgency?: number | null
          user_id?: string | null
        }
        Relationships: []
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
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
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
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
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
          },
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
          auto_break: boolean
          color_scheme: string
          compact_mode: boolean
          due_date_reminders: boolean
          email_notifications: boolean
          font_size: string
          id: string
          pomodoro_length: number
          push_notifications: boolean
          reduced_motion: boolean
          sound_enabled: boolean
          task_reminders: boolean
          team_updates: boolean
          theme: string
          updated_at: string | null
        }
        Insert: {
          auto_break?: boolean
          color_scheme?: string
          compact_mode?: boolean
          due_date_reminders?: boolean
          email_notifications?: boolean
          font_size?: string
          id: string
          pomodoro_length?: number
          push_notifications?: boolean
          reduced_motion?: boolean
          sound_enabled?: boolean
          task_reminders?: boolean
          team_updates?: boolean
          theme?: string
          updated_at?: string | null
        }
        Update: {
          auto_break?: boolean
          color_scheme?: string
          compact_mode?: boolean
          due_date_reminders?: boolean
          email_notifications?: boolean
          font_size?: string
          id?: string
          pomodoro_length?: number
          push_notifications?: boolean
          reduced_motion?: boolean
          sound_enabled?: boolean
          task_reminders?: boolean
          team_updates?: boolean
          theme?: string
          updated_at?: string | null
        }
        Relationships: []
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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

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
