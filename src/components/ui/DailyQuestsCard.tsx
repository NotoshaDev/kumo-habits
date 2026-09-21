'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, Check, Trash2, ChevronDown, Zap } from 'lucide-react'
import { useDailyQuests } from '@/hooks/useDailyQuests'
import { cn } from '@/lib/utils'

interface DailyQuestsCardProps {
  dateStr?: string
  className?: string
  defaultExpanded?: boolean
}

export function DailyQuestsCard({
  dateStr,
  className,
  defaultExpanded = true,
}: DailyQuestsCardProps) {
  const {
    quests,
    loaded,
    addQuest,
    toggleQuest,
    deleteQuest,
    completedCount,
    totalCount,
    questXP,
  } = useDailyQuests(dateStr)

  const [isOpen, setIsOpen] = useState(defaultExpanded)
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    addQuest(newTitle)
    setNewTitle('')
  }

  if (!loaded) return null

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#EAE2D8] bg-[#FFFFFF] shadow-[0_4px_16px_rgba(78,64,53,0.04)] overflow-hidden font-sans transition-all',
        className,
      )}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-3 bg-[#FFFDF9] hover:bg-[#FAF7F2] transition-colors cursor-pointer border-b border-[#EAE2D8]/80 select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#FDF2ED] border border-[#F2C4AF] flex items-center justify-center text-[#C95D47] shadow-xs">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold text-[#3D2E26] flex items-center gap-2">
              <span>MISIONES DE HOY</span>
              {questXP > 0 && (
                <span className="text-[9px] font-bold text-[#C95D47] bg-[#FDF2ED] px-1.5 py-0.5 rounded-md border border-[#F2C4AF] flex items-center gap-0.5">
                  <Zap size={10} />
                  <span>+{questXP} XP</span>
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[#8C7A70] leading-none mt-0.5">
              Objetivos puntuales que solo aplican a esta jornada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EAE2D8] text-[#7A6A60]">
            {completedCount}/{totalCount}
          </span>
          <ChevronDown
            size={14}
            className={cn('text-[#9E928C] transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3.5 space-y-3 bg-[#FFFFFF]">
              {/* Form to add quest */}
              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Escribe una misión para hoy..."
                  className="flex-1 px-3 py-1.5 bg-[#FAF7F2] border border-[#EAE2D8] rounded-xl text-xs text-[#3D2E26] placeholder-[#A59990] focus:outline-none focus:border-[#F28574] focus:bg-[#FFFFFF] transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className={cn(
                    'px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer',
                    newTitle.trim()
                      ? 'bg-[#F28574] hover:bg-[#E07261] text-white shadow-xs active:scale-95'
                      : 'bg-[#FAF7F2] text-[#C4B7AC] border border-[#EAE2D8] cursor-not-allowed',
                  )}
                >
                  <Plus size={13} className="stroke-[3]" />
                  <span>Añadir</span>
                </button>
              </form>

              {/* Quests list */}
              {quests.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#8C7A70] font-sans">
                  No tienes misiones pendientes para hoy. ¡Agrega una arriba!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {quests.map((quest) => (
                    <div
                      key={quest.id}
                      className={cn(
                        'group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150',
                        quest.completed
                          ? 'bg-[#FAF7F2]/60 border-[#EAE2D8]/70 opacity-75'
                          : 'bg-[#FFFDF9] border-[#EAE2D8] hover:border-[#DFD5CA]',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleQuest(quest.id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0',
                            quest.completed
                              ? 'bg-[#4EBA88] border-[#4EBA88] text-white shadow-xs'
                              : 'bg-[#FFFFFF] border-[#DFD5CA] hover:border-[#4EBA88]',
                          )}
                        >
                          {quest.completed && <Check size={12} className="stroke-[3]" />}
                        </div>
                        <span
                          className={cn(
                            'text-xs transition-all font-medium truncate',
                            quest.completed
                              ? 'text-[#8C7A70] line-through'
                              : 'text-[#3D2E26]',
                          )}
                        >
                          {quest.title}
                        </span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {quest.completed && (
                          <span className="text-[10px] font-mono font-bold text-[#246348] bg-[#EBF7F1] px-1.5 py-0.5 rounded-md border border-[#A7E2C6]">
                            +20 XP
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteQuest(quest.id)}
                          className="p-1 rounded-lg text-[#C4B7AC] hover:text-[#C93B58] hover:bg-[#FFF0F3] transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                          title="Eliminar misión"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
