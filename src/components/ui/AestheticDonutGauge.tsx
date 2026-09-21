'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface AestheticDonutGaugeProps {
  /** Percentage value (0 - 100) */
  percentage: number
  /** Optional custom center label instead of `{percentage}%` */
  centerLabel?: string
  /** Sublabel displayed under percentage, e.g. "65 / 65 completed" */
  sublabel?: string
  /** Diameter of the gauge in px (default: 130) */
  size?: number
  /** Thickness of the progress stroke in px (default: 14) */
  strokeWidth?: number
  /** Primary accent color (default: #10B981) */
  color?: string
  /** Track background color (default: #141722) */
  trackColor?: string
  /** Optional container className */
  className?: string
}

export function AestheticDonutGauge({
  percentage,
  centerLabel,
  sublabel,
  size = 130,
  strokeWidth = 14,
  color = '#F28574',
  trackColor = '#F2ECE4',
  className = '',
}: AestheticDonutGaugeProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="rotate-[-90deg] overflow-visible"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="transition-colors"
        />

        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            filter: `drop-shadow(0 0 6px ${color}33)`,
          }}
        />
      </svg>

      {/* Center Percentage & Info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
        <motion.span
          key={clamped}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="font-mono font-black text-[#3D2E26] leading-none tracking-tight"
          style={{ fontSize: Math.max(13, size * 0.22) }}
        >
          {centerLabel ?? `${clamped}%`}
        </motion.span>

        {sublabel && (
          <span
            className="text-[#8C7A70] font-mono tracking-tight font-medium mt-1 leading-tight line-clamp-2 px-1"
            style={{ fontSize: Math.max(9, size * 0.085) }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
