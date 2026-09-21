'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Volume2, VolumeX, Trophy, Sparkles, CalendarDays } from 'lucide-react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useHabits, useHabitLogs, useToggleHabitLog } from '@/hooks/useHabits'
import { DesktopMatrixGrid } from '@/components/desktop/DesktopMatrixGrid'
import { DesktopSidePanel } from '@/components/desktop/DesktopSidePanel'
import { AestheticWeeklyMatrix } from '@/components/desktop/AestheticWeeklyMatrix'
import { AestheticDailyColumns } from '@/components/desktop/AestheticDailyColumns'
import { MobileTrackerView } from '@/components/mobile/MobileTrackerView'
import { AddHabitModal } from '@/components/ui/AddHabitModal'
import { AchievementsModal } from '@/components/ui/AchievementsModal'
import { UserProfileMenu } from '@/components/ui/UserProfileMenu'
import { retroAudio } from '@/lib/sound-effects'
import { formatMonthLabel, getPrevMonth, getNextMonth } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { MonthlyGoalRow, HabitRow, HabitLogRow } from '@/types/database'

// ---- Types --------------------------------------------------

interface HabitDashboardProps {
  /** Injected from Server Component or mock */
  initialYear?: number
  initialMonth?: number
  userXP?: number
  userLevel?: number
  goals?: MonthlyGoalRow[]
}

// ---- Month Navigator ----------------------------------------

function MonthNavigator({
  year,
  month,
  onPrev,
  onNext,
}: {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}) {
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        className="flex items-center justify-center w-7 h-7 rounded-md border border-[#1E2230] text-[#64748B] hover:text-[#F1F5F9] hover:border-[#2E3450] transition-all duration-150"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={14} />
      </button>

      <span className="font-mono text-sm font-medium text-[#F1F5F9] min-w-[160px] text-center">
        {formatMonthLabel(year, month)}
      </span>

      <button
        onClick={onNext}
        disabled={isCurrentMonth}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-md border transition-all duration-150',
          isCurrentMonth
            ? 'border-[#1E2230] text-[#1E2230] cursor-not-allowed'
            : 'border-[#1E2230] text-[#64748B] hover:text-[#F1F5F9] hover:border-[#2E3450]',
        )}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ---- Desktop Header -----------------------------------------

function DesktopHeader({
  year,
  month,
  onPrev,
  onNext,
  isMuted,
  onToggleSound,
  habits,
  logs,
  userXP,
  userLevel,
}: {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  isMuted: boolean
  onToggleSound: () => void
  habits: HabitRow[]
  logs: HabitLogRow[]
  userXP: number
  userLevel: number
}) {
  return (
    <header className="grid grid-cols-3 items-center px-6 py-3 border-b border-[#1E2230] bg-[#10121A]/50 backdrop-blur-md shrink-0 relative z-[5000]">
      {/* Brand (Left) */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981]/20 to-[#38BDF8]/10 border border-[#10B981]/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M6.5 19C4 19 2 17 2 14.5C2 12.3 3.6 10.5 5.7 10.1C5.3 9.4 5 8.5 5 7.5C5 4.5 7.5 2 10.5 2C13 2 15.1 3.6 15.8 5.9C16.2 5.6 16.8 5.5 17.5 5.5C19.4 5.5 21 7.1 21 9C21 9.3 20.9 9.6 20.8 9.9C22.1 10.5 23 11.8 23 13.5C23 15.9 21 18 18.5 18L6.5 19Z"
              fill="url(#dash-cloud-grad)"
              opacity="0.95"
            />
            <defs>
              <linearGradient id="dash-cloud-grad" x1="2" y1="2" x2="23" y2="19" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <h1 className="font-mono text-sm font-bold leading-none tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#38BDF8]">Kumo</span>
            <span className="text-[#F1F5F9]"> Habits</span>
          </h1>
          <p className="font-mono text-[9px] text-[#64748B] leading-none mt-0.5 tracking-[0.15em] uppercase">
            by NotoshaDev
          </p>
        </div>
      </div>

      {/* Month Navigator (Center) */}
      <div className="flex justify-center">
        <MonthNavigator year={year} month={month} onPrev={onPrev} onNext={onNext} />
      </div>

      {/* Actions (Right) */}
      <div className="flex items-center justify-end gap-2.5">
        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleSound}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150',
            isMuted
              ? 'border-[#1E2230] text-[#64748B] hover:text-[#F1F5F9] bg-[#08090C]'
              : 'border-[#10B981]/40 text-[#10B981] bg-[#10B981]/10',
          )}
          title={isMuted ? 'Activar Sonido Retro 8-bit' : 'Silenciar Audio'}
          aria-label="Toggle audio"
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        {/* Achievements Modal Trigger */}
        <AchievementsModal
          habits={habits}
          logs={logs}
          userXP={userXP}
          trigger={
            <button
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-all duration-150"
              title="Ver Logros y Trofeos"
              aria-label="Trofeos"
            >
              <Trophy size={15} />
            </button>
          }
        />

        <AddHabitModal
          trigger={
            <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black font-mono text-xs font-bold transition-all duration-150 shadow-md shadow-emerald-500/20 active:scale-95">
              <Plus size={14} className="stroke-[3]" />
              <span>NUEVO HÁBITO</span>
            </button>
          }
        />

        {/* User Profile Menu */}
        <UserProfileMenu level={userLevel} xp={userXP} />
      </div>
    </header>
  )
}

