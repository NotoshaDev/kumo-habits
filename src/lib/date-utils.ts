// ============================================================
// HabitPixel — Date Utilities
// Pure, timezone-aware helpers using native Date (no deps)
// ============================================================

/**
 * Returns the number of days in a given month (1-based).
 * Handles leap years automatically.
 */
export function getDaysInMonth(year: number, month: number): number {
  // Using day 0 of next month = last day of current month
  return new Date(year, month, 0).getDate()
}

/**
 * Returns an array of day numbers [1, 2, ... N] for a given month.
 */
export function getMonthDays(year: number, month: number): number[] {
  const total = getDaysInMonth(year, month)
  return Array.from({ length: total }, (_, i) => i + 1)
}

/**
 * Returns a 'YYYY-MM-DD' string for a given year, month (1-based), day.
 */
export function toISODateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/**
 * Parses a 'YYYY-MM-DD' string into { year, month, day } parts.
 */
export function parseISODate(isoDate: string): { year: number; month: number; day: number } {
  const [y, m, d] = isoDate.split('-').map(Number)
  return { year: y, month: m, day: d }
}

/**
 * Returns today's date string 'YYYY-MM-DD' in the local timezone.
 */
export function getTodayString(): string {
  const now = new Date()
  return toISODateString(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/**
 * Checks whether an ISO date string represents today's local date.
 */
export function isToday(isoDate: string): boolean {
  return isoDate === getTodayString()
}

/**
 * Returns the day of the week (0 = Sunday, 6 = Saturday) for the first day
 * of a given month.
 */
export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

/**
 * Splits a month into calendar weeks (rows of 7, padded with null for days
 * outside the month).
 *
 * Returns an array of up to 6 weeks; each week is an array of 7 day numbers
 * or null for empty cells.
 *
 * e.g. getWeeksOfMonth(2026, 9) with Sep 1 = Tuesday (2):
 * [[null, null, 1, 2, 3, 4, 5], [6, 7, ..., 12], ...]
 */
export function getWeeksOfMonth(year: number, month: number): (number | null)[][] {
  const totalDays = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month) // 0=Sun

  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = Array(firstDow).fill(null)

  for (let day = 1; day <= totalDays; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Pad last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }

  return weeks
}

/**
 * Returns which 1-based calendar week index (1–5) a given day belongs to
 * within its month.
 */
export function getWeekIndexOfDay(year: number, month: number, day: number): number {
  const weeks = getWeeksOfMonth(year, month)
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].includes(day)) return i + 1
  }
  return 1
}

/**
 * Returns the number of days that have elapsed in a given month up to and
 * including today (or the last day if the month is already past).
 */
export function getElapsedDaysInMonth(year: number, month: number): number {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Month already passed — all days elapsed
    return getDaysInMonth(year, month)
  }
  if (year === currentYear && month === currentMonth) {
    return currentDay
  }
  // Future month — 0 days elapsed
  return 0
}

/**
 * Returns a formatted month label, e.g. "September 2026".
 */
export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Returns the previous month as { year, month }.
 */
export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

/**
 * Returns the next month as { year, month }.
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}
