'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { HabitRow, HabitLogRow } from '@/types/database'
import { getTodayString, toISODateString } from '@/lib/date-utils'

// ---- Query Keys -----------------------------------------------

export const habitKeys = {
  all: ['habits'] as const,
  active: () => [...habitKeys.all, 'active'] as const,
  logs: (year: number, month: number) => ['habit_logs', year, month] as const,
}

// ---- Mock Data (DEV ONLY — replace with real Supabase calls) --
// When NEXT_PUBLIC_SUPABASE_URL is not set, we use mock data so the
// UI can be developed without a live Supabase project.

const MOCK_USER_ID = 'mock-user-00000000-0000-0000-0000-000000000000'

const MOCK_HABITS: HabitRow[] = [
  {
    id: 'habit-1',
    user_id: MOCK_USER_ID,
    name: 'Meditación',
    category: 'Bienestar',
    color_hex: '#10B981',
    icon_key: 'brain',
    position: 0,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    user_id: MOCK_USER_ID,
    name: 'Ejercicio',
    category: 'Salud',
    color_hex: '#EC4899',
    icon_key: 'dumbbell',
    position: 1,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    user_id: MOCK_USER_ID,
    name: 'Lectura',
    category: 'Enfoque',
    color_hex: '#06B6D4',
    icon_key: 'book-open',
    position: 2,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-4',
    user_id: MOCK_USER_ID,
    name: 'Programar',
    category: 'Enfoque',
    color_hex: '#A78BFA',
    icon_key: 'code',
    position: 3,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-5',
    user_id: MOCK_USER_ID,
    name: 'Agua (2L)',
    category: 'Salud',
    color_hex: '#38BDF8',
    icon_key: 'droplets',
    position: 4,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'habit-6',
    user_id: MOCK_USER_ID,
    name: 'Diario',
    category: 'Bienestar',
    color_hex: '#F59E0B',
    icon_key: 'pen-line',
    position: 5,
    is_archived: false,
    created_at: new Date().toISOString(),
  },
]

function generateMockLogs(year: number, month: number): HabitLogRow[] {
  const logs: HabitLogRow[] = []
  const today = getTodayString()
  const daysInMonth = new Date(year, month, 0).getDate()

  MOCK_HABITS.forEach((habit, hi) => {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toISODateString(year, month, day)
      if (dateStr > today) continue
      // Deterministic pseudo-random completion (varied per habit)
      const seed = (hi * 31 + day) % 7
      if (seed < 5) {
        logs.push({
          id: `log-${habit.id}-${dateStr}`,
          habit_id: habit.id,
          user_id: MOCK_USER_ID,
          date: dateStr,
          completed: true,
          created_at: new Date().toISOString(),
        })
      }
    }
  })
  return logs
}

const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL

// ---- Hooks ---------------------------------------------------

/**
 * Fetches active (non-archived) habits for the current user.
 */
