import type { HabitLogRow } from '@/types/database'

export interface HabitTargetInfo {
  cleanCategory: string
  targetDays: number | null
  isChallenge: boolean
}

/**
 * Extracts the clean category name and target days from a category string.
 * Example: "Salud [21d]" -> { cleanCategory: "Salud", targetDays: 21, isChallenge: true }
 * Example: "Bienestar" -> { cleanCategory: "Bienestar", targetDays: null, isChallenge: false }
 */
export function parseHabitCategory(category: string | null | undefined): HabitTargetInfo {
  if (!category) {
    return { cleanCategory: 'General', targetDays: null, isChallenge: false }
  }

  const match = category.match(/^(.*?)\s*\[(\d+)d\]$/i)
  if (match) {
    const cleanCategory = match[1].trim() || 'General'
    const targetDays = parseInt(match[2], 10)
    return {
      cleanCategory,
      targetDays: targetDays > 0 ? targetDays : null,
      isChallenge: targetDays > 0,
    }
  }

  return {
    cleanCategory: category.trim() || 'General',
    targetDays: null,
    isChallenge: false,
  }
}

/**
 * Formats a clean category and target days into a stored category string.
 * Example: ("Salud", 21) -> "Salud [21d]"
 * Example: ("Salud", null) -> "Salud"
 */
export function formatHabitCategory(cleanCategory: string, targetDays: number | null): string {
  const clean = cleanCategory.trim() || 'General'
  if (targetDays && targetDays > 0) {
    return `${clean} [${targetDays}d]`
  }
  return clean
}

export interface TargetProgress {
  completedDays: number
  targetDays: number
  percent: number
  isCompleted: boolean
  remainingDays: number
}

/**
 * Calculates completed days count and progress for a habit with a target.
 */
export function getHabitTargetProgress(
  logs: HabitLogRow[],
  habitId: string,
  targetDays: number,
): TargetProgress {
  const completedDays = logs.filter((l) => l.habit_id === habitId && l.completed).length
  const percent = targetDays > 0 ? Math.min(100, Math.round((completedDays / targetDays) * 100)) : 0
  const isCompleted = completedDays >= targetDays
  const remainingDays = Math.max(0, targetDays - completedDays)

  return {
    completedDays,
    targetDays,
    percent,
    isCompleted,
    remainingDays,
  }
}
