'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  X,
  Maximize2,
  Zap,
} from 'lucide-react'
import { retroAudio } from '@/lib/sound-effects'
import { cn } from '@/lib/utils'

interface InstallAppModalProps {
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function InstallAppModal({ trigger, isOpen: controlledOpen, onOpenChange }: InstallAppModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect if already installed / standalone
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true

      setIsStandalone(isStandaloneMode)

      // Detect OS for initial tab
      const ua = window.navigator.userAgent.toLowerCase()
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('ios')
      } else if (/android/.test(ua)) {
        setPlatform('android')
      }
    }
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      retroAudio.playCheck()
    }
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      ) : isControlled ? null : (
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#F28574]/40 bg-[#FDF2ED] text-[#C95D47] text-xs font-mono font-bold hover:bg-[#FCE5DB] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Smartphone size={14} className="text-[#F28574]" />
            <span>Instalar App</span>
          </button>
        </Dialog.Trigger>
      )}

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-[#28201A]/45 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[85dvh] flex flex-col bg-[#FFFFFF] border border-[#EAE2D8] rounded-3xl p-5 sm:p-6 shadow-[0_16px_50px_rgba(78,64,53,0.18)] font-sans text-[#3D2E26] focus:outline-none overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#EAE2D8] shrink-0">
                  <div className="pr-2">
                    <Dialog.Title className="text-base font-bold flex items-center gap-2 text-[#3D2E26]">
                      <div className="w-8 h-8 rounded-xl bg-[#FDF2ED] border border-[#F2C4AF] flex items-center justify-center text-[#C95D47] shrink-0">
                        <Smartphone size={16} />
                      </div>
                      <span>Instalar en tu Celular</span>
                    </Dialog.Title>
                    <Dialog.Description className="text-xs text-[#8C7A70] mt-1 leading-relaxed">
                      Úsala en pantalla completa sin barras de navegador, como una app nativa.
                    </Dialog.Description>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      className="p-1.5 rounded-xl text-[#9E928C] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Modal Body */}
                <div className="space-y-4 overflow-y-auto pr-1 pb-1 scrollbar-thin">
                  {isStandalone ? (
                    /* Already installed view */
                    <div className="p-4 rounded-2xl bg-[#EBF7F1] border border-[#A7E2C6] text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#FFFFFF] border border-[#A7E2C6] flex items-center justify-center mx-auto mb-2 text-[#246348]">
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-[#246348] mb-1">
                        ¡Ya la tienes instalada como App!
                      </h4>
                      <p className="text-xs text-[#3D2E26]/80 leading-relaxed">
                        Estás navegando en modo pantalla completa sin bordes. ¡Excelente para tu concentración y productividad diaria!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Platform Switcher */}
                      <div className="flex p-1 bg-[#FAF7F2] rounded-2xl border border-[#EAE2D8]">
                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playCheck()
                            setPlatform('ios')
                          }}
                          className={cn(
                            'flex-1 py-2 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
                            platform === 'ios'
                              ? 'bg-[#FFFFFF] text-[#C95D47] shadow-xs border border-[#EAE2D8]'
                              : 'text-[#8C7A70] hover:text-[#3D2E26]',
                          )}
                        >
                          <span>iPhone (iOS)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playCheck()
                            setPlatform('android')
                          }}
                          className={cn(
                            'flex-1 py-2 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5',
                            platform === 'android'
                              ? 'bg-[#FFFFFF] text-[#C95D47] shadow-xs border border-[#EAE2D8]'
                              : 'text-[#8C7A70] hover:text-[#3D2E26]',
                          )}
                        >
                          <span>Android (Chrome)</span>
                        </button>
                      </div>

                      {/* Instructions by Platform */}
                      {platform === 'ios' ? (
                        <div className="space-y-2.5">
                          {/* Step 1 */}
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D8]">
                            <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-center text-xs font-bold text-[#7A6A60] shrink-0 font-mono">
                              1
                            </div>
                            <div className="flex-1 text-xs leading-relaxed">
                              <p className="font-bold text-[#3D2E26] mb-0.5 flex items-center gap-1.5">
                                <span>Abre Safari y toca Compartir</span>
                                <span className="inline-flex p-1 rounded-md bg-[#FAF7F2] border border-[#EAE2D8] text-[#3D2E26]">
                                  <Share size={12} />
                                </span>
                              </p>
                              <p className="text-[#8C7A70]">
                                En la barra inferior de Safari, pulsa el botón del cuadrado con flecha hacia arriba.
                              </p>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D8]">
                            <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-center text-xs font-bold text-[#7A6A60] shrink-0 font-mono">
                              2
                            </div>
                            <div className="flex-1 text-xs leading-relaxed">
                              <p className="font-bold text-[#3D2E26] mb-0.5 flex items-center gap-1.5">
                                <span>Elige &quot;Agregar a inicio&quot;</span>
                                <span className="inline-flex p-1 rounded-md bg-[#FAF7F2] border border-[#EAE2D8] text-[#3D2E26]">
                                  <PlusSquare size={12} />
                                </span>
                              </p>
                              <p className="text-[#8C7A70]">
                                Desliza hacia abajo en el menú de opciones y toca <strong>&quot;Agregar a inicio&quot;</strong>.
                              </p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D8]">
                            <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-center text-xs font-bold text-[#7A6A60] shrink-0 font-mono">
                              3
                            </div>
                            <div className="flex-1 text-xs leading-relaxed">
                              <p className="font-bold text-[#3D2E26] mb-0.5">
                                Pulsa &quot;Agregar&quot; arriba a la derecha
                              </p>
                              <p className="text-[#8C7A70]">
                                Confirma el nombre Kumo Habits y pulsa <strong>Agregar</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {/* Step 1 */}
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D8]">
                            <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-center text-xs font-bold text-[#7A6A60] shrink-0 font-mono">
                              1
                            </div>
                            <div className="flex-1 text-xs leading-relaxed">
                              <p className="font-bold text-[#3D2E26] mb-0.5 flex items-center gap-1.5">
                                <span>Toca los 3 puntos en Chrome</span>
                                <span className="inline-flex p-1 rounded-md bg-[#FAF7F2] border border-[#EAE2D8] text-[#3D2E26]">
                                  <MoreVertical size={12} />
                                </span>
                              </p>
                              <p className="text-[#8C7A70]">
                                Arriba a la derecha del navegador, pulsa el menú de los tres puntos verticales.
                              </p>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D8]">
                            <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-center text-xs font-bold text-[#7A6A60] shrink-0 font-mono">
                              2
                            </div>
                            <div className="flex-1 text-xs leading-relaxed">
                              <p className="font-bold text-[#3D2E26] mb-0.5">
                                &quot;Instalar app&quot; o &quot;Agregar a pantalla principal&quot;
                              </p>
                              <p className="text-[#8C7A70]">
                                Selecciona la opción para instalar la aplicación o fijarla en tu teléfono.
                              </p>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#EAE2D8]">
                            <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-center text-xs font-bold text-[#7A6A60] shrink-0 font-mono">
                              3
                            </div>
                            <div className="flex-1 text-xs leading-relaxed">
                              <p className="font-bold text-[#3D2E26] mb-0.5">
                                Confirma con &quot;Instalar&quot;
                              </p>
                              <p className="text-[#8C7A70]">
                                ¡Listo! El icono se añadirá a tus aplicaciones y pantalla de inicio.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Benefits Badge */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center gap-2">
                          <Maximize2 size={14} className="text-[#F28574] shrink-0" />
                          <span className="text-[11px] font-semibold text-[#7A6A60]">Pantalla completa</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center gap-2">
                          <Zap size={14} className="text-[#EFA93A] shrink-0" />
                          <span className="text-[11px] font-semibold text-[#7A6A60]">Acceso en 1 toque</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#F28574] to-[#E57865] hover:from-[#FA9585] hover:to-[#F28574] text-white font-bold text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(242,133,116,0.28)] transition-all cursor-pointer active:scale-[0.99]"
                  >
                    ¡Entendido!
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export function InstallAppBanner() {
  const [show, setShow] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      const dismissed = localStorage.getItem('kumo_install_banner_dismissed') === 'true'
      if (!isStandalone && !dismissed) {
        setShow(true)
      }
    }
  }, [])

  if (!show) return null

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShow(false)
    localStorage.setItem('kumo_install_banner_dismissed', 'true')
  }

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="mx-4 mt-1 mb-3.5 p-3 rounded-2xl bg-[#FFFFFF] border border-[#F2C4AF] shadow-[0_4px_16px_rgba(78,64,53,0.05)] flex items-center justify-between cursor-pointer hover:bg-[#FDF2ED]/50 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-xl bg-[#FDF2ED] border border-[#F2C4AF] flex items-center justify-center text-[#C95D47] shrink-0">
            <Smartphone size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#3D2E26] flex items-center gap-1.5">
              <span>¿Instalar como App?</span>
              <span className="text-[9px] font-mono font-bold text-[#C95D47] bg-[#FDF2ED] px-1.5 py-0.5 rounded-md border border-[#F2C4AF]">PWA</span>
            </p>
            <p className="text-[10px] text-[#8C7A70] truncate">
              Ver cómo agregarla a tu pantalla de inicio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-[#C95D47] group-hover:underline">
            Ver pasos
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-[#A59990] hover:text-[#3D2E26] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            title="Ocultar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <InstallAppModal isOpen={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
