// ============================================================
// HabitPixel — Gamification Engine
// XP rules, streaks, levels — pure functions
// ============================================================

import type { HabitLogRow } from '@/types/database'
import type { XPEvent } from '@/types/domain'
import { getTodayString, toISODateString } from './date-utils'

// ---- Constants -----------------------------------------------

export const XP_PER_HABIT = 15
export const XP_DAILY_BONUS = 50
export const DAILY_BONUS_THRESHOLD = 0.8 // 80%

const LEVEL_XP_BASE = 100   // XP needed for level 2
const LEVEL_XP_FACTOR = 1.5 // Each level costs 50% more than the previous

// ---- Level System -------------------------------------------

/**
 * Returns the total XP required to *reach* a given level (1-based).
 * Level 1 starts at 0 XP.
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let l = 2; l <= level; l++) {
    total += Math.floor(LEVEL_XP_BASE * Math.pow(LEVEL_XP_FACTOR, l - 2))
  }
  return total
}

/**
 * Derives the current level, XP needed for next level, and
 * normalized progress (0–1) within the current level.
 */
export function getLevelFromXP(totalXP: number): {
  level: number
  xpToNextLevel: number
  progress: number
} {
  let level = 1
  while (xpRequiredForLevel(level + 1) <= totalXP) {
    level++
  }

  const xpCurrentLevel = xpRequiredForLevel(level)
  const xpNextLevel = xpRequiredForLevel(level + 1)
  const xpIntoLevel = totalXP - xpCurrentLevel
  const xpNeeded = xpNextLevel - xpCurrentLevel

  return {
    level,
    xpToNextLevel: xpNextLevel - totalXP,
    progress: xpNeeded > 0 ? Math.min(1, xpIntoLevel / xpNeeded) : 1,
  }
}

// ---- XP Calculation -----------------------------------------

/**
 * Calculates XP to award and whether the daily bonus was triggered.
 *
 * @param completedHabits  Number of habits marked complete today
 * @param totalActiveHabits  Total non-archived habits
 */
export function calculateXPEvent(
  completedHabits: number,
  totalActiveHabits: number,
): XPEvent {
  const baseXP = completedHabits * XP_PER_HABIT
  const completionRatio =
    totalActiveHabits > 0 ? completedHabits / totalActiveHabits : 0
  const bonusAwarded = completionRatio > DAILY_BONUS_THRESHOLD

  return {
    habitId: '', // caller fills this in per-habit events
    xpAwarded: baseXP + (bonusAwarded ? XP_DAILY_BONUS : 0),
    bonusAwarded,
  }
}

/**
 * Calculates XP for a single habit completion toggle.
 * Returns positive XP when marking complete, negative when un-marking.
 */
export function calculateSingleHabitXP(
  isCompleting: boolean,
  completedCountToday: number,
  totalActiveHabits: number,
): number {
  if (isCompleting) {
    const newCompleted = completedCountToday + 1
    const wasAboveThreshold = completedCountToday / totalActiveHabits > DAILY_BONUS_THRESHOLD
    const nowAboveThreshold = newCompleted / totalActiveHabits > DAILY_BONUS_THRESHOLD
    return XP_PER_HABIT + (!wasAboveThreshold && nowAboveThreshold ? XP_DAILY_BONUS : 0)
  } else {
    // Reversing: subtract XP (possibly including bonus if threshold drops)
    const wasAboveThreshold = completedCountToday / totalActiveHabits > DAILY_BONUS_THRESHOLD
    const newCompleted = completedCountToday - 1
    const stillAboveThreshold = newCompleted / totalActiveHabits > DAILY_BONUS_THRESHOLD
    return -(XP_PER_HABIT + (wasAboveThreshold && !stillAboveThreshold ? XP_DAILY_BONUS : 0))
  }
}

// ---- Streak Calculations ------------------------------------

/**
 * Calculates the current consecutive-day streak for a given habit.
 * A streak is broken if the habit was not completed on any day
 * going back from today (or yesterday, to handle not-yet-logged today).
 */
export function getCurrentStreak(logs: HabitLogRow[], habitId: string): number {
  const today = getTodayString()
  const completedSet = new Set(
    logs
      .filter((l) => l.habit_id === habitId && l.completed)
      .map((l) => l.date),
  )

  // Start from today, allow missing today (streak keeps if yesterday done)
  let streak = 0
  const startDate = completedSet.has(today)
    ? new Date()
    : (() => {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        return d
      })()

  const cursor = new Date(startDate)

  while (true) {
    const dateStr = toISODateString(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      cursor.getDate(),
    )
    if (!completedSet.has(dateStr)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

/**
 * Finds the longest historical streak for a habit across all log history.
 */
export function getBestStreak(logs: HabitLogRow[], habitId: string): number {
  const dates = logs
    .filter((l) => l.habit_id === habitId && l.completed)
    .map((l) => l.date)
    .sort()

  if (dates.length === 0) return 0

  let best = 1
  let current = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffDays === 1) {
      current++
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }

  return best
}

/**
 * Returns the longest active streak across all habits for display
 * in the profile/gamification panel.
 */
export function getLongestActiveStreak(
  logs: HabitLogRow[],
  habitIds: string[],
): number {
  return Math.max(0, ...habitIds.map((id) => getCurrentStreak(logs, id)))
}
