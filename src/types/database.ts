// ============================================================
// HabitPixel — Database Types
// Aligned with supabase/migrations/001_initial_schema.sql
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---- Raw Row Types (DB layer) --------------------------------

export interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  level: number
  xp: number
  timezone: string
  created_at: string
  updated_at: string
}

export interface HabitRow {
  id: string
  user_id: string
  name: string
  category: string | null
  color_hex: string
  icon_key: string
  position: number
  is_archived: boolean
  created_at: string
}

export interface HabitLogRow {
  id: string
  habit_id: string
  user_id: string
  date: string // ISO date string 'YYYY-MM-DD'
  completed: boolean
  created_at: string
}

export interface MonthlyGoalRow {
  id: string
  user_id: string
  year: number
  month: number
  title: string
  completed: boolean
  created_at: string
}

// ---- Supabase Database shape (for typed client) --------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'> &
          Partial<Pick<ProfileRow, 'created_at' | 'updated_at'>>
        Update: Partial<Omit<ProfileRow, 'id'>>
      }
      habits: {
        Row: HabitRow
        Insert: Omit<HabitRow, 'id' | 'created_at'> &
          Partial<Pick<HabitRow, 'id' | 'created_at'>>
        Update: Partial<Omit<HabitRow, 'id' | 'user_id' | 'created_at'>>
      }
      habit_logs: {
        Row: HabitLogRow
        Insert: Omit<HabitLogRow, 'id' | 'created_at'> &
          Partial<Pick<HabitLogRow, 'id' | 'created_at'>>
        Update: Partial<Pick<HabitLogRow, 'completed'>>
      }
      monthly_goals: {
        Row: MonthlyGoalRow
        Insert: Omit<MonthlyGoalRow, 'id' | 'created_at'> &
          Partial<Pick<MonthlyGoalRow, 'id' | 'created_at'>>
        Update: Partial<Pick<MonthlyGoalRow, 'title' | 'completed'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ---- Convenience aliases ------------------------------------

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
