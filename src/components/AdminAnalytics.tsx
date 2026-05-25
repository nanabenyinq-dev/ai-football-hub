import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface DayStat {
  day: string
  event_name: string
  total: number
  unique_users: number
}
interface RevStat {
  day: string
  tier: string
  new_subs: number
  revenue_ghs: number
}
interface TopMetrics {
  total_users: number
  paying_users: number
  free_users: number
  total_revenue_ghs: number
  predictions_today: number
  bets_tracked: number
  ad_impressions_week: number
  conversion_rate: number
}

export function AdminAnalytics() {
  const [metrics, setMetrics]   = useState<TopMetrics | null>(null)
  const [events,  setEvents]    = useState<DayStat[]>([])
  const [revenue, setRevenue]   = useState<RevStat[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab,     setTab]       = useState<'overview'|'events'|'revenue'>('overview')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [
      { data: profiles },
      { data: subs },
      { data: predictions },
      { data: bets },
      { data: eventsData },
      { data: revenueData },
      { data: adImpressions },
    ] = await Promise.all([
      supabase.from('profiles').select('subscription_tier'),
      supabase.from('subscriptions').select('amount_ghs').eq('status', 'active'),
      supabase.from('predictions').select('id').eq('match_date', today),
      supabase.from('bet_entries').select('id'),
      supabase.from('analytics_summary').select('*').limit(50),
      supabase.from('revenue_summary').select('*').limit(30),
      supabase.from('ad_impressions').select('id').gte('created_at', new Date(Date.now()-7*864e5).toISOString()),
    ])

    const total   = profiles?.length ?? 0
    const paying  = profiles?.filter(p => p.subscription_tier !== 'free').length ?? 0
    const totalRev= subs?.reduce((s, r) => s + (r.amount_ghs || 0), 0) ?? 0

    setMetrics({
      total_users:       total,
      paying_users:      paying,
      free_users:        total - paying,
      total_revenue_ghs: totalRev,
      predictions_today: predictions?.length ?? 0,
      bets_tracked:      bets?.length ?? 0,
      ad_impressions_week: adImpressions?.length ?? 0,
      conversion_rate:   total > 0 ? parseFloat(((paying / total) * 100).toFixed(1)) : 0,
    })
    setEvents(eventsData as DayStat[] || [])
    setRevenue(revenueData as RevStat[] || [])
    setLoading(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }

  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)' }}>
      Loading analytics...
    </div>
  )

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>📊 Analytics Dashboard</div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {(['overview','events','revenue'] as const).map(t => (
          <div key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 4px', textAlign: 'center', borderRadius: 8,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: tab === t ? 'var(--card)' : 'transparent',
            color: tab === t ? 'var(--green)' : 'var(--text2)'
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
        ))}
      </div>

      {tab === 'overview' && metrics && (
        <>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              ['👥 Total Users',    metrics.total_users,       'var(--text)'],
              ['💳 Paying',         metrics.paying_users,      'var(--green)'],
              ['🆓 Free',           metrics.free_users,        'var(--text2)'],
              ['📈 Conv. Rate',     `${metrics.conversion_rate}%`, 'var(--gold)'],
              ['💰 Revenue (GHS)',  `${metrics.total_revenue_ghs.toFixed(0)}`, 'var(--green)'],
              ['⚽ Tips Today',     metrics.predictions_today, 'var(--blue)'],
              ['📋 Bets Tracked',   metrics.bets_tracked,      'var(--text)'],
              ['📢 Ad Impr/7d',     metrics.ad_impressions_week, 'var(--gold)'],
            ].map(([label, value, color]) => (
              <div key={label as string} style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: color as string }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{label as string}</div>
              </div>
            ))}
          </div>

          {/* Revenue bar */}
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>💰 Revenue Breakdown</div>
            {[
              { label: 'Premium subs',  pct: 60, color: 'var(--green)' },
              { label: 'VIP subs',      pct: 30, color: 'var(--gold)' },
              { label: 'Ad revenue',    pct: 10, color: '#4facfe' },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: r.color }}>{r.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Monetisation tips */}
          <div style={{ ...card, background: 'linear-gradient(135deg,#0f1e14,#0e1c1a)', border: '1px solid #00e87a28' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>💡 Monetisation Insights</div>
            {[
              `Conversion rate: ${metrics.conversion_rate}% — target is 5%+`,
              `${metrics.free_users} free users = ${metrics.free_users} upgrade opportunities`,
              `${metrics.ad_impressions_week} ad impressions this week (~GHS ${(metrics.ad_impressions_week * 0.002).toFixed(2)} at GHS 0.002/impression)`,
              'Add a 7-day free trial for VIP to boost conversions',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--text2)', padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
                <span>→</span>{tip}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'events' && (
        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
            Top Events (Last 30 Days)
          </div>
          {events.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>No events yet</div>
          ) : events.slice(0, 20).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{e.event_name}</div>
                <div style={{ color: 'var(--text3)', fontSize: 10 }}>{new Date(e.day).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--green)', fontWeight: 700 }}>{e.total} events</div>
                <div style={{ color: 'var(--text3)', fontSize: 10 }}>{e.unique_users} users</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'revenue' && (
        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>
            Revenue by Day
          </div>
          {revenue.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>No revenue yet</div>
          ) : revenue.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.tier} plan</div>
                <div style={{ color: 'var(--text3)', fontSize: 10 }}>{new Date(r.day).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--green)', fontWeight: 700 }}>GHS {Number(r.revenue_ghs).toFixed(2)}</div>
                <div style={{ color: 'var(--text3)', fontSize: 10 }}>{r.new_subs} new subs</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={fetchAll} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: 12, borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 14 }}>
        🔄 Refresh Analytics
      </button>
    </div>
  )
}
