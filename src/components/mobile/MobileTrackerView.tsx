'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PixelCheckbox } from '@/components/ui/PixelCheckbox'
import { DesktopMatrixGrid } from '@/components/desktop/DesktopMatrixGrid'
import { HabitColorBadge } from '@/components/ui/HabitColorBadge'
import { AddHabitModal } from '@/components/ui/AddHabitModal'
import { EditHabitModal } from '@/components/ui/EditHabitModal'
import { InstallAppBanner } from '@/components/ui/InstallAppModal'
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
import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Pencil } from 'lucide-react'

// ---- Types --------------------------------------------------

interface MobileTrackerViewProps {
  habits: HabitRow[]
  logs: HabitLogRow[]
  year: number
  month: number
  onPrevMonth?: () => void
  onNextMonth?: () => void
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
              'flex-none flex flex-col items-center px-4 py-2 rounded-2xl border transition-all duration-200 cursor-pointer',
              isSelected
                ? 'border-[#F28574] bg-[#FDF2ED] text-[#C95D47] shadow-xs font-bold'
                : 'border-[#EAE2D8] bg-[#FFFFFF] text-[#7A6A60] hover:bg-[#FAF7F2]',
            )}
          >
            <span className="font-mono text-xs font-bold">S{wIdx + 1}</span>
            <span className="font-mono text-[10px] opacity-75 mt-0.5">
              {firstDay}–{lastDay}
            </span>
            {hasToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#F28574] mt-1 animate-pulse" />
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
      className="mx-4 mb-3.5 rounded-2xl border border-[#EAE2D8] bg-[#FFFFFF] shadow-[0_4px_16px_rgba(78,64,53,0.05)] overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAE2D8] bg-[#FFFDF9]">
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-[#EAE2D8] shadow-xs"
            style={{ backgroundColor: `${habit.color_hex}15`, color: habit.color_hex }}
          >
            <Icon size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#3D2E26]">{habit.name}</p>
            {habit.category && (
              <HabitColorBadge color={habit.color_hex} label={habit.category} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EAE2D8]" style={{ color: habit.color_hex }}>
            {consistency}%
          </span>

          <EditHabitModal
            habit={habit}
            trigger={
              <button
                className="p-1.5 rounded-xl hover:bg-[#FAF7F2] text-[#9E928C] hover:text-[#3D2E26] transition-colors cursor-pointer"
                title="Editar Hábito"
              >
                <Pencil size={14} />
              </button>
            }
          />
        </div>
      </div>

      {/* Week day checkboxes */}
      <div className="flex items-center justify-around px-3 py-3 bg-[#FFFFFF]">
        {validDays.map((day) => {
          const dateStr = toISODateString(year, month, day)
          const completed = logMap[`${habit.id}__${dateStr}`] ?? false
          const isFuture = dateStr > today
          const isCurrent = isToday(dateStr)

          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'font-mono text-[10px] text-center leading-tight',
                  isCurrent ? 'text-[#C95D47] font-bold' : 'text-[#7A6A60]',
                  isFuture && 'opacity-40',
                )}
              >
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'][new Date(`${dateStr}T00:00:00`).getDay()]}
                <br />
                <span className={cn('text-[11px]', isCurrent && 'font-bold underline decoration-[#F28574]')}>
                  {day}
                </span>
              </span>
              <PixelCheckbox
                checked={completed}
                onChange={() => !isFuture && onToggle(habit.id, dateStr, completed)}
                color={habit.color_hex}
                disabled={isFuture}
                size="sm"
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
  onPrevMonth,
  onNextMonth,
  onToggle,
}: MobileTrackerViewProps) {
  const today = getTodayString()
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
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
    <div className="flex flex-col h-full bg-[#FAF7F2] text-[#3D2E26]">
      {/* Top bar — month navigator + stats */}
      <div className="px-4 pt-3 pb-2.5 border-b border-[#EAE2D8] bg-[#FFFFFF]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onPrevMonth && (
              <button
                onClick={onPrevMonth}
                className="flex items-center justify-center w-7 h-7 rounded-xl border border-[#EAE2D8] bg-[#FAF7F2] text-[#7A6A60] hover:text-[#3D2E26] hover:bg-[#F2ECE4] active:scale-95 transition-all cursor-pointer"
                aria-label="Mes anterior"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <h2 className="font-mono text-xs font-bold text-[#3D2E26] uppercase tracking-wider">
              {formatMonthLabel(year, month)}
            </h2>
            {onNextMonth && (
              <button
                onClick={onNextMonth}
                disabled={isCurrentMonth}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-xl border transition-all',
                  isCurrentMonth
                    ? 'border-[#EAE2D8]/50 text-[#C4B7AC] bg-[#FAF7F2]/50 cursor-not-allowed'
                    : 'border-[#EAE2D8] bg-[#FAF7F2] text-[#7A6A60] hover:text-[#3D2E26] hover:bg-[#F2ECE4] active:scale-95 cursor-pointer',
                )}
                aria-label="Mes siguiente"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#8C7A70] font-medium">HOY:</span>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FDF2ED] border border-[#F2C4AF] text-[#C95D47] shadow-xs">
              {completedToday}/{habits.length}
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 mt-2.5 bg-[#F2ECE4] rounded-xl border border-[#EAE2D8]">
          <button
            onClick={() => setTab('week')}
            className={cn(
              'flex-1 py-1.5 font-mono text-xs rounded-lg font-bold transition-all cursor-pointer',
              tab === 'week'
                ? 'bg-[#FFFFFF] text-[#3D2E26] shadow-xs border border-[#EAE2D8]'
                : 'text-[#8C7A70] hover:text-[#3D2E26] border border-transparent',
            )}
          >
            Semana
          </button>
          <button
            onClick={() => setTab('matrix')}
            className={cn(
              'flex-1 py-1.5 font-mono text-xs rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
              tab === 'matrix'
                ? 'bg-[#FFFFFF] text-[#3D2E26] shadow-xs border border-[#EAE2D8]'
                : 'text-[#8C7A70] hover:text-[#3D2E26] border border-transparent',
            )}
          >
            <LayoutGrid size={13} />
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
            <div className="flex-1 overflow-y-auto pb-28 sm:pb-12">
              {/* Install PWA Guide Banner */}
              <InstallAppBanner />

              {habits.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-[#8C7A70] font-mono text-sm mb-4">
                    No hay hábitos activos en tu rutina.
                  </p>
                  <AddHabitModal
                    trigger={
                      <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F28574] to-[#E07261] text-white font-mono text-xs font-bold shadow-md shadow-[#F28574]/20 hover:brightness-105 active:scale-95 cursor-pointer">
                        <Plus size={16} className="stroke-[2.5]" />
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

                  <div className="mx-4 mt-2 mb-6">
                    <AddHabitModal
                      trigger={
                        <button className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#DFD5CA] hover:border-[#F28574] bg-[#FFFFFF] hover:bg-[#FDF2ED] text-[#C95D47] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.99]">
                          <Plus size={16} className="stroke-[2.5]" />
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
            <div className="p-2 pt-3 pb-8">
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
