// Human Intelligence types
export type HumanFactorType =
  | 'injury'
  | 'suspension'
  | 'personal_life'
  | 'coach_conflict'
  | 'transfer_rumour'
  | 'form_slump'
  | 'motivation'
  | 'weather'
  | 'travel_fatigue'
  | 'crowd_pressure'
  | 'social_media_sentiment'
  | 'press_conference'

export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low'
export type ImpactDirection = 'negative' | 'positive' | 'neutral'

export interface HumanFactor {
  id: string
  player_name?: string
  team: string
  type: HumanFactorType
  headline: string
  detail: string
  impact_level: ImpactLevel
  impact_direction: ImpactDirection
  odds_shift_estimate: number   // e.g. -0.15 means confidence drops 15%
  source: string
  source_url?: string
  verified: boolean
  detected_at: string
  match_ids: string[]           // which upcoming matches this affects
  sentiment_score?: number      // -1 to +1
  social_buzz?: number          // 0–100 trending score
}

export interface TeamHumanProfile {
  team: string
  overall_sentiment: number     // -1 to +1
  morale_score: number          // 0–100
  injury_count: number
  suspension_count: number
  key_absentees: string[]
  dressing_room_stability: 'stable' | 'unsettled' | 'volatile'
  coach_confidence: 'high' | 'medium' | 'low'
  factors: HumanFactor[]
  last_updated: string
}

export interface HumanAdjustedPrediction {
  original_confidence: number
  adjusted_confidence: number
  adjustment_reason: string
  home_human_score: number
  away_human_score: number
  value_bet_flag: boolean
  value_bet_reason?: string
  human_edge: 'home' | 'away' | 'neutral'
}
