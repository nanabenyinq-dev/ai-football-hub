// Analytics — Plausible (free, privacy-first, no cookies)
// + custom Supabase event log for your own dashboard

import { useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number> }) => void
  }
}

// Load Plausible script once (free tier at plausible.io)
export function usePlausible() {
  useEffect(() => {
    const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN
    if (!domain || document.querySelector('[data-plausible]')) return
    const s = document.createElement('script')
    s.defer = true
    s.dataset.domain = domain
    s.dataset.plausible = 'true'
    s.src = 'https://plausible.io/js/script.js'
    document.head.appendChild(s)
  }, [])
}

// ── CUSTOM EVENT TRACKER ────────────────────────────────────────────────────
export type AnalyticsEvent =
  | 'page_view'
  | 'prediction_view'
  | 'vip_unlock_click'
  | 'subscribe_click'
  | 'subscribe_success'
  | 'bet_tracked'
  | 'calculator_used'
  | 'telegram_click'
  | 'affiliate_click'
  | 'ad_impression'
  | 'share_click'
  | 'login'
  | 'signup'
  | 'referral_share'

interface TrackProps {
  prediction_id?: string
  league?: string
  plan?: string
  calculator?: string
  affiliate?: string
  page?: string
  [key: string]: string | number | undefined
}

export function useAnalytics() {
  const { user } = useAuth()

  const track = useCallback(async (event: AnalyticsEvent, props?: TrackProps) => {
    // 1. Plausible (anonymous, GDPR-compliant)
    window.plausible?.(event, { props: props as Record<string, string | number> })

    // 2. Supabase analytics table (for your admin dashboard)
    try {
      await supabase.from('analytics_events').insert({
        event_name:  event,
        user_id:     user?.id ?? null,
        properties:  props ?? {},
        page_url:    window.location.pathname,
        user_agent:  navigator.userAgent.slice(0, 120),
        created_at:  new Date().toISOString(),
      })
    } catch { /* non-blocking */ }
  }, [user])

  return { track }
}

// ── ADSENSE HOOK ─────────────────────────────────────────────────────────────
export function useAdSense() {
  useEffect(() => {
    const clientId = import.meta.env.VITE_ADSENSE_CLIENT
    if (!clientId || document.querySelector('[data-adsense]')) return
    const s = document.createElement('script')
    s.async = true
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
    s.crossOrigin = 'anonymous'
    s.dataset.adsense = 'true'
    document.head.appendChild(s)
  }, [])

  const pushAd = useCallback(() => {
    try {
      // @ts-ignore
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch { /* ad blocked */ }
  }, [])

  return { pushAd }
}
