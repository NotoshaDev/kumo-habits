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
  sm: 'w-8 h-8 rounded',
  md: 'w-11 h-11 rounded-md',
  lg: 'w-14 h-14 rounded-lg',
}

export function PixelCheckbox({
  checked,
  onChange,
  color = '#10B981',
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
        'border-2 transition-colors duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[#08090C]',
        sizeMap[size],
        disabled && 'cursor-not-allowed opacity-40',
        !checked && 'bg-transparent border-[#1E2230] hover:border-[#2E3450]',
      )}
      style={
        checked
          ? {
              backgroundColor: `${color}22`,
              borderColor: color,
              boxShadow: `0 0 8px ${color}55, inset 0 0 8px ${color}15`,
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.88 } : {}}
      whileHover={!disabled ? { scale: 1.05 } : {}}
    >
      {/* Ripple burst on check */}
      <AnimatePresence>
        {checked && (
          <motion.span
            key="ripple"
            className="absolute inset-0 rounded-[inherit]"
            style={{ backgroundColor: color }}
            initial={{ opacity: 0.35, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Check icon */}
      <AnimatePresence>
        {checked && (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 15 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="relative z-10"
          >
            <Check
              size={size === 'sm' ? 14 : size === 'md' ? 18 : 22}
              strokeWidth={3}
              style={{ color }}
            />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pixel corner accents when checked */}
      {checked && (
        <>
          <span
            className="absolute top-0 left-0 w-1.5 h-1.5"
            style={{ backgroundColor: color, opacity: 0.7 }}
          />
          <span
            className="absolute top-0 right-0 w-1.5 h-1.5"
            style={{ backgroundColor: color, opacity: 0.7 }}
          />
          <span
            className="absolute bottom-0 left-0 w-1.5 h-1.5"
            style={{ backgroundColor: color, opacity: 0.7 }}
          />
          <span
            className="absolute bottom-0 right-0 w-1.5 h-1.5"
            style={{ backgroundColor: color, opacity: 0.7 }}
          />
        </>
      )}
    </motion.button>
  )
}
