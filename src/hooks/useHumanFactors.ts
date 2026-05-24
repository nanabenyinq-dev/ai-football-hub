import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  HumanFactor, TeamHumanProfile, HumanAdjustedPrediction
} from '../lib/humanFactors.types'
import type { Prediction } from '../lib/types'

// ── REDDIT FREE JSON SCRAPER (no API key, no signup) ──────────────────────────
// Reddit exposes .json on any public URL — completely free, no auth needed
const REDDIT_HEADERS = { 'User-Agent': 'AIFootballHub/1.0' }

const FOOTBALL_SUBREDDITS = [
  'soccer', 'PremierLeague', 'football',
  'ChampionsLeague', 'Bundesliga', 'LaLiga', 'seriea', 'Ligue1'
]

// Keywords that signal human factors
const INJURY_KEYWORDS = ['injured', 'injury', 'out', 'doubtful', 'ruled out', 'fitness', 'knocks', 'limped', 'hospital', 'scan', 'surgery']
const SUSPENSION_KEYWORDS = ['suspended', 'red card', 'ban', 'banned', 'disciplinary', 'sent off']
const PERSONAL_KEYWORDS = ['divorce', 'baby', 'birth', 'family', 'personal', 'tragedy', 'bereavement', 'arrested', 'father', 'mother']
const MOTIVATION_KEYWORDS = ['dropped', 'benched', 'upset', 'angry', 'wants to leave', 'transfer request', 'unhappy', 'contract', 'argument', 'fight']
const COACH_KEYWORDS = ['sacked', 'fired', 'resigned', 'under pressure', 'press conference', 'slammed', 'criticized', 'confident']
const FORM_KEYWORDS = ['struggling', 'slump', 'form', 'poor', 'missing', 'clinical', 'exceptional', 'on fire', 'hat trick']
const POSITIVE_WORDS = ['confident', 'fit', 'sharp', 'motivated', 'brilliant', 'exceptional', 'clinical', 'ready', 'happy', 'scored', 'assist', 'unstoppable']
const NEGATIVE_WORDS = ['injured', 'suspended', 'doubt', 'miss', 'out', 'struggling', 'poor', 'sacked', 'crisis', 'disaster', 'banned', 'arrested', 'unhappy']

function classifyFactor(title: string): {
  type: HumanFactor['type']
  impact: HumanFactor['impact_level']
  direction: HumanFactor['impact_direction']
  oddsShift: number
} {
  const t = title.toLowerCase()
  if (INJURY_KEYWORDS.some(k => t.includes(k)))
    return { type: 'injury', impact: 'critical', direction: 'negative', oddsShift: -0.18 }
  if (SUSPENSION_KEYWORDS.some(k => t.includes(k)))
    return { type: 'suspension', impact: 'high', direction: 'negative', oddsShift: -0.12 }
  if (PERSONAL_KEYWORDS.some(k => t.includes(k)))
    return { type: 'personal_life', impact: 'medium', direction: 'negative', oddsShift: -0.08 }
  if (MOTIVATION_KEYWORDS.some(k => t.includes(k)))
    return { type: 'transfer_rumour', impact: 'medium', direction: 'negative', oddsShift: -0.07 }
  if (COACH_KEYWORDS.some(k => t.includes(k)))
    return { type: 'coach_conflict', impact: 'high', direction: 'negative', oddsShift: -0.10 }
  return { type: 'form_slump', impact: 'low', direction: 'neutral', oddsShift: 0 }
}

function scoreSentiment(text: string): number {
  const t = text.toLowerCase()
  let pos = 0, neg = 0
  POSITIVE_WORDS.forEach(w => { if (t.includes(w)) pos++ })
  NEGATIVE_WORDS.forEach(w => { if (t.includes(w)) neg++ })
  const total = pos + neg
  if (total === 0) return 0
  return parseFloat(((pos - neg) / total).toFixed(2))
}

function extractTeamFromTitle(title: string, knownTeams: string[]): string | null {
  const t = title.toLowerCase()
  return knownTeams.find(team => t.includes(team.toLowerCase())) || null
}

