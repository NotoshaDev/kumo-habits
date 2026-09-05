'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PixelCheckbox } from '@/components/ui/PixelCheckbox'
import { DesktopMatrixGrid } from '@/components/desktop/DesktopMatrixGrid'
import { HabitColorBadge } from '@/components/ui/HabitColorBadge'
import { AddHabitModal } from '@/components/ui/AddHabitModal'
import type { HabitRow, HabitLogRow } from '@/types/database'
import {
  getMonthDays,
  getWeeksOfMonth,
  toISODateString,
  isToday,
  getTodayString,
  formatMonthLabel,
} from '@/lib/date-utils'
import { getHabitConsistency } from '@/lib/consistency'
import { ICON_MAP } from '@/lib/icon-map'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, LayoutGrid, Plus } from 'lucide-react'

// ---- Types --------------------------------------------------

interface MobileTrackerViewProps {
  habits: HabitRow[]
  logs: HabitLogRow[]
  year: number
  month: number
  onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void
}

// ---- Week Selector ------------------------------------------

interface WeekSelectorProps {
  weeks: (number | null)[][]
  selectedWeekIdx: number
  onSelect: (idx: number) => void
  year: number
  month: number
}

function WeekSelector({ weeks, selectedWeekIdx, onSelect, year, month }: WeekSelectorProps) {
  const today = getTodayString()

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      {weeks.map((week, wIdx) => {
        const validDays = week.filter((d): d is number => d !== null)
        const firstDay = validDays[0]
        const lastDay = validDays[validDays.length - 1]
        const hasToday = validDays.some((d) => isToday(toISODateString(year, month, d)))
        const isSelected = wIdx === selectedWeekIdx

        return (
          <button
            key={wIdx}
            onClick={() => onSelect(wIdx)}
            className={cn(
              'flex-none flex flex-col items-center px-4 py-2 rounded-lg border transition-all duration-200',
              isSelected
                ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                : 'border-[#1E2230] bg-[#10121A] text-[#64748B] hover:border-[#2E3450]',
            )}
          >
            <span className="font-mono text-xs font-bold">S{wIdx + 1}</span>
            <span className="font-mono text-[10px] opacity-70">
              {firstDay}–{lastDay}
            </span>
            {hasToday && (
              <span className="w-1 h-1 rounded-full bg-[#10B981] mt-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---- Habit Card (Mobile) ------------------------------------

interface HabitCardProps {
  habit: HabitRow
  weekDays: (number | null)[]
  logMap: Record<string, boolean>
  year: number
  month: number
  onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void
  consistency: number
}

function HabitCard({ habit, weekDays, logMap, year, month, onToggle, consistency }: HabitCardProps) {
  const today = getTodayString()
  const Icon = ICON_MAP[habit.icon_key] ?? ICON_MAP['star']
  const validDays = weekDays.filter((d): d is number => d !== null)

  return (
    <motion.div
      className="mx-4 mb-3 rounded-xl border bg-[#10121A] overflow-hidden"
      style={{ borderColor: `${habit.color_hex}33` }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${habit.color_hex}22` }}>
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: `${habit.color_hex}20`, color: habit.color_hex }}
          >
            <Icon size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9]">{habit.name}</p>
            {habit.category && (
              <HabitColorBadge color={habit.color_hex} label={habit.category} />
            )}
          </div>
        </div>
        <span className="font-mono text-sm font-bold" style={{ color: habit.color_hex }}>
          {consistency}%
        </span>
      </div>

      {/* Week day checkboxes */}
      <div className="flex items-center justify-around px-4 py-3">
        {validDays.map((day) => {
          const dateStr = toISODateString(year, month, day)
          const completed = logMap[`${habit.id}__${dateStr}`] ?? false
          const isFuture = dateStr > today
          const isCurrent = isToday(dateStr)

          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'font-mono text-[10px]',
                  isCurrent ? 'text-[#10B981] font-bold' : 'text-[#64748B]',
                  isFuture && 'opacity-30',
                )}
              >
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(`${dateStr}T00:00:00`).getDay()]}
                <br />
                {day}
              </span>
              <PixelCheckbox
                checked={completed}
                onChange={() => !isFuture && onToggle(habit.id, dateStr, completed)}
                color={habit.color_hex}
                disabled={isFuture}
                size="md"
                aria-label={`${habit.name} ${dateStr}`}
              />
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ---- Main Component -----------------------------------------

export function MobileTrackerView({
  habits,
  logs,
  year,
  month,
  onToggle,
}: MobileTrackerViewProps) {
  const today = getTodayString()
  const weeks = useMemo(() => getWeeksOfMonth(year, month), [year, month])

  // Find the week containing today, fallback to 0
  const todayWeekIdx = useMemo(() => {
    const todayDay = new Date().getDate()
    return weeks.findIndex((w) => w.includes(todayDay)) || 0
  }, [weeks])

  const [tab, setTab] = useState<'week' | 'matrix'>('week')
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(todayWeekIdx >= 0 ? todayWeekIdx : 0)

  // Build log map
  const logMap = useMemo(() => {
    const m: Record<string, boolean> = {}
    logs.forEach((l) => { m[`${l.habit_id}__${l.date}`] = l.completed })
    return m
  }, [logs])

  // Pre-compute consistency per habit
  const consistencyMap = useMemo(() => {
    const m: Record<string, number> = {}
    habits.forEach((h) => { m[h.id] = getHabitConsistency(logs, h.id, year, month) })
    return m
  }, [habits, logs, year, month])

  const activeWeek = weeks[selectedWeekIdx] ?? []

  // Today's completion
  const completedToday = habits.filter(
    (h) => logMap[`${h.id}__${today}`],
  ).length

  return (
    <div className="flex flex-col h-full bg-[#08090C]">
      {/* Top bar — month + stats */}
      <div className="px-4 pt-4 pb-2 border-b border-[#1E2230]">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm text-[#94A3B8] uppercase tracking-widest">
            {formatMonthLabel(year, month)}
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-[#64748B]">Hoy:</span>
            <span className="font-mono text-sm font-bold text-[#10B981]">
              {completedToday}/{habits.length}
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mt-3">
          <button
            onClick={() => setTab('week')}
            className={cn(
              'flex-1 py-1.5 font-mono text-xs rounded-md border transition-all',
              tab === 'week'
                ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                : 'bg-transparent border-[#1E2230] text-[#64748B]',
            )}
          >
            Semana
          </button>
          <button
            onClick={() => setTab('matrix')}
            className={cn(
              'flex-1 py-1.5 font-mono text-xs rounded-md border transition-all flex items-center justify-center gap-1.5',
              tab === 'matrix'
                ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                : 'bg-transparent border-[#1E2230] text-[#64748B]',
            )}
          >
            <LayoutGrid size={12} />
            Matriz
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'week' ? (
          <motion.div
            key="week"
            className="flex-1 flex flex-col overflow-y-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Week selector */}
            <WeekSelector
              weeks={weeks}
              selectedWeekIdx={selectedWeekIdx}
              onSelect={setSelectedWeekIdx}
              year={year}
              month={month}
            />

            {/* Habit cards */}
            <div className="flex-1 overflow-y-auto pb-6">
              {habits.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-[#64748B] font-mono text-sm mb-4">
                    No hay hábitos activos en tu rutina.
                  </p>
                  <AddHabitModal
                    trigger={
                      <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] text-black font-mono text-xs font-bold shadow-lg shadow-emerald-500/20">
                        <Plus size={16} className="stroke-[3]" />
                        <span>CREAR PRIMER HÁBITO</span>
                      </button>
                    }
                  />
                </div>
              ) : (
                <>
                  {habits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      weekDays={activeWeek}
                      logMap={logMap}
                      year={year}
                      month={month}
                      onToggle={onToggle}
                      consistency={consistencyMap[habit.id] ?? 0}
                    />
                  ))}

                  <div className="mx-4 mt-2">
                    <AddHabitModal
                      trigger={
                        <button className="w-full py-3.5 px-4 rounded-xl border border-dashed border-[#1E2230] hover:border-[#10B981]/50 bg-[#10121A]/50 hover:bg-[#10121A] text-[#10B981] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all">
                          <Plus size={16} className="stroke-[3]" />
                          <span>AGREGAR NUEVO HÁBITO</span>
                        </button>
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="matrix"
            className="flex-1 overflow-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 pt-3">
              <DesktopMatrixGrid
                habits={habits}
                logs={logs}
                year={year}
                month={month}
                onToggle={onToggle}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
