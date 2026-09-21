'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PixelCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  color?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  'aria-label'?: string
}

const sizeMap = {
  sm: 'w-7 h-7 rounded-lg',
  md: 'w-9 h-9 rounded-xl',
  lg: 'w-11 h-11 rounded-2xl',
}

export function PixelCheckbox({
  checked,
  onChange,
  color = '#F28574',
  disabled = false,
  size = 'md',
  'aria-label': ariaLabel,
}: PixelCheckboxProps) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel ?? (checked ? 'Desmarcar hábito' : 'Marcar hábito')}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative flex items-center justify-center',
        'border transition-all duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28574]/40',
        sizeMap[size],
        disabled && 'cursor-not-allowed opacity-30 border-[#EAE2D8]',
        !checked && 'bg-[#FAF7F2] border-[#DFD5CA] hover:border-[#F28574] hover:bg-[#F5EFEB]',
      )}
      style={
        checked
          ? {
              backgroundColor: color,
              borderColor: color,
              boxShadow: `0 2px 8px ${color}40`,
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.9 } : {}}
      whileHover={!disabled ? { scale: 1.05 } : {}}
    >
      {/* Check icon */}
      <AnimatePresence>
        {checked && (
          <motion.span
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            className="relative z-10 text-white flex items-center justify-center"
          >
            <Check
              size={size === 'sm' ? 14 : size === 'md' ? 18 : 22}
              strokeWidth={3.5}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
