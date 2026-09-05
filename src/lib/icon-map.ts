// Icon registry — maps icon_key strings to Lucide React components
// Add new icons here as the habit library grows.

import {
  Star,
  Brain,
  Dumbbell,
  BookOpen,
  Code2,
  Droplets,
  PenLine,
  Heart,
  Moon,
  Sun,
  Coffee,
  Music,
  Bike,
  Apple,
  DollarSign,
  Target,
  Flame,
  Zap,
  Wind,
  Leaf,
  type LucideIcon,
} from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  brain: Brain,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  code: Code2,
  droplets: Droplets,
  'pen-line': PenLine,
  heart: Heart,
  moon: Moon,
  sun: Sun,
  coffee: Coffee,
  music: Music,
  bike: Bike,
  apple: Apple,
  dollar: DollarSign,
  target: Target,
  flame: Flame,
  zap: Zap,
  wind: Wind,
  leaf: Leaf,
}

export const ICON_KEYS = Object.keys(ICON_MAP)
