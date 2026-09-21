'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { HabitRow, HabitLogRow } from '@/types/database'
import { toISODateString } from '@/lib/date-utils'

// ---- Query Keys -----------------------------------------------

export const habitKeys = {
  all: ['habits'] as const,
  active: () => [...habitKeys.all, 'active'] as const,
  archived: () => [...habitKeys.all, 'archived'] as const,
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
 * Fetches habit logs for a given year/month, extending 45 days back
 * so cross-month streaks and challenge progress compute accurately.
 */
export function useHabitLogs(year: number, month: number) {
  const firstOfMonth = new Date(year, month - 1, 1)
  const streakWindowStart = new Date(firstOfMonth)
  streakWindowStart.setDate(streakWindowStart.getDate() - 45)
  const queryStartDate = toISODateString(
    streakWindowStart.getFullYear(),
    streakWindowStart.getMonth() + 1,
    streakWindowStart.getDate(),
  )
  const endDate = toISODateString(year, month, new Date(year, month, 0).getDate())

  return useQuery({
    queryKey: habitKeys.logs(year, month),
    queryFn: async (): Promise<HabitLogRow[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('date', queryStartDate)
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
      queryClient.invalidateQueries({ queryKey: habitKeys.archived() })
    },
  })
}

// ---- Archived Habits Query & Unarchive Mutation --------------

/**
 * Fetches habits that are currently archived.
 */
export function useArchivedHabits() {
  return useQuery({
    queryKey: habitKeys.archived(),
    queryFn: async (): Promise<HabitRow[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const { data, error } = await db
        .from('habits')
        .select('*')
        .eq('is_archived', true)
        .order('position', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Restores an archived habit back into the active routine.
 */
export function useUnarchiveHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habitId: string) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const { error } = await db.from('habits').update({ is_archived: false }).eq('id', habitId)
      if (error) throw error
      return habitId
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.active() })
      queryClient.invalidateQueries({ queryKey: habitKeys.archived() })
    },
  })
}

// ---- Reorder Habits Mutations --------------------------------

export interface ReorderHabitArgs {
  habitId: string
  direction: 'up' | 'down'
}

export function useReorderHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, direction }: ReorderHabitArgs) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const currentHabits = queryClient.getQueryData<HabitRow[]>(habitKeys.active()) ?? []
      const index = currentHabits.findIndex((h) => h.id === habitId)
      if (index === -1) return

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= currentHabits.length) return

      const habitA = currentHabits[index]
      const habitB = currentHabits[targetIndex]

      await Promise.all([
        db.from('habits').update({ position: habitB.position ?? targetIndex }).eq('id', habitA.id),
        db.from('habits').update({ position: habitA.position ?? index }).eq('id', habitB.id),
      ])
    },
    onMutate: async ({ habitId, direction }) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.active() })
      const previousHabits = queryClient.getQueryData<HabitRow[]>(habitKeys.active()) ?? []

      const index = previousHabits.findIndex((h) => h.id === habitId)
      if (index === -1) return { previousHabits }

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= previousHabits.length) return { previousHabits }

      const updated = [...previousHabits]
      const [moved] = updated.splice(index, 1)
      updated.splice(targetIndex, 0, moved)

      const reindexed = updated.map((h, i) => ({ ...h, position: i }))
      queryClient.setQueryData(habitKeys.active(), reindexed)

      return { previousHabits }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(habitKeys.active(), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.active() })
    },
  })
}

export function useBatchReorderHabits() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const updates = orderedIds.map((id, index) =>
        db.from('habits').update({ position: index }).eq('id', id),
      )
      await Promise.all(updates)
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: habitKeys.active() })
      const previousHabits = queryClient.getQueryData<HabitRow[]>(habitKeys.active()) ?? []
      const habitMap = new Map(previousHabits.map((h) => [h.id, h]))
      const reordered = orderedIds
        .map((id, index) => {
          const h = habitMap.get(id)
          return h ? { ...h, position: index } : null
        })
        .filter((h): h is HabitRow => h !== null)

      queryClient.setQueryData(habitKeys.active(), reordered)
      return { previousHabits }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(habitKeys.active(), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.active() })
    },
  })
}
