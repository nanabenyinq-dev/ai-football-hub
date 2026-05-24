import type { HumanFactor, TeamHumanProfile } from '../lib/humanFactors.types'

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  injury:               { icon: '🤕', label: 'Injury Alert',       color: '#ff3b5c' },
  suspension:           { icon: '🟥', label: 'Suspension',         color: '#ff8c00' },
  personal_life:        { icon: '💔', label: 'Personal Matter',    color: '#a855f7' },
  coach_conflict:       { icon: '😤', label: 'Manager Tension',    color: '#ff3b5c' },
  transfer_rumour:      { icon: '🔄', label: 'Transfer Rumour',    color: '#f5c518' },
  form_slump:           { icon: '📉', label: 'Form Concern',       color: '#f5c518' },
  motivation:           { icon: '🧠', label: 'Motivation Question',color: '#f5c518' },
  social_media_sentiment:{ icon: '📱', label: 'Social Buzz',       color: '#4facfe' },
  press_conference:     { icon: '🎤', label: 'Press Conference',   color: '#4facfe' },
  weather:              { icon: '🌧', label: 'Weather Factor',     color: '#4facfe' },
  travel_fatigue:       { icon: '✈️', label: 'Travel Fatigue',     color: '#7a8fa8' },
  crowd_pressure:       { icon: '📣', label: 'Crowd Pressure',     color: '#7a8fa8' },
}

const IMPACT_COLORS: Record<string, string> = {
  critical: '#ff3b5c',
  high:     '#ff8c00',
  medium:   '#f5c518',
  low:      '#7a8fa8',
}

interface HumanFactorCardProps {
  factor: HumanFactor
}

export function HumanFactorCard({ factor }: HumanFactorCardProps) {
  const meta = TYPE_META[factor.type] || { icon: '⚡', label: 'Factor', color: '#7a8fa8' }
  const impactColor = IMPACT_COLORS[factor.impact_level]
  const timeAgo = getTimeAgo(factor.detected_at)
  const buzzWidth = Math.min(100, factor.social_buzz || 0)

  return (
    <div style={{
      background: 'var(--card)', border: `1px solid ${impactColor}28`,
      borderLeft: `3px solid ${impactColor}`,
      borderRadius: 12, padding: 14, marginBottom: 10
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: impactColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {meta.label} · {factor.impact_level.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>
              {factor.team}{factor.player_name ? ` · ${factor.player_name}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: factor.impact_direction === 'negative' ? 'var(--red-dim)' : '#00e87a15',
            color: factor.impact_direction === 'negative' ? 'var(--red)' : 'var(--green)'
          }}>
            {factor.impact_direction === 'negative' ? '▼ Weakens' : '▲ Strengthens'}
          </span>
          {factor.odds_shift_estimate !== 0 && (
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>
              ~{Math.abs(Math.round(factor.odds_shift_estimate * 100))}% confidence shift
            </span>
          )}
        </div>
      </div>

      {/* Headline */}
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>
        {factor.headline}
      </div>

      {/* Sentiment bar */}
      {factor.sentiment_score !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Sentiment</span>
          <div style={{ flex: 1, height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.abs(factor.sentiment_score) * 100}%`,
              marginLeft: factor.sentiment_score < 0 ? 0 : `${50 - Math.abs(factor.sentiment_score) * 50}%`,
              background: factor.sentiment_score >= 0 ? 'var(--green)' : 'var(--red)'
            }} />
          </div>
          <span style={{ fontSize: 10, color: factor.sentiment_score >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
            {factor.sentiment_score >= 0 ? '+' : ''}{(factor.sentiment_score * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Social buzz */}
      {(factor.social_buzz || 0) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>🔥 Buzz</span>
          <div style={{ flex: 1, height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${buzzWidth}%`, background: '#4facfe', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, color: '#4facfe', fontWeight: 700 }}>{factor.social_buzz}/100</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>
          {factor.verified ? '✅ Verified' : '🔄 Auto-detected'} · {factor.source} · {timeAgo}
        </span>
        {factor.source_url && (
          <a href={factor.source_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 10, color: 'var(--blue)', textDecoration: 'none' }}>
            Source →
          </a>
        )}
      </div>
    </div>
  )
}

interface TeamProfileCardProps {
  profile: TeamHumanProfile
}

export function TeamProfileCard({ profile }: TeamProfileCardProps) {
  const moraleColor = profile.morale_score >= 70 ? 'var(--green)'
    : profile.morale_score >= 50 ? 'var(--gold)' : 'var(--red)'

  const stabilityMeta: Record<string, { icon: string; color: string }> = {
    stable:    { icon: '✅', color: 'var(--green)' },
    unsettled: { icon: '⚠️', color: 'var(--gold)' },
    volatile:  { icon: '🔥', color: 'var(--red)' },
  }
  const s = stabilityMeta[profile.dressing_room_stability]

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 14, marginBottom: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{profile.team}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {profile.injury_count > 0 && (
            <span style={{ background: 'var(--red-dim)', color: 'var(--red)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              🤕 {profile.injury_count}
            </span>
          )}
          {profile.suspension_count > 0 && (
            <span style={{ background: '#ff8c0020', color: '#ff8c00', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              🟥 {profile.suspension_count}
            </span>
          )}
        </div>
      </div>

      {/* Morale bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text2)', width: 80 }}>Team Morale</span>
        <div style={{ flex: 1, height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${profile.morale_score}%`, background: moraleColor, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: moraleColor }}>{profile.morale_score}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg2)', color: s.color }}>
          {s.icon} {profile.dressing_room_stability}
        </span>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--text2)' }}>
          🎤 Manager: {profile.coach_confidence} conf.
        </span>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg2)', color: profile.overall_sentiment >= 0 ? 'var(--green)' : 'var(--red)' }}>
          📱 Sentiment: {profile.overall_sentiment >= 0 ? '+' : ''}{(profile.overall_sentiment * 100).toFixed(0)}%
        </span>
      </div>

      {profile.key_absentees.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
          ⚠️ Absent: {profile.key_absentees.join(', ')}
        </div>
      )}
    </div>
  )
}

interface HumanAdjustedBadgeProps {
  original: number
  adjusted: number
  valueBet: boolean
  reason: string
  edge: 'home' | 'away' | 'neutral'
  homeTeam: string
  awayTeam: string
}

export function HumanAdjustedBadge({
  original, adjusted, valueBet, reason, edge, homeTeam, awayTeam
}: HumanAdjustedBadgeProps) {
  const diff = adjusted - original
  const edgeTeam = edge === 'home' ? homeTeam : edge === 'away' ? awayTeam : null

  return (
    <div style={{
      background: valueBet ? 'linear-gradient(135deg,#1a1500,#2a1f00)' : 'var(--bg2)',
      border: `1px solid ${valueBet ? 'var(--gold)' : 'var(--border2)'}`,
      borderRadius: 10, padding: 12, marginTop: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>
          🧠 Human Intelligence Adjustment
        </span>
        {valueBet && (
          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'var(--gold)', color: '#080b0e' }}>
            💎 VALUE BET
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>ML Model</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text2)' }}>{original}%</div>
        </div>
        <div style={{ fontSize: 18, color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {diff >= 0 ? '→▲' : '→▼'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Adjusted</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {adjusted}%
          </div>
        </div>
        {diff !== 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: diff >= 0 ? 'var(--green)' : 'var(--red)', marginLeft: 4 }}>
            {diff >= 0 ? '+' : ''}{diff}%
          </span>
        )}
        {edgeTeam && (
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Human edge</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>{edgeTeam}</div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{reason}</div>
    </div>
  )
}

function getTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