// ---- Mobile Header ------------------------------------------

function MobileHeader({
  isMuted,
  onToggleSound,
  habits,
  logs,
  userXP,
  userLevel,
}: {
  isMuted: boolean
  onToggleSound: () => void
  habits: HabitRow[]
  logs: HabitLogRow[]
  userXP: number
  userLevel: number
}) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E2230] bg-[#10121A]/90 backdrop-blur-md relative z-[5000]">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#10B981]/20 to-[#38BDF8]/10 border border-[#10B981]/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M6.5 19C4 19 2 17 2 14.5C2 12.3 3.6 10.5 5.7 10.1C5.3 9.4 5 8.5 5 7.5C5 4.5 7.5 2 10.5 2C13 2 15.1 3.6 15.8 5.9C16.2 5.6 16.8 5.5 17.5 5.5C19.4 5.5 21 7.1 21 9C21 9.3 20.9 9.6 20.8 9.9C22.1 10.5 23 11.8 23 13.5C23 15.9 21 18 18.5 18L6.5 19Z"
              fill="url(#mob-cloud-grad)"
              opacity="0.95"
            />
            <defs>
              <linearGradient id="mob-cloud-grad" x1="2" y1="2" x2="23" y2="19" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="leading-tight">
          <h1 className="font-mono text-sm font-bold leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#38BDF8]">Kumo</span>
            <span className="text-[#F1F5F9]"> Habits</span>
          </h1>
          <p className="font-mono text-[8px] text-[#64748B] tracking-wider uppercase leading-none mt-0.5">by NotoshaDev</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSound}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg border transition-colors',
            isMuted
              ? 'border-[#1E2230] text-[#64748B]'
              : 'border-[#10B981]/40 text-[#10B981] bg-[#10B981]/10',
          )}
          aria-label="Toggle audio"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        <AchievementsModal
          habits={habits}
          logs={logs}
          userXP={userXP}
          trigger={
            <button
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]"
              aria-label="Trofeos"
            >
              <Trophy size={14} />
            </button>
          }
        />

        <AddHabitModal
          trigger={
            <button
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#10B981] text-black hover:bg-[#059669] transition-all duration-150 active:scale-95 shadow-sm shadow-emerald-500/20"
              aria-label="Agregar Hábito"
            >
              <Plus size={15} className="stroke-[3]" />
            </button>
          }
        />

        <UserProfileMenu level={userLevel} xp={userXP} />
      </div>
    </header>
  )
}

// ---- Loading Skeleton ----------------------------------------

