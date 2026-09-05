import type { Metadata } from 'next'
import { HabitDashboard } from '@/components/HabitDashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Tu centro de comando de hábitos mensual',
}

/**
 * Dashboard page — Server Component shell.
 * Renders the client-side HabitDashboard with initial date seeded from server.
 * Data fetching (habits + logs) happens client-side via TanStack Query.
 */
export default function DashboardPage() {
  const now = new Date()

  return (
    <HabitDashboard
      initialYear={now.getFullYear()}
      initialMonth={now.getMonth() + 1}
      // TODO: pass real userXP / userLevel from Supabase session
      userXP={340}
      userLevel={4}
      goals={[
        // TODO: fetch from Supabase server client
        {
          id: 'goal-1',
          user_id: 'mock',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          title: 'Completar 25 días de ejercicio',
          completed: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'goal-2',
          user_id: 'mock',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          title: 'Leer 2 libros',
          completed: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'goal-3',
          user_id: 'mock',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          title: 'Meditar todos los días',
          completed: false,
          created_at: new Date().toISOString(),
        },
      ]}
    />
  )
}
