// ============================================================
// HabitPixel — Consistency Calculations
// Pure, decoupled utility functions — no React, no side effects
// ============================================================

import type { HabitLogRow } from '@/types/database'
import type { WeekBreakdown } from '@/types/domain'
import {
  getDaysInMonth,
  getElapsedDaysInMonth,
  getWeeksOfMonth,
  getTodayString,
  toISODateString,
} from './date-utils'

// ---- Internal helpers ----------------------------------------

/**
 * Builds a Set of completed dates ('YYYY-MM-DD') for a specific habit.
 */
function getCompletedDatesSet(
  logs: HabitLogRow[],
  habitId: string,
): Set<string> {
  return new Set(
    logs
      .filter((l) => l.habit_id === habitId && l.completed)
      .map((l) => l.date),
  )
}

// ---- Public API ----------------------------------------------

/**
 * Calculates the consistency percentage for a single habit within a month.
 *
 * Formula: (days completed in month) / (elapsed days in month) * 100
 * Returns 0 if no days have elapsed yet (future month).
 */
export function getHabitConsistency(
  logs: HabitLogRow[],
  habitId: string,
  year: number,
  month: number,
): number {
  const elapsed = getElapsedDaysInMonth(year, month)
  if (elapsed === 0) return 0

  const completedSet = getCompletedDatesSet(logs, habitId)
  let completedCount = 0

  for (let day = 1; day <= elapsed; day++) {
    const dateStr = toISODateString(year, month, day)
    if (completedSet.has(dateStr)) completedCount++
  }

  return Math.round((completedCount / elapsed) * 100)
}

/**
 * Calculates today's overall completion percentage:
 * (habits completed today) / (total active habits) * 100
 *
 * @param logs     All log rows for the current user
 * @param habitIds Array of active (non-archived) habit IDs
 */
export function getDailyCompletion(
  logs: HabitLogRow[],
  habitIds: string[],
): number {
  if (habitIds.length === 0) return 0

  const today = getTodayString()
  const completedToday = logs.filter(
    (l) => l.date === today && l.completed && habitIds.includes(l.habit_id),
  ).length

  return Math.round((completedToday / habitIds.length) * 100)
}

/**
 * Returns the weekly breakdown for a specific habit in a given month.
 * Weeks follow the calendar grid (Sunday-first), up to 5 calendar weeks.
 */
export function getWeeklyBreakdown(
  logs: HabitLogRow[],
  habitId: string,
  year: number,
  month: number,
): WeekBreakdown[] {
  const completedSet = getCompletedDatesSet(logs, habitId)
  const calendarWeeks = getWeeksOfMonth(year, month)
  const today = getTodayString()

  return calendarWeeks.map((week, weekIdx) => {
    // Only real days of this month, not future days
    const monthDays = week.filter(
      (d): d is number =>
        d !== null &&
        toISODateString(year, month, d) <= today,
    )
    const completedDays = monthDays.filter((d) =>
      completedSet.has(toISODateString(year, month, d)),
    )

    return {
      weekIndex: weekIdx + 1,
      daysInMonth: monthDays.length,
      daysCompleted: completedDays.length,
      percent:
        monthDays.length > 0
          ? Math.round((completedDays.length / monthDays.length) * 100)
          : 0,
    }
  })
}

/**
 * Returns the overall weekly breakdown averaged across all active habits.
 */
export function getOverallWeeklyBreakdown(
  logs: HabitLogRow[],
  habitIds: string[],
  year: number,
  month: number,
): WeekBreakdown[] {
  if (habitIds.length === 0) return []

  const allBreakdowns = habitIds.map((id) =>
    getWeeklyBreakdown(logs, id, year, month),
  )

  // Zip-merge weeks by averaging
  const weekCount = allBreakdowns[0]?.length ?? 0
  return Array.from({ length: weekCount }, (_, weekIdx) => {
    const row = allBreakdowns.map((b) => b[weekIdx])
    const totalDays = row.reduce((s, w) => s + w.daysInMonth, 0)
    const totalCompleted = row.reduce((s, w) => s + w.daysCompleted, 0)
    return {
      weekIndex: weekIdx + 1,
      daysInMonth: totalDays,
      daysCompleted: totalCompleted,
      percent:
        totalDays > 0 ? Math.round((totalCompleted / totalDays) * 100) : 0,
    }
  })
}

/**
 * Calculates the average consistency across all active habits for a given month.
 */
export function getOverallConsistency(
  logs: HabitLogRow[],
  habitIds: string[],
  year: number,
  month: number,
): number {
  if (habitIds.length === 0) return 0

  const sum = habitIds.reduce(
    (acc, id) => acc + getHabitConsistency(logs, id, year, month),
    0,
  )
  return Math.round(sum / habitIds.length)
}

/**
 * Builds a LogMap (date string → boolean) for a specific habit.
 * Covers the entire given month.
 */
export function buildLogMap(
  logs: HabitLogRow[],
  habitId: string,
  year: number,
  month: number,
): Record<string, boolean> {
  const totalDays = getDaysInMonth(year, month)
  const map: Record<string, boolean> = {}

  for (let day = 1; day <= totalDays; day++) {
    map[toISODateString(year, month, day)] = false
  }

  logs
    .filter((l) => l.habit_id === habitId)
    .forEach((l) => {
      if (l.date in map) map[l.date] = l.completed
    })

  return map
}
