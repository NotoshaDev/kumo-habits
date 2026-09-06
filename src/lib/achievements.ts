import type { HabitRow, HabitLogRow } from '@/types/database'
import { getCurrentStreak } from '@/lib/gamification'
import { getTodayString } from '@/lib/date-utils'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string // Lucide icon name
  xpBonus: number
  colorHex: string
  unlocked: boolean
  progress: number // 0 to 100
}

export function evaluateAchievements(
  habits: HabitRow[],
  logs: HabitLogRow[],
  userXP: number = 0,
): Achievement[] {
  const today = getTodayString()

  // Total completed logs count
  const completedLogsCount = logs.filter((l) => l.completed).length

  // Longest streak across active habits
  const activeHabitIds = habits.map((h) => h.id)
  const maxStreak = activeHabitIds.length > 0
    ? Math.max(0, ...activeHabitIds.map((id) => getCurrentStreak(logs, id)))
    : 0

  // Today's completed habits count
  const completedTodayCount = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.date === today && l.completed),
  ).length

  const isPerfectToday = habits.length > 0 && completedTodayCount === habits.length

  return [
    {
      id: 'first_pixel',
      title: 'Primer Píxel',
      description: 'Completa tu primer hábito en HabitPixel.',
      icon: 'zap',
      xpBonus: 50,
      colorHex: '#10B981',
      unlocked: completedLogsCount >= 1,
      progress: Math.min(100, (completedLogsCount / 1) * 100),
    },
    {
      id: 'streak_3',
      title: 'Fuego Continuo',
      description: 'Muestra tu disciplina con 3 días seguidos de racha.',
      icon: 'flame',
      xpBonus: 100,
      colorHex: '#EC4899',
      unlocked: maxStreak >= 3,
      progress: Math.min(100, (maxStreak / 3) * 100),
    },
    {
      id: 'streak_7',
      title: 'Cadena Irrompible',
      description: 'Alcanza una racha legendaria de 7 días seguidos.',
      icon: 'flame',
      xpBonus: 250,
      colorHex: '#F59E0B',
      unlocked: maxStreak >= 7,
      progress: Math.min(100, (maxStreak / 7) * 100),
    },
    {
      id: 'master_5',
      title: 'Arquitecto de Hábitos',
      description: 'Crea 5 o más hábitos activos en tu centro de comando.',
      icon: 'target',
      xpBonus: 150,
      colorHex: '#06B6D4',
      unlocked: habits.length >= 5,
      progress: Math.min(100, (habits.length / 5) * 100),
    },
    {
      id: 'perfect_day',
      title: 'Día Perfecto',
      description: 'Completa el 100% de tus hábitos en un solo día.',
      icon: 'trophy',
      xpBonus: 200,
      colorHex: '#A78BFA',
      unlocked: isPerfectToday,
      progress: habits.length > 0 ? Math.min(100, (completedTodayCount / habits.length) * 100) : 0,
    },
    {
      id: 'level_5',
      title: 'Modo Leyenda',
      description: 'Acumula suficiente experiencia para alcanzar el Nivel 5.',
      icon: 'star',
      xpBonus: 300,
      colorHex: '#F43F5E',
      unlocked: userXP >= 400,
      progress: Math.min(100, (userXP / 400) * 100),
    },
  ]
}
