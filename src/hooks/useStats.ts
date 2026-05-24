import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { UserStats, BetEntry } from '../lib/types'
import { useAuth } from './useAuth'

const DEMO_STATS: UserStats = {
  total_bets: 25, won: 18, lost: 7, pending: 1,
  win_rate: 72, total_staked: 750, total_returns: 847.50,
  net_profit: 97.50, roi: 13.0, current_bankroll: 847.50, streak: 5
}

const DEMO_BETS: BetEntry[] = [
  { id:'1', user_id:'demo', match_label:'Man City WIN', bet_type:'1X2', odds:2.10, stake:30, potential_return:63, result:'won', profit_loss:33, created_at: new Date().toISOString() },
  { id:'2', user_id:'demo', match_label:'Liverpool BTTS', bet_type:'BTTS', odds:1.72, stake:25, potential_return:43, result:'won', profit_loss:18, created_at: new Date().toISOString() },
  { id:'3', user_id:'demo', match_label:'Chelsea WIN', bet_type:'1X2', odds:1.45, stake:40, potential_return:58, result:'lost', profit_loss:-40, created_at: new Date().toISOString() },
  { id:'4', user_id:'demo', match_label:'Real Madrid vs Bayern', bet_type:'Over 2.5', odds:1.62, stake:20, potential_return:32, result:'pending', profit_loss:0, created_at: new Date().toISOString() },
  { id:'5', user_id:'demo', match_label:'Dortmund Acca', bet_type:'Accumulator', odds:4.20, stake:15, potential_return:63, result:'won', profit_loss:48, created_at: new Date().toISOString() },
]

export function useStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>(DEMO_STATS)
  const [bets, setBets] = useState<BetEntry[]>(DEMO_BETS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: betsData } = await supabase
        .from('bet_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (betsData && betsData.length > 0) {
        const won = betsData.filter(b => b.result === 'won').length
        const lost = betsData.filter(b => b.result === 'lost').length
        const pending = betsData.filter(b => b.result === 'pending').length
        const totalStaked = betsData.reduce((s: number, b: BetEntry) => s + b.stake, 0)
        const totalReturns = betsData.filter(b => b.result === 'won').reduce((s: number, b: BetEntry) => s + b.potential_return, 0)
        const netProfit = totalReturns - totalStaked
        setBets(betsData as BetEntry[])
        setStats({
          total_bets: betsData.length, won, lost, pending,
          win_rate: betsData.length > 0 ? Math.round((won / (won + lost)) * 100) : 0,
          total_staked: totalStaked, total_returns: totalReturns, net_profit: netProfit,
          roi: totalStaked > 0 ? parseFloat(((netProfit / totalStaked) * 100).toFixed(1)) : 0,
          current_bankroll: totalReturns, streak: 5
        })
      }
    } catch { /* keep demo data */ }
    setLoading(false)
  }

  const addBet = async (bet: Omit<BetEntry, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return
    const { data, error } = await supabase.from('bet_entries').insert({
      ...bet, user_id: user.id, created_at: new Date().toISOString()
    }).select().single()
    if (!error && data) {
      setBets(prev => [data as BetEntry, ...prev])
      fetchStats()
    }
  }

  return { stats, bets, loading, addBet, refetch: fetchStats }
}
