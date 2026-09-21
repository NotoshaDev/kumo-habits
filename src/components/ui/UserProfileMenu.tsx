'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, LogIn, Wifi, ChevronDown, Smartphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { retroAudio } from '@/lib/sound-effects'
import { InstallAppModal } from '@/components/ui/InstallAppModal'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface UserProfileMenuProps {
  level?: number
  xp?: number
}

export function UserProfileMenu({ level = 1, xp = 0 }: UserProfileMenuProps) {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial user session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleMenu = () => {
    retroAudio.playCheck()
    setIsOpen(!isOpen)
  }

  const handleLogout = async () => {
    retroAudio.playUncheck()
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsOpen(false)
    router.replace('/login')
  }

  const handleLoginRedirect = () => {
    retroAudio.playCheck()
    setIsOpen(false)
    router.replace('/login')
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'K'
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Jugador Kumo'

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={handleToggleMenu}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#EAE2D8] hover:border-[#DFD5CA] hover:bg-[#FAF7F2] transition-all text-xs font-mono text-[#3D2E26] cursor-pointer shadow-xs group whitespace-nowrap"
        aria-label="Menú de perfil"
      >
        {/* Status Dot */}
        <div className="relative flex items-center justify-center">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              user ? 'bg-[#F28574] ring-2 ring-[#F28574]/20' : 'bg-[#DFD5CA]'
            }`}
          />
        </div>

        {/* User Icon/Avatar */}
        <div className="w-5 h-5 rounded-lg bg-[#FDF2ED] border border-[#F2C4AF] flex items-center justify-center text-[10px] font-bold text-[#C95D47] transition-colors">
          {userInitial}
        </div>

        {/* Display Label */}
        <span className="hidden sm:inline font-semibold tracking-wide text-[#3D2E26]">
          {loading ? 'CARGANDO...' : user ? displayName : 'INVITADO'}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-[#8C7A70] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-[#FFFFFF] border border-[#EAE2D8] shadow-[0_16px_50px_rgba(78,64,53,0.14)] p-4 z-[5001] text-xs font-sans text-[#3D2E26]"
          >
            {/* Header info */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#EAE2D8]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F28574]/20 to-[#EFA93A]/20 border border-[#F2C4AF] flex items-center justify-center text-sm font-bold text-[#C95D47] shadow-xs">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#3D2E26] truncate text-xs">{displayName}</p>
                <p className="text-[10px] text-[#8C7A70] truncate">{user?.email || 'No autenticado'}</p>
              </div>
            </div>

            {/* Stats Badge */}
            <div className="grid grid-cols-2 gap-2 mb-3 font-mono">
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] text-center">
                <span className="text-[9px] text-[#8C7A70] uppercase tracking-wider block font-bold">NIVEL</span>
                <span className="text-sm font-bold text-[#C95D47]">{level}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] text-center">
                <span className="text-[9px] text-[#8C7A70] uppercase tracking-wider block font-bold">XP TOTAL</span>
                <span className="text-sm font-bold text-[#EFA93A]">{xp} XP</span>
              </div>
            </div>

            {/* Connection Status */}
            <div className="mb-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8C7A70] flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-[#F28574]" />
                <span>Estado:</span>
              </span>
              <span className="font-bold text-[#C95D47]">
                {user ? 'EN LÍNEA' : 'DESCONECTADO'}
              </span>
            </div>

            {/* Install in Phone Option */}
            <div className="mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsOpen(false)
                  setShowInstallModal(true)
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EAE2D8] hover:bg-[#F2ECE4] hover:border-[#DFD5CA] text-[#3D2E26] font-medium transition-all cursor-pointer text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-[#F28574]" />
                  <span>Instalar en tu Celular</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-[#C95D47] bg-[#FDF2ED] px-1.5 py-0.5 rounded-md border border-[#F2C4AF]">APP</span>
              </button>
            </div>

            {/* Actions */}
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FFF0F3] border border-[#FFCCD5] hover:bg-[#FFE5EB] text-[#C93B58] font-bold transition-all cursor-pointer text-xs group"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>CERRAR SESIÓN</span>
              </button>
            ) : (
              <button
                onClick={handleLoginRedirect}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#F28574] to-[#E57865] hover:from-[#FA9585] hover:to-[#F28574] text-white font-bold shadow-[0_4px_14px_rgba(242,133,116,0.25)] transition-all cursor-pointer text-xs group"
              >
                <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                <span>INICIAR SESIÓN</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install App Modal — placed outside the dropdown so closing the dropdown doesn't unmount it */}
      <InstallAppModal
        isOpen={showInstallModal}
        onOpenChange={setShowInstallModal}
      />
    </div>
  )
}
