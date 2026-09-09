import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { HabitDashboard } from '@/components/HabitDashboard'
import type { MonthlyGoalRow } from '@/types/database'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Tu centro de comando de hábitos mensual',
}

export const dynamic = 'force-dynamic'

/**
 * Dashboard page — Server Component shell.
 * Renders the client-side HabitDashboard with initial date seeded from server.
 * Data fetching (habits + logs) happens client-side via TanStack Query.
 */
export default async function DashboardPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  let userXP = 0
  let userLevel = 1
  let goals: MonthlyGoalRow[] = []

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Fetch profile for XP and level
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('level, xp')
        .eq('id', user.id)
        .single()

      if (profile) {
        userLevel = profile.level ?? 1
        userXP = Number(profile.xp ?? 0)
      }

      // Fetch monthly goals
      const { data: userGoals } = await (supabase as any)
        .from('monthly_goals')
        .select('*')
        .eq('year', year)
        .eq('month', month)

      if (userGoals) {
        goals = userGoals as MonthlyGoalRow[]
      }
    }
  } catch (err) {
    console.error('Error loading dashboard session:', err)
  }

  return (
    <HabitDashboard
      initialYear={year}
      initialMonth={month}
      userXP={userXP}
      userLevel={userLevel}
      goals={goals}
    />
  )
}
