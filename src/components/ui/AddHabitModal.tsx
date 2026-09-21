'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Check } from 'lucide-react'
import { ICON_MAP, ICON_KEYS } from '@/lib/icon-map'
import { useCreateHabit } from '@/hooks/useHabits'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { hex: '#10B981', label: 'Menta Neon' },
  { hex: '#EC4899', label: 'Fucsia Cyber' },
  { hex: '#06B6D4', label: 'Cian Laser' },
  { hex: '#A78BFA', label: 'Violeta Retro' },
  { hex: '#F59E0B', label: 'Ámbar Pixel' },
  { hex: '#F43F5E', label: 'Rosa Neón' },
  { hex: '#38BDF8', label: 'Azul Eléctrico' },
  { hex: '#84CC16', label: 'Verde Lime' },
]

const CATEGORY_PRESETS = [
  'Bienestar',
  'Salud',
  'Enfoque',
  'Finanzas',
  'Creatividad',
  'Productividad',
]

interface AddHabitModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function AddHabitModal({ open, onOpenChange, trigger }: AddHabitModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange ?? (() => {}) : setInternalOpen

  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Salud')
  const [colorHex, setColorHex] = useState('#10B981')
  const [iconKey, setIconKey] = useState('star')
  const [errorMsg, setErrorMsg] = useState('')

  const createHabit = useCreateHabit()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Por favor ingresa un nombre para el hábito.')
      return
    }

    setErrorMsg('')
    try {
      await createHabit.mutateAsync({
        name: name.trim(),
        category: category.trim() || 'General',
        color_hex: colorHex,
        icon_key: iconKey,
      })
      // Reset & close
      setName('')
      setIsOpen(false)
    } catch (err) {
      console.error('Error creating habit:', err)
      setErrorMsg('Error al crear el hábito. Intenta de nuevo.')
    }
  }

  const PreviewIcon = ICON_MAP[iconKey] || ICON_MAP.star

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-[#28201A]/45 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            {/* Modal Box */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-6 shadow-[0_20px_60px_rgba(78,64,53,0.18)] z-50 focus:outline-none text-[#3D2E26] font-sans"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors shadow-xs"
                      style={{
                        backgroundColor: `${colorHex}15`,
                        borderColor: `${colorHex}40`,
                      }}
                    >
                      <PreviewIcon size={16} style={{ color: colorHex }} />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-base font-bold text-[#3D2E26] tracking-wide">
                        NUEVO HÁBITO
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#8C7A70]">
                        Configura un nuevo objetivo para tu seguimiento diario
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error Banner */}
                  {errorMsg && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#FFF0F3] border border-[#FFCCD5] text-[#C93B58] text-xs font-mono font-medium">
                      {errorMsg}
                    </div>
                  )}

                  {/* Habit Name Input */}
                  <div>
                    <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                      Nombre del hábito *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Meditación matutina, 10k Pasos..."
                      className="w-full px-4 py-2.5 bg-[#FAF7F2] border border-[#EAE2D8] rounded-xl text-[#3D2E26] placeholder-[#A59990] text-sm focus:outline-none focus:border-[#F28574] focus:bg-[#FFFFFF] transition-all font-medium"
                      autoFocus
                      required
                    />
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                      Categoría
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {CATEGORY_PRESETS.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border cursor-pointer',
                            category === cat
                              ? 'bg-[#FDF2ED] text-[#C95D47] border-[#F2C4AF] shadow-xs'
                              : 'bg-[#FAF7F2] text-[#7A6A60] border-[#EAE2D8] hover:bg-[#F5EFEB]',
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="O escribe una categoría personalizada..."
                      className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EAE2D8] rounded-xl text-[#3D2E26] placeholder-[#A59990] text-xs focus:outline-none focus:border-[#F28574] focus:bg-[#FFFFFF] transition-all"
                    />
                  </div>

                  {/* Color Swatches */}
                  <div>
                    <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                      Color
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColorHex(c.hex)}
                          className={cn(
                            'w-full aspect-square rounded-xl flex items-center justify-center transition-transform duration-150 border cursor-pointer',
                            colorHex === c.hex
                              ? 'scale-110 border-[#3D2E26] shadow-md ring-2 ring-[#3D2E26]/20'
                              : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100',
                          )}
                          style={{
                            backgroundColor: c.hex,
                          }}
                          title={c.label}
                        >
                          {colorHex === c.hex && <Check size={14} className="text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon Grid */}
                  <div>
                    <label className="block font-mono text-xs font-semibold text-[#7A6A60] uppercase tracking-wider mb-2">
                      Icono
                    </label>
                    <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-2 bg-[#FAF7F2] border border-[#EAE2D8] rounded-2xl scrollbar-thin scrollbar-thumb-[#E5DCD3]">
                      {ICON_KEYS.map((key) => {
                        const IconComponent = ICON_MAP[key]
                        const isSelected = iconKey === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setIconKey(key)}
                            className={cn(
                              'p-2 rounded-xl flex items-center justify-center transition-all duration-150 border cursor-pointer',
                              isSelected
                                ? 'border-[#F28574] bg-[#FFFFFF] text-[#C95D47] shadow-xs'
                                : 'border-transparent text-[#8C7A70] hover:text-[#3D2E26] hover:bg-[#FFFFFF]',
                            )}
                          >
                            <IconComponent size={18} />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#8C7A70] uppercase tracking-wider font-semibold">
                      VISTA PREVIA
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center border shadow-xs"
                        style={{
                          backgroundColor: `${colorHex}15`,
                          borderColor: `${colorHex}40`,
                        }}
                      >
                        <PreviewIcon size={14} style={{ color: colorHex }} />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#3D2E26]">
                        {name.trim() || 'Nombre del Hábito'}
                      </span>
                      <span
                        className="font-mono text-[10px] px-2 py-0.5 rounded-md border font-semibold"
                        style={{
                          backgroundColor: `${colorHex}15`,
                          color: colorHex,
                          borderColor: `${colorHex}30`,
                        }}
                      >
                        {category || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE2D8]">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#8C7A70] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                      >
                        CANCELAR
                      </button>
                    </Dialog.Close>

                    <button
                      type="submit"
                      disabled={createHabit.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F28574] to-[#E57865] hover:from-[#FA9585] hover:to-[#F28574] text-white font-mono text-xs font-bold tracking-wider transition-all duration-150 shadow-[0_4px_14px_rgba(242,133,116,0.25)] active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {createHabit.isPending ? (
                        <span>GUARDANDO...</span>
                      ) : (
                        <>
                          <Plus size={16} className="stroke-[3]" />
                          <span>CREAR HÁBITO</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
