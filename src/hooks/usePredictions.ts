import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Prediction } from '../lib/types'

// Demo predictions — replaced by real Supabase data once DB is seeded by ML script
const DEMO_PREDICTIONS: Prediction[] = [
  {
    id: '1', home_team: 'Arsenal', away_team: 'Man City',
    league: 'Premier League', league_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    match_date: new Date().toISOString().split('T')[0], match_time: '20:00',
    prediction_type: 'win_away', pick_label: 'Man City WIN',
    home_odds: 2.40, draw_odds: 3.20, away_odds: 2.10, best_odds: 2.10,
    confidence: 78, home_win_pct: 32, draw_pct: 24, away_win_pct: 44,
    btts_pct: 65, over25_pct: 72,
    analysis: 'Man City won 6 of their last 8 away games. Arsenal conceded in 4 of last 5 home fixtures. City xG advantage: 2.4 vs 1.6. H2H: City 4W, Arsenal 3W, 1D last 8 meetings.',
    is_vip: false, is_featured: true, source: 'ml_engine', result: 'pending',
    home_form: ['W','W','D','W','L'], away_form: ['W','W','W','D','W'],
    created_at: new Date().toISOString()
  },
  {
    id: '2', home_team: 'Real Madrid', away_team: 'Bayern Munich',
    league: 'Champions League', league_flag: '🏆',
    match_date: new Date().toISOString().split('T')[0], match_time: '21:00',
    prediction_type: 'btts', pick_label: 'BTTS — Yes',
    home_odds: 1.85, draw_odds: 3.75, away_odds: 3.20, best_odds: 1.72,
    confidence: 82, home_win_pct: 48, draw_pct: 18, away_win_pct: 34,
    btts_pct: 82, over25_pct: 78,
    analysis: 'BTTS in 7 of Real Madrid\'s last 8 UCL home games. Bayern averaging 2.8 goals per game in Europe. Both defenses have been vulnerable in recent knockout rounds.',
    is_vip: false, is_featured: true, source: 'ml_engine', result: 'pending',
    home_form: ['W','W','W','W','D'], away_form: ['W','D','W','L','W'],
    created_at: new Date().toISOString()
  },
  {
    id: '3', home_team: 'Dortmund', away_team: 'Leipzig',
    league: 'Bundesliga', league_flag: '🇩🇪',
    match_date: new Date().toISOString().split('T')[0], match_time: '18:30',
    prediction_type: 'over25', pick_label: 'Over 2.5 Goals',
    home_odds: 1.90, draw_odds: 3.40, away_odds: 2.80, best_odds: 1.62,
    confidence: 75, home_win_pct: 44, draw_pct: 24, away_win_pct: 32,
    btts_pct: 68, over25_pct: 75,
    analysis: 'Last 6 H2H averaged 4.1 goals. Both teams top-3 in Bundesliga shots on target. Over 2.5 landed in 5 of last 6 meetings between these sides.',
    is_vip: false, is_featured: false, source: 'ml_engine', result: 'pending',
    home_form: ['W','L','W','W','D'], away_form: ['W','W','D','W','L'],
    created_at: new Date().toISOString()
  },
  {
    id: '4', home_team: 'Chelsea', away_team: 'Liverpool',
    league: 'Premier League', league_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    match_date: new Date().toISOString().split('T')[0], match_time: '16:30',
    prediction_type: 'win_away', pick_label: 'Liverpool WIN',
    home_odds: 3.10, draw_odds: 3.40, away_odds: 2.20, best_odds: 2.20,
    confidence: 91, home_win_pct: 22, draw_pct: 26, away_win_pct: 52,
    btts_pct: 74, over25_pct: 68,
    analysis: 'Liverpool xG advantage in away games: highest in EPL at 2.4. Chelsea injury list weakens defensive line. Liverpool won last 4 away fixtures. Double chance value bet.',
    is_vip: true, is_featured: true, source: 'analyst_override', result: 'pending',
    home_form: ['L','W','D','L','W'], away_form: ['W','W','W','W','D'],
    created_at: new Date().toISOString()
  },
  {
    id: '5', home_team: 'PSG', away_team: 'Lyon',
    league: 'Ligue 1', league_flag: '🇫🇷',
    match_date: new Date().toISOString().split('T')[0], match_time: '20:45',
    prediction_type: 'win_home', pick_label: 'PSG WIN',
    home_odds: 1.45, draw_odds: 4.20, away_odds: 5.50, best_odds: 1.45,
    confidence: 88, home_win_pct: 72, draw_pct: 18, away_win_pct: 10,
    btts_pct: 55, over25_pct: 62,
    analysis: 'PSG unbeaten in last 12 home Ligue 1 games. Lyon\'s away form: 1W 4L in last 5. PSG have scored 2+ in each of last 8 home games.',
    is_vip: true, is_featured: false, source: 'ml_engine', result: 'pending',
    home_form: ['W','W','W','W','W'], away_form: ['L','D','L','W','L'],
    created_at: new Date().toISOString()
  }
]

export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_date', today)
        .order('is_featured', { ascending: false })
        .order('confidence', { ascending: false })

      if (error || !data || data.length === 0) {
        // Fallback to demo data if DB not seeded yet
        setPredictions(DEMO_PREDICTIONS)
      } else {
        setPredictions(data as Prediction[])
      }
    } catch {
      setPredictions(DEMO_PREDICTIONS)
      setError('Using demo data — connect Supabase to load live predictions')
    } finally {
      setLoading(false)
    }
  }

  return { predictions, loading, error, refetch: fetchPredictions }
}
