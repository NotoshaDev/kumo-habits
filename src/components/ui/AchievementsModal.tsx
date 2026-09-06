'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, Lock, CheckCircle2, Zap } from 'lucide-react'
import { ICON_MAP } from '@/lib/icon-map'
import { evaluateAchievements, type Achievement } from '@/lib/achievements'
import type { HabitRow, HabitLogRow } from '@/types/database'
import { cn } from '@/lib/utils'

interface AchievementsModalProps {
  habits: HabitRow[]
  logs: HabitLogRow[]
  userXP?: number
  trigger?: React.ReactNode
}

export function AchievementsModal({ habits, logs, userXP = 0, trigger }: AchievementsModalProps) {
  const [open, setOpen] = useState(false)

  const achievements = evaluateAchievements(habits, logs, userXP)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-[#08090C]/80 backdrop-blur-md z-50"
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto bg-[#10121A] border border-[#1E2230] rounded-2xl p-6 shadow-2xl shadow-amber-950/20 z-50 focus:outline-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#1E2230] pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center">
                      <Trophy size={18} className="text-[#F59E0B]" style={{ filter: 'drop-shadow(0 0 6px #F59E0B)' }} />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-base font-bold text-[#F1F5F9] tracking-wide">
                        LOGROS & MEDALLAS
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#64748B]">
                        {unlockedCount} de {achievements.length} trofeos desbloqueados
                      </Dialog.Description>
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1E2230] transition-colors"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Overall Progress */}
                <div className="mb-5 p-3.5 rounded-xl bg-[#08090C] border border-[#1E2230]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">
                      Progreso de Trofeos
                    </span>
                    <span className="font-mono text-xs font-bold text-[#F59E0B]">
                      {Math.round((unlockedCount / achievements.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#1E2230] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#EC4899] transition-all duration-500"
                      style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Achievements List */}
                <div className="space-y-3">
                  {achievements.map((item) => {
                    const IconComponent = ICON_MAP[item.icon] ?? Trophy

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5',
                          item.unlocked
                            ? 'bg-[#08090C] border-[#1E2230] hover:border-[#2E3450]'
                            : 'bg-[#08090C]/50 border-[#1E2230]/50 opacity-60',
                        )}
                      >
                        {/* Icon Badge */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5"
                          style={{
                            backgroundColor: item.unlocked ? `${item.colorHex}15` : '#1E223040',
                            borderColor: item.unlocked ? `${item.colorHex}40` : '#1E2230',
                            color: item.unlocked ? item.colorHex : '#475569',
                            boxShadow: item.unlocked ? `0 0 10px ${item.colorHex}33` : 'none',
                          }}
                        >
                          {item.unlocked ? <IconComponent size={20} /> : <Lock size={18} />}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-mono text-xs font-bold text-[#F1F5F9] truncate">
                              {item.title}
                            </h4>
                            <span
                              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 flex items-center gap-1"
                              style={{
                                backgroundColor: `${item.colorHex}10`,
                                color: item.colorHex,
                                borderColor: `${item.colorHex}30`,
                              }}
                            >
                              <Zap size={10} /> +{item.xpBonus} XP
                            </span>
                          </div>

                          <p className="text-xs text-[#64748B] mt-1 leading-snug">
                            {item.description}
                          </p>

                          {/* Progress bar if locked */}
                          {!item.unlocked && (
                            <div className="mt-2.5">
                              <div className="h-1.5 bg-[#1E2230] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${item.progress}%`,
                                    backgroundColor: item.colorHex,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
