'use client'

import { useState, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  X,
  ShieldCheck,
  Smartphone,
  Info,
} from 'lucide-react'
import { useNotificationReminder } from '@/hooks/useNotificationReminder'
import { retroAudio } from '@/lib/sound-effects'
import { cn } from '@/lib/utils'

interface NotificationSettingsModalProps {
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const TIME_PRESETS = [
  { label: '19:00', value: '19:00' },
  { label: '20:30', value: '20:30' },
  { label: '21:30', value: '21:30' },
  { label: '22:00', value: '22:00' },
]

export function NotificationSettingsModal({
  trigger,
  isOpen: controlledOpen,
  onOpenChange,
}: NotificationSettingsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const prevOpenRef = useRef<boolean>(false)
  const openTimestampRef = useRef<number>(0)

  if (open && !prevOpenRef.current) {
    openTimestampRef.current = Date.now()
  } else if (!open && prevOpenRef.current) {
    openTimestampRef.current = 0
  }
  prevOpenRef.current = open

  const isGhostEvent = () => {
    if (openTimestampRef.current === 0) return true
    return Date.now() - openTimestampRef.current < 500
  }

  const {
    isSupported,
    permission,
    settings,
    isTesting,
    updateSettings,
    enableNotifications,
    disableNotifications,
    triggerTestNotification,
  } = useNotificationReminder()

  const [testSent, setTestSent] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isGhostEvent()) return
    if (newOpen) {
      retroAudio.playCheck()
    } else {
      retroAudio.playUncheck()
      setTestSent(false)
      setCountdown(null)
    }