function extractPlayerFromTitle(title: string): string | null {
  // Look for capitalized names (rough heuristic — two consecutive capitalized words)
  const match = title.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/)
  return match ? match[1] : null
}

// ── MAIN HOOK ─────────────────────────────────────────────────────────────────
export function useHumanFactors(predictions: Prediction[]) {
  const [factors, setFactors] = useState<HumanFactor[]>([])
  const [profiles, setProfiles] = useState<Record<string, TeamHumanProfile>>({})
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // All unique teams in today's predictions
  const teams = [...new Set(predictions.flatMap(p => [p.home_team, p.away_team]))]

  const fetchFromReddit = useCallback(async (): Promise<HumanFactor[]> => {
    const allFactors: HumanFactor[] = []

    for (const sub of FOOTBALL_SUBREDDITS.slice(0, 4)) { // cap at 4 to avoid rate limits
      try {
        const res = await fetch(
          `https://www.reddit.com/r/${sub}/new.json?limit=50`,
          { headers: REDDIT_HEADERS }
        )
        if (!res.ok) continue
        const data = await res.json()
        const posts = data?.data?.children || []

        for (const { data: post } of posts) {
          const title: string = post.title || ''
          const team = extractTeamFromTitle(title, teams)
          if (!team) continue // only care about posts about today's teams

          const isHumanFactor =
            [...INJURY_KEYWORDS, ...SUSPENSION_KEYWORDS, ...PERSONAL_KEYWORDS,
             ...MOTIVATION_KEYWORDS, ...COACH_KEYWORDS, ...FORM_KEYWORDS]
            .some(k => title.toLowerCase().includes(k))

          if (!isHumanFactor) continue

          const classification = classifyFactor(title)
          const sentiment = scoreSentiment(title + ' ' + (post.selftext || ''))
          const player = extractPlayerFromTitle(title)
          const matchIds = predictions
            .filter(p => p.home_team === team || p.away_team === team)
            .map(p => p.id)

          allFactors.push({
            id: post.id,
            player_name: player || undefined,
            team,
            type: classification.type,
            headline: title.length > 100 ? title.substring(0, 97) + '...' : title,
            detail: post.selftext?.substring(0, 200) || 'See Reddit for full details.',
            impact_level: classification.impact,
            impact_direction: classification.direction,
            odds_shift_estimate: classification.oddsShift,
            source: `r/${sub}`,
            source_url: `https://reddit.com${post.permalink}`,
            verified: false,
            detected_at: new Date(post.created_utc * 1000).toISOString(),
            match_ids: matchIds,
            sentiment_score: sentiment,
            social_buzz: Math.min(100, Math.round((post.score || 0) / 5))
          })
        }
      } catch {
        // Reddit rate-limited or down — silently continue
        continue
      }
    }
    return allFactors
  }, [teams.join(',')])

  const buildProfiles = useCallback((rawFactors: HumanFactor[]): Record<string, TeamHumanProfile> => {
    const result: Record<string, TeamHumanProfile> = {}
    for (const team of teams) {
      const teamFactors = rawFactors.filter(f => f.team === team)
      const sentiments = teamFactors.map(f => f.sentiment_score ?? 0)
      const avgSentiment = sentiments.length
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : 0

      const injuries = teamFactors.filter(f => f.type === 'injury')
      const suspensions = teamFactors.filter(f => f.type === 'suspension')
      const absentees = teamFactors
        .filter(f => f.player_name && (f.type === 'injury' || f.type === 'suspension'))
        .map(f => f.player_name!)

      const negativeFactors = teamFactors.filter(f => f.impact_direction === 'negative').length
      const morale = Math.max(0, Math.min(100, 70 - negativeFactors * 8 + avgSentiment * 15))

      let stability: TeamHumanProfile['dressing_room_stability'] = 'stable'
      if (negativeFactors >= 4) stability = 'volatile'
      else if (negativeFactors >= 2) stability = 'unsettled'

      let coachConfidence: TeamHumanProfile['coach_confidence'] = 'high'
      const coachFactors = teamFactors.filter(f => f.type === 'coach_conflict')
      if (coachFactors.length >= 2) coachConfidence = 'low'
      else if (coachFactors.length === 1) coachConfidence = 'medium'

      result[team] = {
        team,
        overall_sentiment: parseFloat(avgSentiment.toFixed(2)),
        morale_score: Math.round(morale),
        injury_count: injuries.length,
        suspension_count: suspensions.length,
        key_absentees: [...new Set(absentees)],
        dressing_room_stability: stability,
        coach_confidence: coachConfidence,
        factors: teamFactors,
        last_updated: new Date().toISOString()
      }
    }
    return result
  }, [teams.join(',')])

  const applyHumanAdjustment = useCallback((
    prediction: Prediction,
    homeProfile: TeamHumanProfile | undefined,
    awayProfile: TeamHumanProfile | undefined
  ): HumanAdjustedPrediction => {
    const homeShift = (homeProfile?.factors || [])
      .reduce((sum, f) => sum + f.odds_shift_estimate, 0)
    const awayShift = (awayProfile?.factors || [])
      .reduce((sum, f) => sum + f.odds_shift_estimate, 0)

    const relativeShift = awayShift - homeShift // negative = home disadvantaged
    const adjusted = Math.max(30, Math.min(95,
      prediction.confidence + Math.round(relativeShift * 100)
    ))

    const reasons: string[] = []
    if ((homeProfile?.injury_count || 0) > 0)
      reasons.push(`${homeProfile!.team}: ${homeProfile!.injury_count} injury concern(s)`)
    if ((awayProfile?.injury_count || 0) > 0)
      reasons.push(`${awayProfile!.team}: ${awayProfile!.injury_count} injury concern(s)`)
    if (homeProfile?.dressing_room_stability === 'volatile')
      reasons.push(`${homeProfile.team}: dressing room unsettled`)
    if (homeProfile?.coach_confidence === 'low')
      reasons.push(`${homeProfile.team} manager under pressure`)

    // Value bet: if human factors significantly differ from model confidence
    const valueBet = Math.abs(adjusted - prediction.confidence) >= 10
    const valueBetReason = valueBet
      ? `Human factors shift confidence ${adjusted > prediction.confidence ? 'up' : 'down'} by ${Math.abs(adjusted - prediction.confidence)}% vs base model`
      : undefined

    return {
      original_confidence: prediction.confidence,
      adjusted_confidence: adjusted,
      adjustment_reason: reasons.length ? reasons.join(' · ') : 'No significant human factors detected',
      home_human_score: Math.round((homeProfile?.morale_score || 70)),
      away_human_score: Math.round((awayProfile?.morale_score || 70)),
      value_bet_flag: valueBet,
      value_bet_reason: valueBetReason,
      human_edge: homeShift < awayShift ? 'home'
        : homeShift > awayShift ? 'away' : 'neutral'
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Try Supabase first (admin-entered verified factors)
      const today = new Date().toISOString().split('T')[0]
      const { data: dbFactors } = await supabase
        .from('human_factors')
        .select('*')
        .gte('detected_at', today)
        .order('impact_level', { ascending: false })

      // 2. Scrape Reddit for live signals
      const redditFactors = await fetchFromReddit()

      // 3. Merge — verified DB factors take precedence
      const combined: HumanFactor[] = [
        ...(dbFactors as HumanFactor[] || []),
        ...redditFactors.filter(rf =>
          !(dbFactors || []).some((df: HumanFactor) => df.team === rf.team && df.type === rf.type)
        )
      ]

      setFactors(combined)
      setProfiles(buildProfiles(combined))
      setLastUpdated(new Date())
    } catch {
      // Fallback: just use Reddit data
      const redditFactors = await fetchFromReddit()
      setFactors(redditFactors)
      setProfiles(buildProfiles(redditFactors))
      setLastUpdated(new Date())
    }
    setLoading(false)
  }, [fetchFromReddit, buildProfiles])

  useEffect(() => {
    if (teams.length > 0) refresh()
  }, [predictions.length])

  return { factors, profiles, loading, lastUpdated, refresh, applyHumanAdjustment }
}