export function useHabits() {
  return useQuery({
    queryKey: habitKeys.active(),
    queryFn: async (): Promise<HabitRow[]> => {
      if (isMock) return MOCK_HABITS

      const supabase = createClient()
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_archived', false)
        .order('position', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

/**
 * Fetches all habit logs for a given year/month.
 */
export function useHabitLogs(year: number, month: number) {
  const startDate = toISODateString(year, month, 1)
  const endDate = toISODateString(year, month, new Date(year, month, 0).getDate())

  return useQuery({
    queryKey: habitKeys.logs(year, month),
    queryFn: async (): Promise<HabitLogRow[]> => {
      if (isMock) return generateMockLogs(year, month)

      const supabase = createClient()
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error
      return data
    },
  })
}

// ---- Toggle Mutation (Optimistic) ----------------------------

interface ToggleLogArgs {
  habitId: string
  date: string
  currentlyCompleted: boolean
}

/**
 * Optimistic toggle: updates local cache instantly (0ms),
 * then syncs to Supabase in background with rollback on error.
 */
export function useToggleHabitLog(year: number, month: number) {
  const queryClient = useQueryClient()
  const logsKey = habitKeys.logs(year, month)

  return useMutation({
    mutationFn: async ({ habitId, date, currentlyCompleted }: ToggleLogArgs) => {
      if (isMock) {
        // Simulate network delay in mock mode
        await new Promise((r) => setTimeout(r, 100))
        return
      }

      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      if (!currentlyCompleted) {
        const userId = (await supabase.auth.getUser()).data.user?.id ?? ''
        const { error } = await db.from('habit_logs').upsert(
          { habit_id: habitId, user_id: userId, date, completed: true },
          { onConflict: 'habit_id,date' },
        )
        if (error) throw error
      } else {
        // Mark incomplete: delete the log row
        const { error } = await db
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', date)
        if (error) throw error
      }
    },

    // ---- Optimistic update -----------------------------------
    onMutate: async ({ habitId, date, currentlyCompleted }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: logsKey })

      // Snapshot previous state for rollback
      const previousLogs = queryClient.getQueryData<HabitLogRow[]>(logsKey)

      queryClient.setQueryData<HabitLogRow[]>(logsKey, (old: HabitLogRow[] | undefined) => {
        const prev = old ?? []
        if (currentlyCompleted) {
          // Remove the log
          return prev.filter((l) => !(l.habit_id === habitId && l.date === date))
        } else {
          // Add or update the log optimistically
          const exists = prev.find((l) => l.habit_id === habitId && l.date === date)
          if (exists) {
            return prev.map((l) =>
              l.habit_id === habitId && l.date === date ? { ...l, completed: true } : l,
            )
          }
          const optimisticLog: HabitLogRow = {
            id: `optimistic-${habitId}-${date}`,
            habit_id: habitId,
            user_id: MOCK_USER_ID,
            date,
            completed: true,
            created_at: new Date().toISOString(),
          }
          return [...prev, optimisticLog]
        }
      })

      return { previousLogs }
    },

    // ---- Rollback on error -----------------------------------
    onError: (_err, _vars, context) => {
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(logsKey, context.previousLogs)
      }
    },

    // ---- Always refetch after settle (only in real mode) ----
    onSettled: () => {
      if (!isMock) {
        queryClient.invalidateQueries({ queryKey: logsKey })
      }
    },
  })
}

// ---- Create Habit Mutation -----------------------------------

export interface CreateHabitArgs {
  name: string
  category: string
  color_hex: string
  icon_key: string
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: CreateHabitArgs): Promise<HabitRow> => {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 150))
        const newHabit: HabitRow = {
          id: `habit-${Date.now()}`,
          user_id: MOCK_USER_ID,
          name: args.name,
          category: args.category || 'General',
          color_hex: args.color_hex,
          icon_key: args.icon_key,
          position: MOCK_HABITS.length,
          is_archived: false,
          created_at: new Date().toISOString(),
        }
        MOCK_HABITS.push(newHabit)
        return newHabit
      }

      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const habits = queryClient.getQueryData<HabitRow[]>(habitKeys.active()) ?? []
      const nextPosition = habits.length

      const userId = (await supabase.auth.getUser()).data.user?.id ?? ''

      const { data, error } = await db
        .from('habits')
        .insert({
          user_id: userId,
          name: args.name,
          category: args.category || 'General',
          color_hex: args.color_hex,
          icon_key: args.icon_key,
          position: nextPosition,
          is_archived: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    onSuccess: (newHabit) => {
      queryClient.setQueryData<HabitRow[]>(habitKeys.active(), (old) => {
        const prev = old ?? []
        if (prev.some((h) => h.id === newHabit.id)) return prev
        return [...prev, newHabit]
      })
      if (!isMock) {
        queryClient.invalidateQueries({ queryKey: habitKeys.active() })
      }
    },
  })
}

// ---- Delete Habit Mutation -----------------------------------

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
      if (isMock) {
        await new Promise((r) => setTimeout(r, 100))
        const idx = MOCK_HABITS.findIndex((h) => h.id === habitId)
        if (idx !== -1) MOCK_HABITS.splice(idx, 1)
        return habitId
      }

      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const { error } = await db.from('habits').delete().eq('id', habitId)
      if (error) throw error
      return habitId
    },

    onSuccess: (deletedId) => {
      queryClient.setQueryData<HabitRow[]>(habitKeys.active(), (old) => {
        return (old ?? []).filter((h) => h.id !== deletedId)
      })
      if (!isMock) {
        queryClient.invalidateQueries({ queryKey: habitKeys.active() })
      }
    },
  })
}

