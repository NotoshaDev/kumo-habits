'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { HabitRow, HabitLogRow } from '@/types/database'
import { toISODateString } from '@/lib/date-utils'

// ---- Query Keys -----------------------------------------------

export const habitKeys = {
  all: ['habits'] as const,
  active: () => [...habitKeys.all, 'active'] as const,
  logs: (year: number, month: number) => ['habit_logs', year, month] as const,
}

// ---- Hooks: Fetch Active Habits ------------------------------

/**
 * Fetches active (non-archived) habits for the current user.
 */
export function useHabits() {
  return useQuery({
    queryKey: habitKeys.active(),
    queryFn: async (): Promise<HabitRow[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_archived', false)
        .order('position', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

// ---- Hooks: Fetch Month Logs ---------------------------------

/**
 * Fetches all habit logs for a given year/month.
 */
export function useHabitLogs(year: number, month: number) {
  const startDate = toISODateString(year, month, 1)
  const endDate = toISODateString(year, month, new Date(year, month, 0).getDate())

  return useQuery({
    queryKey: habitKeys.logs(year, month),
    queryFn: async (): Promise<HabitLogRow[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error
      return data ?? []
    },
  })
}

// ---- Toggle Mutation (Optimistic 0ms UI) ---------------------

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
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      if (!currentlyCompleted) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuario no autenticado')

        const { error } = await db.from('habit_logs').upsert(
          { habit_id: habitId, user_id: user.id, date, completed: true },
          { onConflict: 'habit_id,date' },
        )
        if (error) throw error
      } else {
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
      await queryClient.cancelQueries({ queryKey: logsKey })
      const previousLogs = queryClient.getQueryData<HabitLogRow[]>(logsKey)

      queryClient.setQueryData<HabitLogRow[]>(logsKey, (old: HabitLogRow[] | undefined) => {
        const prev = old ?? []
        if (currentlyCompleted) {
          return prev.filter((l) => !(l.habit_id === habitId && l.date === date))
        } else {
          const exists = prev.find((l) => l.habit_id === habitId && l.date === date)
          if (exists) {
            return prev.map((l) =>
              l.habit_id === habitId && l.date === date ? { ...l, completed: true } : l,
            )
          }
          const optimisticLog: HabitLogRow = {
            id: `optimistic-${habitId}-${date}`,
            habit_id: habitId,
            user_id: '',
            date,
            completed: true,
            created_at: new Date().toISOString(),
          }
          return [...prev, optimisticLog]
        }
      })

      return { previousLogs }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(logsKey, context.previousLogs)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: logsKey })
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
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const habits = queryClient.getQueryData<HabitRow[]>(habitKeys.active()) ?? []
      const nextPosition = habits.length

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data, error } = await db
        .from('habits')
        .insert({
          user_id: user.id,
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
      queryClient.invalidateQueries({ queryKey: habitKeys.active() })
    },
  })
}

// ---- Delete Habit Mutation -----------------------------------

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
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
      queryClient.invalidateQueries({ queryKey: habitKeys.active() })
    },
  })
}

// ---- Update Habit Mutation -----------------------------------

export interface UpdateHabitArgs {
  id: string
  name: string
  category: string
  color_hex: string
  icon_key: string
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: UpdateHabitArgs): Promise<HabitRow> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const { data, error } = await db
        .from('habits')
        .update({
          name: args.name,
          category: args.category || 'General',
          color_hex: args.color_hex,
          icon_key: args.icon_key,
        })
        .eq('id', args.id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    onSuccess: (updatedHabit) => {
      queryClient.setQueryData<HabitRow[]>(habitKeys.active(), (old) => {
        return (old ?? []).map((h) => (h.id === updatedHabit.id ? updatedHabit : h))
      })
      queryClient.invalidateQueries({ queryKey: habitKeys.active() })
    },
  })
}

// ---- Archive Habit Mutation -----------------------------------

export function useArchiveHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const { error } = await db.from('habits').update({ is_archived: true }).eq('id', habitId)
      if (error) throw error
      return habitId
    },

    onSuccess: (archivedId) => {
      queryClient.setQueryData<HabitRow[]>(habitKeys.active(), (old) => {
        return (old ?? []).filter((h) => h.id !== archivedId)
      })
      queryClient.invalidateQueries({ queryKey: habitKeys.active() })
    },
  })
}
