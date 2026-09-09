'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, LogIn, Shield, Wifi, WifiOff, Sparkles, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { retroAudio } from '@/lib/sound-effects'
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
  const menuRef = useRef<HTMLDivElement>(null)

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref')

  useEffect(() => {
    if (isMock) {
      setLoading(false)
      return
    }

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
  }, [isMock])

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
    if (!isMock) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    setIsOpen(false)
    router.push('/login')
  }

  const handleLoginRedirect = () => {
    retroAudio.playCheck()
    setIsOpen(false)
    router.push('/login')
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'G'
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Gamer Pixel'

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={handleToggleMenu}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10121A] border border-[#1E2230] hover:border-[#3B82F6]/50 hover:bg-[#161926] transition-all text-xs font-mono text-slate-200 cursor-pointer shadow-sm group whitespace-nowrap"
        aria-label="Menú de perfil"
      >
        {/* Status Dot */}
        <div className="relative flex items-center justify-center">
          <span
            className={`w-2 h-2 rounded-full ${
              !isMock && user ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
            }`}
          />
        </div>

        {/* User Icon/Avatar */}
        <div className="w-5 h-5 rounded bg-[#1E2230] border border-[#2E3448] flex items-center justify-center text-[10px] font-bold text-[#10B981] group-hover:text-[#38BDF8] transition-colors">
          {userInitial}
        </div>

        {/* Display Label */}
        <span className="hidden sm:inline font-semibold tracking-wider text-slate-300">
          {loading ? 'CARGANDO...' : !isMock && user ? displayName : 'MODO DEMO'}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-xl border border-[#262B3D] shadow-[0_20px_60px_rgba(0,0,0,0.98)] p-4 z-[5001] text-xs font-mono"
            style={{ backgroundColor: '#0D0F17' }}
          >
            {/* Header info */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#1E2230]">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#10B981]/20 to-[#3B82F6]/20 border border-[#10B981]/40 flex items-center justify-center text-sm font-bold text-[#10B981] shadow-inner">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-100 truncate text-xs">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Jugador Invitado (Demo)'}</p>
              </div>
            </div>

            {/* Stats Badge */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded-md bg-[#141724] border border-[#1E2230] text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">NIVEL</span>
                <span className="text-sm font-bold text-[#10B981]">{level}</span>
              </div>
              <div className="p-2 rounded-md bg-[#141724] border border-[#1E2230] text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">XP TOTAL</span>
                <span className="text-sm font-bold text-[#38BDF8]">{xp} XP</span>
              </div>
            </div>

            {/* Connection Status */}
            <div className="mb-3 p-2 rounded-lg bg-[#10131F] border border-[#1E2230] flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                {!isMock && user ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Supabase Sync:</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estado:</span>
                  </>
                )}
              </span>
              <span className={`font-bold ${!isMock && user ? 'text-emerald-400' : 'text-amber-400'}`}>
                {!isMock && user ? 'ACTIVO' : 'MODO DEMO'}
              </span>
            </div>

            {/* Actions */}
            {!isMock && user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 text-rose-300 font-bold transition-all cursor-pointer text-xs group"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>CERRAR SESIÓN</span>
              </button>
            ) : (
              <button
                onClick={handleLoginRedirect}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#34D399] hover:to-[#10B981] text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer text-xs group"
              >
                <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                <span>CONECTAR CUENTA / LOGIN</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
