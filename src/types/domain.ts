// ============================================================
// HabitPixel — Domain Models
// Rich business objects built on top of DB rows
// ============================================================

import type { HabitRow, HabitLogRow, MonthlyGoalRow, ProfileRow } from './database'

// ---- User / Profile -----------------------------------------

export interface UserProfile extends ProfileRow {
  /** Derived: label for display */
  displayLabel: string
}

// ---- Habits -------------------------------------------------

export interface Habit extends HabitRow {
  /** Logs for the currently viewed month, injected by query layer */
  logs?: HabitLog[]
}

// ---- Habit Logs ---------------------------------------------

export interface HabitLog extends HabitLogRow {}

/** Key: 'YYYY-MM-DD' → value: whether completed */
export type LogMap = Record<string, boolean>

// ---- Composite: Habit + logs for a given month --------------

export interface HabitWithLogs {
  habit: Habit
  /** Sparse map of day → completed status for the month */
  logMap: LogMap
  /** Computed consistency % for the current month view */
  consistencyPercent: number
  /** Current streak (consecutive days ending today or yesterday) */
  currentStreak: number
  /** Best streak ever recorded for this habit */
  bestStreak: number
}

// ---- Weekly Breakdown ---------------------------------------

export interface WeekBreakdown {
  /** 1-based week index within the month calendar (1–5) */
  weekIndex: number
  /** Days in this calendar week that belong to the selected month */
  daysInMonth: number
  /** How many of those days were completed */
  daysCompleted: number
  /** Completion percentage for this week */
  percent: number
}

// ---- Monthly Stats ------------------------------------------

export interface MonthlyStats {
  year: number
  month: number
  /** Overall day % today: completed habits / total active habits */
  todayCompletionPercent: number
  /** Average consistency across all active habits for the month */
  overallConsistencyPercent: number
  /** Breakdown per calendar week (1–5) across ALL habits */
  weeklyBreakdown: WeekBreakdown[]
  /** Per-habit detail */
  habitStats: HabitWithLogs[]
  /** Monthly goals list */
  goals: MonthlyGoal[]
}

// ---- Monthly Goals ------------------------------------------

export interface MonthlyGoal extends MonthlyGoalRow {}

// ---- Gamification -------------------------------------------

export interface GamificationState {
  level: number
  xp: number
  /** XP needed to reach next level */
  xpToNextLevel: number
  /** 0–1 fraction for progress bar */
  levelProgress: number
  /** Current consecutive days streak (any habit) */
  longestActiveStreak: number
}

// ---- XP Event -----------------------------------------------

export interface XPEvent {
  habitId: string
  xpAwarded: number
  /** true when daily >80% bonus was awarded */
  bonusAwarded: boolean
}

// ---- View state (UI) ----------------------------------------

export interface CalendarMonth {
  year: number
  /** 1-based */
  month: number
  /** Days in month, 1-indexed array of day numbers */
  days: number[]
}

export type ViewMode = 'desktop' | 'mobile'
export type MobileTab = 'week' | 'matrix'

export interface UIState {
  viewMode: ViewMode
  mobileTab: MobileTab
  selectedMonth: CalendarMonth
  /** Mobile: index of the currently selected week (0-based) */
  selectedWeekIndex: number
}
