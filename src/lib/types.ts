export type SubscriptionTier = 'free' | 'premium' | 'vip'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  subscription_tier: SubscriptionTier
  subscription_expires_at?: string
  streak_days: number
  xp_points: number
  level: number
  referral_code: string
  created_at: string
}

export interface Prediction {
  id: string
  home_team: string
  away_team: string
  league: string
  league_flag: string
  match_date: string
  match_time: string
  prediction_type: 'win_home' | 'win_away' | 'draw' | 'btts' | 'over25' | 'under25'
  pick_label: string
  home_odds: number
  draw_odds: number
  away_odds: number
  best_odds: number
  confidence: number
  home_win_pct: number
  draw_pct: number
  away_win_pct: number
  btts_pct: number
  over25_pct: number
  analysis: string
  is_vip: boolean
  is_featured: boolean
  source: 'ml_engine' | 'analyst_override' | 'api'
  result?: 'won' | 'lost' | 'pending' | 'void'
  home_form: string[]
  away_form: string[]
  created_at: string
}

export interface BetEntry {
  id: string
  user_id: string
  match_label: string
  bet_type: string
  odds: number
  stake: number
  potential_return: number
  result: 'won' | 'lost' | 'pending' | 'void'
  profit_loss: number
  created_at: string
}

export interface UserStats {
  total_bets: number
  won: number
  lost: number
  pending: number
  win_rate: number
  total_staked: number
  total_returns: number
  net_profit: number
  roi: number
  current_bankroll: number
  streak: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  points: number
  win_rate: number
  is_current_user: boolean
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  status: 'pending' | 'converted'
  reward_amount: number
  created_at: string
}
