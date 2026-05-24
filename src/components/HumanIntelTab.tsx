import { useState } from 'react'
import { useHumanFactors } from '../hooks/useHumanFactors'
import { HumanFactorCard, TeamProfileCard } from './HumanFactors'
import type { Prediction } from '../lib/types'
import type { ImpactLevel } from '../lib/humanFactors.types'

interface HumanIntelTabProps {
  predictions: Prediction[]
}

const IMPACT_ORDER: ImpactLevel[] = ['critical', 'high', 'medium', 'low']

export function HumanIntelTab({ predictions }: HumanIntelTabProps) {
  const { factors, profiles, loading, lastUpdated, refresh } = useHumanFactors(predictions)
  const [view, setView] = useState<'feed' | 'teams'>('feed')
  const [filter, setFilter] = useState<string>('all')

  const sortedFactors = [...factors].sort((a, b) =>
    IMPACT_ORDER.indexOf(a.impact_level) - IMPACT_ORDER.indexOf(b.impact_level)
  )

  const filteredFactors = filter === 'all'
    ? sortedFactors
    : sortedFactors.filter(f => f.type === filter || f.impact_level === filter || f.team === filter)

  const criticalCount = factors.filter(f => f.impact_level === 'critical').length
  const valueBetCount = factors.filter(f => f.odds_shift_estimate !== 0).length
  const teamsMonitored = Object.keys(profiles).length

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Human Intelligence</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
              Player & coach factors affecting today's odds
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              background: 'var(--card)', border: '1px solid var(--border2)',
              color: loading ? 'var(--text3)' : 'var(--green)',
              padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            {loading ? '⏳ Scanning...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Live signal */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 8, fontSize: 11, color: 'var(--text3)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? 'var(--gold)' : 'var(--green)', display: 'inline-block', animation: 'live-pulse 1s infinite' }} />
          {loading ? 'Scanning Reddit + news feeds...' : lastUpdated
            ? `Last scanned: ${lastUpdated.toLocaleTimeString()}`
            : 'Tap refresh to scan live signals'}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '8px 16px 12px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: criticalCount > 0 ? 'var(--red)' : 'var(--text2)' }}>{criticalCount}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Critical</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>{valueBetCount}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Odds Shifts</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{teamsMonitored}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Teams</div>
        </div>
      </div>

      {/* What is this — education card */}
      <div style={{
        margin: '0 16px 14px',
        background: 'linear-gradient(135deg,#0d1020,#0a1428)',
        border: '1px solid #4facfe28', borderRadius: 12, padding: 14
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#4facfe' }}>
          🧠 Why Human Factors Matter
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          Bookmakers adjust odds <em>slowly</em> to human news. A player's personal issue, a coach press conference rant, or
          dressing-room conflict can shift real performance by 10–20% before the market reacts.
          We scan Reddit, social media and news feeds in real-time so you spot value bets before the odds move.
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, margin: '0 16px 14px' }}>
        {(['feed', 'teams'] as const).map(v => (
          <div key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: 9, textAlign: 'center', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: view === v ? 'var(--card)' : 'transparent',
            color: view === v ? 'var(--green)' : 'var(--text2)',
            transition: 'all 0.2s'
          }}>
            {v === 'feed' ? '📰 Signal Feed' : '🧬 Team Profiles'}
          </div>
        ))}
      </div>

      {/* Filter chips */}
      {view === 'feed' && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
          {['all', 'critical', 'high', 'injury', 'suspension', 'personal_life', 'coach_conflict', 'transfer_rumour'].map(f => (
            <div key={f} onClick={() => setFilter(f)} style={{
              flex: '0 0 auto', padding: '6px 14px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              border: '1px solid var(--border2)',
              background: filter === f ? 'var(--green)' : 'transparent',
              color: filter === f ? '#080b0e' : 'var(--text2)'
            }}>
              {f === 'all' ? 'All Signals' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Scanning Human Signals...</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Reading Reddit r/soccer, r/PremierLeague, r/football<br />
            and cross-referencing with today's match predictions
          </div>
        </div>
      ) : view === 'feed' ? (
        <div style={{ padding: '0 16px' }}>
          {filteredFactors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No critical signals detected</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                All today's teams appear stable. Refresh to scan for latest news.
              </div>
            </div>
          ) : (
            filteredFactors.map(f => <HumanFactorCard key={f.id} factor={f} />)
          )}

          {/* Value bet highlight */}
          {filteredFactors.some(f => f.odds_shift_estimate <= -0.10) && (
            <div style={{
              background: 'linear-gradient(135deg,#1a1500,#2a1f00)',
              border: '1px solid var(--gold)', borderRadius: 12, padding: 14, marginTop: 6, marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold)', marginBottom: 6 }}>
                💎 Potential Value Bet Detected
              </div>
              <div style={{ fontSize: 12, color: '#8a7a40', lineHeight: 1.6 }}>
                Human factors indicate the current odds may not fully reflect today's team situation.
                Check the Human-Adjusted confidence scores on the Predictions tab.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {Object.values(profiles).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)', fontSize: 13 }}>
              Tap Refresh to build team profiles
            </div>
          ) : (
            Object.values(profiles).map(p => <TeamProfileCard key={p.team} profile={p} />)
          )}
        </div>
      )}

      {/* Responsible disclaimer */}
      <div style={{ margin: '8px 16px', padding: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
          ⚠️ Human factor signals are auto-detected from public sources and may be unverified.
          Always cross-check before betting. Gamble responsibly.
        </div>
      </div>
    </div>
  )
}
