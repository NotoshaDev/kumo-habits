'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RadialProgress } from '@/components/ui/RadialProgress'
import { WeeklyBreakdownChart } from '@/components/stats/WeeklyBreakdownChart'
import { HabitColorBadge } from '@/components/ui/HabitColorBadge'
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

function XPBar({ xp, level, habits, logs }: { xp: number; level: number; habits: HabitRow[]; logs: HabitLogRow[] }) {
  const { xpToNextLevel, progress } = getLevelFromXP(xp)

  return (
    <div className="bg-[#10121A] border border-[#1E2230] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#F59E0B]" style={{ filter: 'drop-shadow(0 0 4px #F59E0B88)' }} />
          <span className="font-mono text-xs text-[#94A3B8] uppercase tracking-widest">Nivel</span>
        </div>
        <div className="flex items-center gap-2">
          <AchievementsModal
            habits={habits}
            logs={logs}
            userXP={xp}
            trigger={
              <button
                className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] font-mono text-[10px] font-bold hover:bg-[#F59E0B]/20 transition-all"
                title="Ver Medallas"
              >
                <Trophy size={11} />
                <span>MEDALLAS</span>
              </button>
            }
          />
          <span className="font-mono text-lg font-bold text-[#F59E0B]" style={{ textShadow: '0 0 8px #F59E0B66' }}>
            {level}
          </span>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="h-2 bg-[#1E2230] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #F59E0B, #EC4899)',
            boxShadow: '0 0 8px #F59E0B88',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[10px] text-[#64748B]">{xp} XP</span>
        <span className="font-mono text-[10px] text-[#64748B]">{xpToNextLevel} para subir</span>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      className="flex items-center gap-3 bg-[#10121A] border rounded-xl p-3"
      style={{ borderColor: `${color}33` }}
    >
      <span
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon size={16} />
      </span>
      <div>
        <p className="font-mono text-[10px] text-[#64748B] uppercase tracking-wide">{label}</p>
        <p className="font-mono text-base font-bold" style={{ color, textShadow: `0 0 6px ${color}55` }}>
          {value}
        </p>
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
    <aside className="w-full flex flex-col gap-4">
      {/* XP / Level */}
      <XPBar xp={userXP} level={userLevel} habits={habits} logs={logs} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Flame}
          label="Racha"
          value={`${longestStreak}d`}
          color="#EC4899"
        />
        <StatCard
          icon={Trophy}
          label="Metas"
          value={`${completedGoals}/${goals.length}`}
          color="#F59E0B"
        />
      </div>

      {/* Radial progress meters */}
      <div className="bg-[#10121A] border border-[#1E2230] rounded-xl p-4">
        <p className="font-mono text-[10px] text-[#64748B] uppercase tracking-widest mb-4">
          Progreso
        </p>
        <div className="flex items-center justify-around">
          <div className="flex flex-col items-center gap-2">
            <RadialProgress value={todayPercent} color="#10B981" size={100} />
            <span className="font-mono text-[10px] text-[#64748B]">Hoy</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RadialProgress value={overallPercent} color="#06B6D4" size={100} />
            <span className="font-mono text-[10px] text-[#64748B]">Mes</span>
          </div>
        </div>
      </div>

      {/* Weekly breakdown */}
      <div className="bg-[#10121A] border border-[#1E2230] rounded-xl p-4">
        <p className="font-mono text-[10px] text-[#64748B] uppercase tracking-widest mb-3">
          Por Semana
        </p>
        <WeeklyBreakdownChart data={weeklyBreakdown} color="#06B6D4" />
      </div>

      {/* Per-habit consistency list */}
      <div className="bg-[#10121A] border border-[#1E2230] rounded-xl p-4">
        <p className="font-mono text-[10px] text-[#64748B] uppercase tracking-widest mb-3">
          Hábitos
        </p>
        <div className="space-y-2">
          {habits.map((habit) => {
            const pct = getHabitConsistency(logs, habit.id, year, month)
            const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']
            return (
              <div key={habit.id} className="flex items-center gap-2">
                <span style={{ color: habit.color_hex }} className="shrink-0">
                  <Icon size={12} />
                </span>
                <span className="text-xs text-[#94A3B8] truncate flex-1">{habit.name}</span>
                {/* Mini bar */}
                <div className="w-16 h-1.5 bg-[#1E2230] rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: habit.color_hex,
                      boxShadow: `0 0 4px ${habit.color_hex}88`,
                    }}
                  />
                </div>
                <span
                  className="font-mono text-[10px] w-8 text-right shrink-0"
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
        <div className="bg-[#10121A] border border-[#1E2230] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={12} className="text-[#F59E0B]" />
            <p className="font-mono text-[10px] text-[#64748B] uppercase tracking-widest">
              Objetivos del Mes
            </p>
          </div>
          <div className="space-y-2">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => onToggleGoal?.(goal.id, !goal.completed)}
                className="w-full flex items-center gap-2 text-left group"
              >
                {goal.completed ? (
                  <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                ) : (
                  <Circle size={14} className="text-[#1E2230] group-hover:text-[#2E3450] shrink-0 transition-colors" />
                )}
                <span
                  className={cn(
                    'text-xs leading-snug transition-colors',
                    goal.completed ? 'text-[#64748B] line-through' : 'text-[#94A3B8] group-hover:text-[#F1F5F9]',
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
