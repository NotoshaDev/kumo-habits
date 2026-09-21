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
      // Fetch profile and monthly goals in parallel for maximum speed
      const [profileRes, goalsRes] = await Promise.all([
        (supabase as any)
          .from('profiles')
          .select('level, xp')
          .eq('id', user.id)
          .single(),
        (supabase as any)
          .from('monthly_goals')
          .select('*')
          .eq('year', year)
          .eq('month', month),
      ])

      if (profileRes.data) {
        userLevel = profileRes.data.level ?? 1
        userXP = Number(profileRes.data.xp ?? 0)
      }

      if (goalsRes.data) {
        goals = goalsRes.data as MonthlyGoalRow[]
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