function LoadingSkeleton() {
  return (
    <div className="flex-1 flex flex-col p-6 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="w-44 h-8 bg-[#1E2230] rounded-md" />
          {[...Array(20)].map((_, j) => (
            <div key={j} className="w-8 h-8 bg-[#1E2230] rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ---- Main Component -----------------------------------------

export function HabitDashboard({
  initialYear,
  initialMonth,
  userXP = 0,
  userLevel = 1,
  goals = [],
}: HabitDashboardProps) {
  const now = new Date()
  const [year, setYear] = useState(initialYear ?? now.getFullYear())
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1)
  const [isMuted, setIsMuted] = useState(() => retroAudio.isMuted())
  const [activeView, setActiveView] = useState<'aesthetic' | 'monthly'>('aesthetic')

  const isMobile = useIsMobile()

  // Data fetching
  const { data: habits = [], isLoading: habitsLoading } = useHabits()
  const { data: logs = [], isLoading: logsLoading } = useHabitLogs(year, month)
  const toggleMutation = useToggleHabitLog(year, month)

  const isLoading = habitsLoading || logsLoading

  const handleToggleSound = useCallback(() => {
    const muted = retroAudio.toggleMute()
    setIsMuted(muted)
  }, [])

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    const prev = getPrevMonth(year, month)
    setYear(prev.year)
    setMonth(prev.month)
  }, [year, month])

  const handleNextMonth = useCallback(() => {
    const next = getNextMonth(year, month)
    const nowDate = new Date()
    // Don't navigate to future months
    if (next.year > nowDate.getFullYear() ||
        (next.year === nowDate.getFullYear() && next.month > nowDate.getMonth() + 1)) return
    setYear(next.year)
    setMonth(next.month)
  }, [year, month])

  // Toggle handler — plays retro 8-bit sound and delegates to mutation
  const handleToggle = useCallback(
    (habitId: string, date: string, currentlyCompleted: boolean) => {
      if (!currentlyCompleted) {
        retroAudio.playCheck()
      } else {
        retroAudio.playUncheck()
      }
      toggleMutation.mutate({ habitId, date, currentlyCompleted })
    },
    [toggleMutation],
  )

  // ---- Render ------------------------------------------------

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-[#08090C] text-[#F1F5F9]">
        <MobileHeader
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          habits={habits}
          logs={logs}
          userXP={userXP}
          userLevel={userLevel}
        />
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <MobileTrackerView
            habits={habits}
            logs={logs}
            year={year}
            month={month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToggle={handleToggle}
          />
        )}
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="flex flex-col h-screen bg-[#08090C] text-[#F1F5F9] overflow-hidden">
      <DesktopHeader
        year={year}
        month={month}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
        habits={habits}
        logs={logs}
        userXP={userXP}
        userLevel={userLevel}
      />

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Main matrix area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#08090C]">
          {/* View Switcher Sub-header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E2230] bg-[#0A0C12] shrink-0">
            <div className="flex items-center gap-1.5 p-0.5 bg-[#08090C] rounded-lg border border-[#1E2230]">
              <button
                type="button"
                onClick={() => setActiveView('aesthetic')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer',
                  activeView === 'aesthetic'
                    ? 'bg-[#1E2230] text-[#10B981] shadow-sm shadow-emerald-500/15'
                    : 'text-[#64748B] hover:text-slate-200',
                )}
              >
                <Sparkles size={12} className={activeView === 'aesthetic' ? 'text-[#10B981]' : ''} />
                <span>SEMANA AESTHETIC</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('monthly')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer',
                  activeView === 'monthly'
                    ? 'bg-[#1E2230] text-[#38BDF8] shadow-sm shadow-sky-500/15'
                    : 'text-[#64748B] hover:text-slate-200',
                )}
              >
                <CalendarDays size={12} className={activeView === 'monthly' ? 'text-[#38BDF8]' : ''} />
                <span>MES COMPLETO</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-[#64748B] hidden sm:inline uppercase tracking-widest">
              {activeView === 'aesthetic' ? '// VISTA ESTILO SPREADSHEET' : '// MATRIZ DE 31 DÍAS'}
            </span>
          </div>

          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              key={activeView}
              className="flex-1 overflow-auto p-4 space-y-6"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {activeView === 'aesthetic' ? (
                <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
                  {/* Top: Donut Gauge + Spreadsheet Weekly Matrix */}
                  <AestheticWeeklyMatrix
                    habits={habits}
                    logs={logs}
                    year={year}
                    month={month}
                    onToggle={handleToggle}
                  />

                  {/* Bottom: Daily Cards Breakdown & Tasks */}
                  <AestheticDailyColumns
                    habits={habits}
                    logs={logs}
                    year={year}
                    month={month}
                    onToggle={handleToggle}
                  />
                </div>
              ) : (
                <DesktopMatrixGrid
                  habits={habits}
                  logs={logs}
                  year={year}
                  month={month}
                  onToggle={handleToggle}
                />
              )}
            </motion.div>
          )}
        </main>

        {/* Right side panel */}
        <div className="w-80 xl:w-96 border-l border-[#1E2230] overflow-y-auto p-4 shrink-0 bg-[#10121A]/30">
          {!isLoading && (
            <DesktopSidePanel
              habits={habits}
              logs={logs}
              goals={goals}
              year={year}
              month={month}
              userXP={userXP}
              userLevel={userLevel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
