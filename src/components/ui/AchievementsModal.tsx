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
                className="fixed inset-0 bg-[#28201A]/45 backdrop-blur-sm z-[9998]"
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-6 shadow-[0_20px_60px_rgba(78,64,53,0.18)] z-[9999] focus:outline-none text-[#3D2E26] font-sans"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF8E6] border border-[#FFE08A] flex items-center justify-center text-[#B87A00] shadow-xs">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-base font-bold text-[#3D2E26] tracking-wide">
                        LOGROS & MEDALLAS
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#8C7A70]">
                        {unlockedCount} de {achievements.length} trofeos desbloqueados
                      </Dialog.Description>
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="p-1.5 rounded-xl text-[#9E928C] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Overall Progress */}
                <div className="mb-5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D8]">
                  <div className="flex justify-between items-center mb-2 font-mono">
                    <span className="text-xs font-bold text-[#7A6A60] uppercase tracking-wider">
                      Progreso de Trofeos
                    </span>
                    <span className="text-xs font-bold text-[#B87A00]">
                      {Math.round((unlockedCount / achievements.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#F0EAE1] rounded-full overflow-hidden border border-[#EAE2D8]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EFA93A] to-[#F2728C] transition-all duration-500"
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
                          'p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5',
                          item.unlocked
                            ? 'bg-[#FFFFFF] border-[#EAE2D8] hover:border-[#DFD5CA] shadow-xs'
                            : 'bg-[#FAF7F2] border-[#EAE2D8]/60 opacity-60',
                        )}
                      >
                        {/* Icon Badge */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-xs"
                          style={{
                            backgroundColor: item.unlocked ? `${item.colorHex}15` : '#FAF7F2',
                            borderColor: item.unlocked ? `${item.colorHex}40` : '#EAE2D8',
                            color: item.unlocked ? item.colorHex : '#9E928C',
                          }}
                        >
                          {item.unlocked ? <IconComponent size={20} /> : <Lock size={18} />}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-mono text-xs font-bold text-[#3D2E26] truncate">
                              {item.title}
                            </h4>
                            <span
                              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 flex items-center gap-1"
                              style={{
                                backgroundColor: `${item.colorHex}12`,
                                color: item.colorHex,
                                borderColor: `${item.colorHex}30`,
                              }}
                            >
                              <Zap size={10} /> +{item.xpBonus} XP
                            </span>
                          </div>

                          <p className="text-xs text-[#8C7A70] mt-1 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Progress bar inside card if locked */}
                          {!item.unlocked && (
                            <div className="mt-2.5">
                              <div className="h-1.5 bg-[#F0EAE1] rounded-full overflow-hidden">
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
