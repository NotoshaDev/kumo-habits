'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RadialProgress } from '@/components/ui/RadialProgress'
import { WeeklyBreakdownChart } from '@/components/stats/WeeklyBreakdownChart'
import { AchievementsModal } from '@/components/ui/AchievementsModal'
import type { HabitRow, HabitLogRow, MonthlyGoalRow } from '@/types/database'
import {
  getHabitConsistency,
  getDailyCompletion,
  getOverallWeeklyBreakdown,
  getOverallConsistency,
} from '@/lib/consistency'
import { getCurrentStreak, getLevelFromXP } from '@/lib/gamification'
import { ICON_MAP } from '@/lib/icon-map'
import { cn } from '@/lib/utils'
import { Zap, Flame, Trophy, Target, CheckCircle2, Circle } from 'lucide-react'

// ---- Types --------------------------------------------------

interface DesktopSidePanelProps {
  habits: HabitRow[]
  logs: HabitLogRow[]
  goals: MonthlyGoalRow[]
  year: number
  month: number
  userXP?: number
  userLevel?: number
  onToggleGoal?: (goalId: string, completed: boolean) => void
}

// ---- Sub-components -----------------------------------------

function XPBar({
  xp,
  level,
  habits,
  logs,
}: {
  xp: number
  level: number
  habits: HabitRow[]
  logs: HabitLogRow[]
}) {
  const { xpToNextLevel, progress } = getLevelFromXP(xp)

  return (
    <div className="bg-[#FFFFFF] border border-[#EAE2D8] rounded-2xl p-4 shadow-[0_4px_16px_rgba(78,64,53,0.04)] font-sans">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-[#EFA93A]" />
          <span className="font-mono text-xs font-bold text-[#6B605B] uppercase tracking-wider">
            Nivel
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AchievementsModal
            habits={habits}
            logs={logs}
            userXP={xp}
            trigger={
              <button
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-[#FFE08A] bg-[#FFF8E6] text-[#B87A00] font-mono text-[10px] font-bold hover:bg-[#FFF3D1] transition-all cursor-pointer shadow-sm"
                title="Ver Medallas"
              >
                <Trophy size={11} />
                <span>MEDALLAS</span>
              </button>
            }
          />
          <span className="font-mono text-lg font-bold text-[#EFA93A]">{level}</span>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="h-2.5 bg-[#F0EAE1] rounded-full overflow-hidden border border-[#EAE2D8]">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #EFA93A, #F2728C)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="font-mono text-[11px] text-[#6B605B] font-semibold">{xp} XP</span>
        <span className="font-mono text-[11px] text-[#9E928C]">{xpToNextLevel} para subir</span>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 bg-[#FFFFFF] border border-[#EAE2D8] rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(78,64,53,0.04)] font-sans">
      <span
        className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 shadow-sm"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon size={16} />
      </span>
      <div>
        <p className="font-mono text-[10px] text-[#9E928C] font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="font-mono text-base font-bold text-[#282321]">{value}</p>
      </div>
    </div>
  )
}

// ---- Main Component -----------------------------------------

export function DesktopSidePanel({
  habits,
  logs,
  goals,
  year,
  month,
  userXP = 0,
  userLevel = 1,
  onToggleGoal,
}: DesktopSidePanelProps) {
  const activeHabitIds = habits.map((h) => h.id)

  const todayPercent = useMemo(
    () => getDailyCompletion(logs, activeHabitIds),
    [logs, activeHabitIds],
  )

  const overallPercent = useMemo(
    () => getOverallConsistency(logs, activeHabitIds, year, month),
    [logs, activeHabitIds, year, month],
  )

  const weeklyBreakdown = useMemo(
    () => getOverallWeeklyBreakdown(logs, activeHabitIds, year, month),
    [logs, activeHabitIds, year, month],
  )

  const longestStreak = useMemo(
    () => Math.max(0, ...activeHabitIds.map((id) => getCurrentStreak(logs, id))),
    [logs, activeHabitIds],
  )

  const completedGoals = goals.filter((g) => g.completed).length

  return (
    <aside className="w-full flex flex-col gap-4 font-sans">
      {/* XP / Level */}
      <XPBar xp={userXP} level={userLevel} habits={habits} logs={logs} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          icon={Flame}
          label="Racha"
          value={`${longestStreak}d`}
          color="#F2728C"
        />
        <StatCard
          icon={Trophy}
          label="Metas"
          value={`${completedGoals}/${goals.length}`}
          color="#EFA93A"
        />
      </div>

      {/* Radial progress meters */}
      <div className="bg-[#FFFFFF] border border-[#EAE2D8] rounded-2xl p-4 shadow-[0_4px_16px_rgba(78,64,53,0.04)]">
        <p className="font-mono text-[10px] text-[#6B605B] font-bold uppercase tracking-wider mb-3">
          Progreso
        </p>
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center gap-1.5">
            <RadialProgress value={todayPercent} color="#F28574" size={96} strokeWidth={9} />
            <span className="font-mono text-[11px] font-bold text-[#6B605B]">Hoy</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RadialProgress value={overallPercent} color="#EFA93A" size={96} strokeWidth={9} />
            <span className="font-mono text-[11px] font-bold text-[#6B605B]">Mes</span>
          </div>
        </div>
      </div>

      {/* Weekly breakdown */}
      <div className="bg-[#FFFFFF] border border-[#EAE2D8] rounded-2xl p-4 shadow-[0_4px_16px_rgba(78,64,53,0.04)]">
        <p className="font-mono text-[10px] text-[#6B605B] font-bold uppercase tracking-wider mb-3">
          Por Semana
        </p>
        <WeeklyBreakdownChart data={weeklyBreakdown} color="#F28574" />
      </div>

      {/* Per-habit consistency list */}
      <div className="bg-[#FFFFFF] border border-[#EAE2D8] rounded-2xl p-4 shadow-[0_4px_16px_rgba(78,64,53,0.04)]">
        <p className="font-mono text-[10px] text-[#6B605B] font-bold uppercase tracking-wider mb-3">
          Hábitos
        </p>
        <div className="space-y-2.5">
          {habits.map((habit) => {
            const pct = getHabitConsistency(logs, habit.id, year, month)
            const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']
            return (
              <div key={habit.id} className="flex items-center gap-2">
                <span
                  style={{ color: habit.color_hex, backgroundColor: `${habit.color_hex}15` }}
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                >
                  <Icon size={11} />
                </span>
                <span className="text-xs font-medium text-[#282321] truncate flex-1">
                  {habit.name}
                </span>
                {/* Mini bar */}
                <div className="w-16 h-1.5 bg-[#F0EAE1] rounded-full overflow-hidden shrink-0 border border-[#EAE2D8]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: habit.color_hex,
                    }}
                  />
                </div>
                <span
                  className="font-mono text-[10px] font-bold w-8 text-right shrink-0"
                  style={{ color: habit.color_hex }}
                >
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly goals */}
      {goals.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#EAE2D8] rounded-2xl p-4 shadow-[0_4px_16px_rgba(78,64,53,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-[#EFA93A]" />
            <p className="font-mono text-[10px] text-[#6B605B] font-bold uppercase tracking-wider">
              Objetivos del Mes
            </p>
          </div>
          <div className="space-y-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => onToggleGoal?.(goal.id, !goal.completed)}
                className="w-full flex items-center gap-2 text-left group cursor-pointer"
              >
                {goal.completed ? (
                  <CheckCircle2 size={15} className="text-[#4EBA88] shrink-0" />
                ) : (
                  <Circle
                    size={15}
                    className="text-[#DFD5CA] group-hover:text-[#4EBA88] shrink-0 transition-colors"
                  />
                )}
                <span
                  className={cn(
                    'text-xs leading-snug transition-colors',
                    goal.completed
                      ? 'text-[#9E928C] line-through'
                      : 'text-[#282321] group-hover:text-[#4EBA88]',
                  )}
                >
                  {goal.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
