import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type PlanTier = 'premium' | 'vip'

const PLANS = {
  premium: { monthly: 4900, annual: 47000, label: 'Premium' },
  vip:     { monthly: 9900, annual: 95000, label: 'VIP' },
}

// Load Paystack inline script once
function loadPaystack(): Promise<void> {
  return new Promise(resolve => {
    if ((window as any).PaystackPop) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

export function usePaystack() {
  const { user } = useAuth()
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string

  const subscribe = useCallback(async (
    tier: PlanTier,
    period: 'monthly' | 'annual',
    onSuccess?: () => void
  ) => {
    if (!user) { alert('Please sign in first'); return }
    await loadPaystack()

    const amount = PLANS[tier][period]
    const label  = PLANS[tier].label
    const ref    = `AFH-${user.id.slice(0, 8)}-${Date.now()}`

    const handler = (window as any).PaystackPop.setup({
      key:       publicKey || 'pk_test_placeholder',
      email:     user.email,
      amount,                           // in kobo/pesewas
      currency:  'GHS',
      ref,
      metadata: {
        user_id:    user.id,
        tier,
        period,
        custom_fields: [
          { display_name: 'Plan',   variable_name: 'plan',   value: `${label} (${period})` },
          { display_name: 'App',    variable_name: 'app',    value: 'AI Football Hub' },
        ]
      },
      callback: async (response: { reference: string }) => {
        // Verify on our side — write to Supabase subscriptions table
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + (period === 'annual' ? 12 : 1))

        await supabase.from('subscriptions').upsert({
          user_id:        user.id,
          tier,
          status:         'active',
          amount_ghs:     amount / 100,
          payment_method: 'paystack',
          paystack_ref:   response.reference,
          started_at:     new Date().toISOString(),
          expires_at:     expiresAt.toISOString(),
        }, { onConflict: 'user_id' })

        await supabase.from('profiles')
          .update({
            subscription_tier:        tier,
            subscription_expires_at:  expiresAt.toISOString(),
          })
          .eq('id', user.id)

        onSuccess?.()
      },
      onClose: () => { /* user closed modal */ }
    })
    handler.openIframe()
  }, [user, publicKey])

  return { subscribe, plans: PLANS }
}
