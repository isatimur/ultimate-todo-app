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
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: number
          joined_at: string
          role: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          joined_at?: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          joined_at?: string
          role?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
