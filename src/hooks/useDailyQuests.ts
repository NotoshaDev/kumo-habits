'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTodayString } from '@/lib/date-utils'
import { retroAudio } from '@/lib/sound-effects'
import { createClient } from '@/lib/supabase/client'

export interface DailyQuest {
  id: string
  title: string
  completed: boolean
  date: string
  createdAt: string
}

const STORAGE_KEY_PREFIX = 'kumo_daily_quests_'

export const QUEST_XP_EVENT = 'kumo-quests-updated'

/**
 * Reads the total XP gained from completed quests on a specific date directly from localStorage
 */
export function getStoredDailyQuestXP(dateStr?: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const target = dateStr ?? getTodayString()
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${target}`)
    if (!raw) return 0
    const list: DailyQuest[] = JSON.parse(raw)
    const completed = list.filter((q) => q.completed).length
    return completed * 20
  } catch {
    return 0
  }
}

export function useDailyQuests(dateStr?: string) {
  const targetDate = dateStr ?? getTodayString()
  const [quests, setQuests] = useState<DailyQuest[]>([])
  const [loaded, setLoaded] = useState(false)

  const reloadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const key = `${STORAGE_KEY_PREFIX}${targetDate}`
      const raw = localStorage.getItem(key)
      if (raw) {
        setQuests(JSON.parse(raw))
      } else {
        if (targetDate === getTodayString()) {
          const initial: DailyQuest[] = [
            {
              id: 'init-1',
              title: '¡Completa todos tus hábitos de hoy!',
              completed: false,
              date: targetDate,
              createdAt: new Date().toISOString(),
            },
          ]
          setQuests(initial)
          localStorage.setItem(key, JSON.stringify(initial))
        } else {
          setQuests([])
        }
      }
    } catch {
      setQuests([])
    } finally {
      setLoaded(true)
    }
  }, [targetDate])

  // Load quests from localStorage first, then sync with Supabase in background
  useEffect(() => {
    reloadFromStorage()

    let isMounted = true
    const syncFromCloud = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || !isMounted) return

        const [yStr, mStr] = targetDate.split('-')
        const year = parseInt(yStr, 10)
        const month = parseInt(mStr, 10)
        const prefix = `[QUEST:${targetDate}]`

        const { data: cloudGoals, error } = await (supabase as any)
          .from('monthly_goals')
          .select('*')
          .eq('year', year)
          .eq('month', month)
          .like('title', `${prefix}%`)

        if (error || !cloudGoals || !isMounted) return

        if (cloudGoals.length > 0) {
          const cloudQuests: DailyQuest[] = cloudGoals.map((cg: any) => ({
            id: cg.id,
            title: cg.title.replace(`${prefix} `, '').replace(prefix, '').trim(),
            completed: Boolean(cg.completed),
            date: targetDate,
            createdAt: cg.created_at,
          }))

          setQuests((current) => {
            const mergedMap = new Map<string, DailyQuest>()
            cloudQuests.forEach((cq) => mergedMap.set(cq.title.toLowerCase(), cq))
            current.forEach((lq) => {
              if (!mergedMap.has(lq.title.toLowerCase())) {
                mergedMap.set(lq.title.toLowerCase(), lq)
              }
            })
            const merged = Array.from(mergedMap.values())
            try {
              localStorage.setItem(`${STORAGE_KEY_PREFIX}${targetDate}`, JSON.stringify(merged))
              const completed = merged.filter((q) => q.completed).length
              window.dispatchEvent(
                new CustomEvent(QUEST_XP_EVENT, {
                  detail: { date: targetDate, questXP: completed * 20 },
                }),
              )
            } catch {}
            return merged
          })
        }
      } catch (err) {
        // Offline or network failure gracefully falls back to local storage
      }
    }

    syncFromCloud()

    const handleExternalUpdate = () => {
      reloadFromStorage()
    }
    window.addEventListener(QUEST_XP_EVENT, handleExternalUpdate)
    window.addEventListener('storage', handleExternalUpdate)

    return () => {
      isMounted = false
      window.removeEventListener(QUEST_XP_EVENT, handleExternalUpdate)
      window.removeEventListener('storage', handleExternalUpdate)
    }
  }, [targetDate, reloadFromStorage])

  // Save changes and notify other listeners
  const saveQuests = useCallback(
    (newQuests: DailyQuest[]) => {
      setQuests(newQuests)
      if (typeof window !== 'undefined') {
        try {
          const key = `${STORAGE_KEY_PREFIX}${targetDate}`
          localStorage.setItem(key, JSON.stringify(newQuests))
          const completed = newQuests.filter((q) => q.completed).length
          const currentQuestXP = completed * 20
          window.dispatchEvent(
            new CustomEvent(QUEST_XP_EVENT, {
              detail: { date: targetDate, questXP: currentQuestXP },
            }),
          )
        } catch {}
      }
    },
    [targetDate],
  )

  const addQuest = useCallback(
    (title: string) => {
      if (!title.trim()) return
      const cleanTitle = title.trim()
      const tempId = `quest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const newQuest: DailyQuest = {
        id: tempId,
        title: cleanTitle,
        completed: false,
        date: targetDate,
        createdAt: new Date().toISOString(),
      }
      const updated = [...quests, newQuest]
      saveQuests(updated)
      retroAudio.playCheck()

      // Background cloud sync
      try {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            const [yStr, mStr] = targetDate.split('-')
            ;(supabase as any)
              .from('monthly_goals')
              .insert({
                user_id: user.id,
                year: parseInt(yStr, 10),
                month: parseInt(mStr, 10),
                title: `[QUEST:${targetDate}] ${cleanTitle}`,
                completed: false,
              })
              .select('id')
              .single()
              .then(({ data }: any) => {
                if (data?.id) {
                  setQuests((prev) => {
                    const withCloudId = prev.map((q) => (q.id === tempId ? { ...q, id: data.id } : q))
                    try {
                      localStorage.setItem(`${STORAGE_KEY_PREFIX}${targetDate}`, JSON.stringify(withCloudId))
                    } catch {}
                    return withCloudId
                  })
                }
              })
          }
        })
      } catch {}
    },
    [quests, targetDate, saveQuests],
  )

  const toggleQuest = useCallback(
    (id: string) => {
      let targetCompletedState: boolean | null = null

      const updated = quests.map((q) => {
        if (q.id === id) {
          const nextCompleted = !q.completed
          targetCompletedState = nextCompleted
          if (nextCompleted) {
            retroAudio.playCheck()
          } else {
            retroAudio.playUncheck()
          }
          return { ...q, completed: nextCompleted }
        }
        return q
      })
      saveQuests(updated)

      // Background cloud sync (if synced to Supabase UUID)
      if (targetCompletedState !== null && !id.startsWith('quest-') && !id.startsWith('init-')) {
        try {
          const supabase = createClient()
          ;(supabase as any)
            .from('monthly_goals')
            .update({ completed: targetCompletedState })
            .eq('id', id)
            .then(() => {})
        } catch {}
      }
    },
    [quests, saveQuests],
  )

  const deleteQuest = useCallback(
    (id: string) => {
      const updated = quests.filter((q) => q.id !== id)
      saveQuests(updated)
      retroAudio.playUncheck()

      // Background cloud sync
      if (!id.startsWith('quest-') && !id.startsWith('init-')) {
        try {
          const supabase = createClient()
          ;(supabase as any).from('monthly_goals').delete().eq('id', id).then(() => {})
        } catch {}
      }
    },
    [quests, saveQuests],
  )

  const completedCount = quests.filter((q) => q.completed).length
  const totalCount = quests.length
  const questXP = completedCount * 20 // 20 XP per quest

  return {
    quests,
    loaded,
    addQuest,
    toggleQuest,
    deleteQuest,
    completedCount,
    totalCount,
    questXP,
  }
}
