import { useEffect, useRef } from 'react'
import { useAdSense } from '../hooks/useAnalytics'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

type AdFormat = 'banner' | 'rectangle' | 'anchor' | 'feed'

interface AdSlotProps {
  format: AdFormat
  slotId?: string
  className?: string
}

const AD_SIZES: Record<AdFormat, { width: string; height: string; label: string }> = {
  banner:    { width: '320px', height: '100px', label: '320×100 · Large Mobile Banner' },
  rectangle: { width: '300px', height: '250px', label: '300×250 · Medium Rectangle (best CTR)' },
  anchor:    { width: '320px', height: '50px',  label: '320×50 · Mobile Anchor' },
  feed:      { width: '100%',  height: '100px', label: 'Responsive Feed Ad' },
}

export function AdSlot({ format, slotId, className = '' }: AdSlotProps) {
  const { pushAd } = useAdSense()
  const ref = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const pushed = useRef(false)

  // Don't show ads to paying subscribers
  const [isPaid, setIsPaid] = React.useState(false)

  useEffect(() => {
    supabase.from('profiles').select('subscription_tier').eq('id', user?.id ?? '').single()
      .then(({ data }) => {
        if (data?.subscription_tier === 'premium' || data?.subscription_tier === 'vip') {
          setIsPaid(true)
        }
      })
  }, [user])

  useEffect(() => {
    if (isPaid || pushed.current) return
    if (!import.meta.env.VITE_ADSENSE_CLIENT) return
    pushed.current = true
    pushAd()
  }, [isPaid, pushAd])

  if (isPaid) return null

  const size = AD_SIZES[format]
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT

  if (!clientId) {
    // Dev placeholder
    return (
      <div
        className={className}
        style={{
          width: size.width, height: size.height,
          background: 'var(--card)', border: '1px dashed #ffffff12',
          borderRadius: 12, display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 16px 14px',
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>
          📢 Google AdSense · {size.label}
        </span>
      </div>
    )
  }

  return (
    <div ref={ref} className={className} style={{ margin: '0 16px 14px', overflow: 'hidden' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: size.width, height: size.height }}
        data-ad-client={clientId}
        data-ad-slot={slotId ?? ''}
        data-ad-format={format === 'feed' ? 'fluid' : 'fixed'}
        data-full-width-responsive={format === 'feed' ? 'true' : 'false'}
      />
    </div>
  )
}

// Named import fix
import React from 'react'