    if (isControlled && onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const handleToggleActive = async () => {
    retroAudio.playCheck()
    if (settings.enabled) {
      disableNotifications()
    } else {
      const ok = await enableNotifications()
      if (ok) {
        retroAudio.playAchievement()
      }
    }
  }

  const handleRunTest = async () => {
    if (isTesting || countdown !== null) return
    retroAudio.playCheck()
    setCountdown(3)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return null
        }
        return prev - 1
      })
    }, 1000)

    const ok = await triggerTestNotification(3)
    if (ok) {
      retroAudio.playAchievement()
      setTestSent(true)
      setTimeout(() => setTestSent(false), 8000)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-[#282321]/40 backdrop-blur-sm z-[9998]"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-md rounded-3xl bg-[#FAF7F2] border border-[#EAE2D8] shadow-[0_20px_60px_rgba(40,35,33,0.18)] p-6 relative pointer-events-auto overflow-hidden text-[#3D2E26] max-h-[90vh] flex flex-col"
                >
                  {/* Close button */}
                  <button
                    onClick={() => handleOpenChange(false)}
                    className="absolute top-4 right-4 p-2 rounded-xl text-[#8C7A70] hover:text-[#3D2E26] hover:bg-[#F2ECE4] transition-colors cursor-pointer"
                    aria-label="Cerrar modal"
                  >
                    <X size={18} />
                  </button>

                  {/* Header */}
                  <div className="flex items-center gap-3.5 mb-5 shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F28574]/20 via-[#EFA93A]/20 to-[#4EBA88]/20 border border-[#F2C4AF] flex items-center justify-center shadow-xs">
                      <Bell size={22} className="text-[#C95D47]" />
                    </div>
                    <div>
                      <Dialog.Title className="font-mono text-base font-bold text-[#3D2E26] flex items-center gap-2">
                        <span>Recordatorios Diarios</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FDF2ED] text-[#C95D47] border border-[#F2C4AF]">
                          PWA
                        </span>
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#8C7A70] mt-0.5">
                        Avisos suaves y no invasivos para cuidar tu racha
                      </Dialog.Description>
                    </div>
                  </div>

                  {/* Scrollable body */}
                  <div className="overflow-y-auto space-y-4 pr-1">
                    {/* Status Card */}
                    <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D8] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#8C7A70] uppercase tracking-wider">
                          Permisos del Navegador
                        </span>
                        {permission === 'granted' ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#2E7D5B] bg-[#EAF5F0] border border-[#BDE3D2] px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> ACTIVO
                          </span>
                        ) : permission === 'denied' ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#C93B58] bg-[#FFF0F3] border border-[#FFCCD5] px-2 py-0.5 rounded-full">
                            <AlertCircle size={11} /> BLOQUEADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#8C7A70] bg-[#FAF7F2] border border-[#EAE2D8] px-2 py-0.5 rounded-full">
                            PENDIENTE
                          </span>
                        )}
                      </div>

                      {permission === 'denied' && (
                        <p className="text-[11px] text-[#C93B58] bg-[#FFF0F3] p-2.5 rounded-xl border border-[#FFCCD5] leading-relaxed">
                          Las notificaciones están bloqueadas en tu navegador. Toca el icono de candado o ajustes del sitio junto a la barra de dirección para habilitarlas.
                        </p>
                      )}
                    </div>

                    {/* Master Switch */}
                    <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D8] shadow-2xs flex items-center justify-between">
                      <div className="space-y-0.5 pr-3">
                        <p className="font-bold text-xs text-[#3D2E26]">Activar Recordatorio Diario</p>
                        <p className="text-[11px] text-[#8C7A70]">
                          Un solo aviso al día cuando se acerque tu hora elegida.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleActive}
                        className={cn(
                          'w-12 h-6 rounded-full transition-colors relative cursor-pointer flex-none',
                          settings.enabled && permission === 'granted'
                            ? 'bg-[#F28574]'
                            : 'bg-[#DFD5CA]',
                        )}
                        aria-label="Alternar recordatorio"
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-full bg-white shadow-sm block transition-transform duration-200 ease-out transform mt-0.5 ml-0.5',
                            settings.enabled && permission === 'granted'
                              ? 'translate-x-6'
                              : 'translate-x-0',
                          )}
                        />
                      </button>
                    </div>

                    {/* Settings options (when enabled) */}
                    {settings.enabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3.5"
                      >
                        {/* Time Picker */}
                        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D8] shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <label htmlFor="reminder-time-input" className="font-bold text-xs text-[#3D2E26] flex items-center gap-1.5 cursor-pointer">
                              <Clock size={14} className="text-[#F28574]" />
                              <span>Hora del recordatorio</span>
                            </label>

                            <input
                              id="reminder-time-input"
                              type="time"
                              value={settings.time}
                              onChange={(e) => updateSettings({ time: e.target.value })}
                              className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl border border-[#EAE2D8] bg-[#FAF7F2] text-[#3D2E26] focus:outline-none focus:border-[#F28574] cursor-pointer"
                            />
                          </div>

                          {/* Quick Presets */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#8C7A70]">Sugeridas:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {TIME_PRESETS.map((preset) => (
                                <button
                                  key={preset.value}
                                  type="button"
                                  onClick={() => {
                                    retroAudio.playCheck()
                                    updateSettings({ time: preset.value })
                                  }}
                                  className={cn(
                                    'font-mono text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer',
                                    settings.time === preset.value
                                      ? 'bg-[#FDF2ED] border-[#F2C4AF] text-[#C95D47] font-bold shadow-2xs'
                                      : 'bg-[#FAF7F2] border-[#EAE2D8] text-[#8C7A70] hover:bg-[#F2ECE4]',
                                  )}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Smart Silence Switch */}
                        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D8] shadow-2xs flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-bold text-xs text-[#3D2E26] flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-[#4EBA88]" />
                              <span>Silencio Inteligente</span>
                            </p>
                            <p className="text-[11px] text-[#8C7A70] leading-snug">
                              Si ya completaste todos tus hábitos del día, no te molestaremos ni enviaremos pings.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              retroAudio.playCheck()
                              updateSettings({ smartOnlyPending: !settings.smartOnlyPending })
                            }}
                            className={cn(
                              'w-10 h-5 rounded-full transition-colors relative cursor-pointer flex-none mt-1',
                              settings.smartOnlyPending ? 'bg-[#4EBA88]' : 'bg-[#DFD5CA]',
                            )}
                            aria-label="Alternar silencio inteligente"
                          >
                            <span
                              className={cn(
                                'w-4 h-4 rounded-full bg-white shadow-sm block transition-transform duration-200 ease-out transform mt-0.5 ml-0.5',
                                settings.smartOnlyPending ? 'translate-x-5' : 'translate-x-0',
                              )}
                            />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Live Mobile Test Button */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF8E6] to-[#FFFDF9] border border-[#FFE08A] shadow-2xs space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className="text-[#B87A00]" />
                        <span className="font-bold text-xs text-[#B87A00]">
                          Prueba Inmediata en tu Teléfono
                        </span>
                      </div>

                      <p className="text-[11px] text-[#7A5800] leading-snug">
                        Presiona el botón. Tendrás 3 segundos para minimizar la app o apagar tu pantalla y comprobar la llegada de la notificación.
                      </p>

                      <button
                        type="button"
                        onClick={handleRunTest}
                        disabled={isTesting || countdown !== null}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer',
                          countdown !== null
                            ? 'bg-[#EFA93A] text-white animate-pulse'
                            : testSent
                              ? 'bg-[#4EBA88] text-white'
                              : 'bg-gradient-to-r from-[#F28574] to-[#E57865] hover:from-[#FA9585] hover:to-[#F28574] text-white shadow-[0_4px_14px_rgba(242,133,116,0.25)] active:scale-98',
                        )}
                      >
                        {countdown !== null ? (
                          <>
                            <Clock size={14} className="animate-spin" />
                            <span>ENVIANDO EN {countdown}s... (¡MINIMIZA LA APP!)</span>
                          </>
                        ) : testSent ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>¡NOTIFICACIÓN ENVIADA AL DISPOSITIVO!</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>🔔 PROBAR NOTIFICACIÓN AHORA</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* iOS Note */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F2ECE4]/60 border border-[#EAE2D8] text-[11px] text-[#8C7A70]">
                      <Info size={14} className="text-[#8C7A70] flex-none mt-0.5" />
                      <p>
                        <strong>En iPhone (iOS):</strong> Requiere iOS 16.4+ y haber añadido la app a la Pantalla de Inicio para recibir notificaciones web.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
