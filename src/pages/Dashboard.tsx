import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePredictions } from '../hooks/usePredictions'
import { useStats } from '../hooks/useStats'
import { useHumanFactors } from '../hooks/useHumanFactors'
import { usePaystack } from '../hooks/usePaystack'
import { useAnalytics } from '../hooks/useAnalytics'
import { HumanAdjustedBadge } from '../components/HumanFactors'
import { HumanIntelTab } from '../components/HumanIntelTab'
import { AdSlot } from '../components/AdSlot'
import { AdminAnalytics } from '../components/AdminAnalytics'

type Tab = 'home' | 'predictions' | 'intel' | 'tools' | 'tracker' | 'profile'
type PlanPeriod = 'mo' | 'yr'

const TOOLS = [
  { id:'stake',  icon:'🎯', name:'Stake Calc',   desc:'Kelly Criterion' },
  { id:'acca',   icon:'📈', name:'Acca Builder', desc:'Multi-bet returns' },
  { id:'profit', icon:'💰', name:'Profit Calc',  desc:'Expected return' },
  { id:'roi',    icon:'📊', name:'ROI Tracker',  desc:'Performance stats' },
]

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { predictions, loading: predLoading } = usePredictions()
  const { stats, bets } = useStats()
  const { factors, profiles, applyHumanAdjustment } = useHumanFactors(predictions)
  const { subscribe } = usePaystack()
  const { track } = useAnalytics()

  const [tab, setTab]           = useState<Tab>('home')
  const [predFilter, setFilter] = useState('All')
  const [activeTool, setTool]   = useState('stake')
  const [timer, setTimer]       = useState('')
  const [period, setPeriod]     = useState<PlanPeriod>('mo')
  const [subSuccess, setSubSuccess] = useState(false)
  const [isAdmin, setIsAdmin]   = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  // Calc states
  const [br, setBr]   = useState(500);  const [rsk, setRsk] = useState(5);   const [od, setOd]   = useState(2.10)
  const [acOds, setAcOds] = useState([1.85,2.10,1.72]); const [acSt, setAcSt] = useState(20)
  const [prSt, setPrSt]   = useState(50);  const [prOd, setPrOd] = useState(2.40)
  const [riSt, setRiSt]   = useState(200); const [riRt, setRiRt] = useState(260)

  // Countdown
  useEffect(() => {
    const tick = () => {
      const now = new Date(), end = new Date()
      end.setHours(23,59,59,0)
      const d = end.getTime() - now.getTime()
      setTimer(`${String(Math.floor(d/3600000)).padStart(2,'0')}:${String(Math.floor((d%3600000)/60000)).padStart(2,'0')}:${String(Math.floor((d%60000)/1000)).padStart(2,'0')}`)
    }
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id)
  }, [])

  // Check admin
  useEffect(() => {
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',')
    if (user?.email && adminEmails.includes(user.email)) setIsAdmin(true)
  }, [user])

  // Track tab switches
  const switchTab = useCallback((t: Tab) => {
    setTab(t)
    track('page_view', { page: t })
    window.scrollTo(0, 0)
  }, [track])

  const userName    = user?.user_metadata?.full_name?.split(' ')[0] || 'Champ'
  const freePreds   = predictions.filter(p => !p.is_vip)
  const vipPreds    = predictions.filter(p => p.is_vip)
  const criticals   = factors.filter(f => f.impact_level === 'critical').length
  const valueBets   = freePreds.filter(p => {
    const adj = applyHumanAdjustment(p, profiles[p.home_team], profiles[p.away_team])
    return adj.value_bet_flag
  }).length

  // Calc helpers
  const cs = () => { const s=br*(rsk/100); return { stake:s.toFixed(2), profit:(s*(od-1)).toFixed(2) } }
  const ca = () => { const c=acOds.reduce((a,b)=>a*b,1); const r=c*acSt; return { comb:c.toFixed(2), ret:r.toFixed(2), profit:(r-acSt).toFixed(2) } }
  const cp = () => { const r=prSt*prOd; return { ret:r.toFixed(2), profit:(r-prSt).toFixed(2) } }
  const cr = () => { const roi=((riRt-riSt)/riSt)*100; return { roi:roi.toFixed(1), net:(riRt-riSt).toFixed(2), color:roi>=0?'var(--green)':'var(--red)' } }
  const c=cs(); const ac=ca(); const pr=cp(); const ro=cr()

  // Inline style helpers
  const card   = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:14 } as const
  const chip   = (a:boolean) => ({ flex:'0 0 auto', padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' as const, border:'1px solid var(--border2)', background:a?'var(--green)':'transparent', color:a?'#080b0e':'var(--text2)' })

  const handleSubscribe = async (tier: 'premium'|'vip') => {
    track('subscribe_click', { plan: tier, period })
    await subscribe(tier, period === 'mo' ? 'monthly' : 'annual', () => {
      track('subscribe_success', { plan: tier, period })
      setSubSuccess(true)
      setTimeout(() => setSubSuccess(false), 4000)
    })
  }

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', maxWidth:420, margin:'0 auto', position:'relative' }}>

      {/* SUCCESS TOAST */}
      {subSuccess && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background:'var(--green)', color:'#080b0e', padding:'12px 24px', borderRadius:12, fontWeight:800, fontSize:14, zIndex:999, boxShadow:'0 4px 24px #00e87a40' }}>
          ✅ Welcome to VIP! Enjoy your premium picks.
        </div>
      )}

      {/* STREAK BAR */}
      <div style={{ background:'linear-gradient(90deg,#0d1a10,#0e1a18)', borderBottom:'1px solid #00e87a20', padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20, animation:'pulse-fire 1.5s ease-in-out infinite' }}>🔥</span>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--green)', lineHeight:1 }}>{stats.streak}</div>
          <div style={{ fontSize:10, color:'var(--text3)' }}>day streak</div>
        </div>
        <div style={{ flex:1, height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden', margin:'0 8px' }}>
          <div style={{ height:'100%', width:'68%', background:'linear-gradient(90deg,var(--green),#00ffaa)', borderRadius:3 }} />
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <div style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>Lv.7</div>
          {criticals > 0 && (
            <div onClick={() => switchTab('intel')} style={{ background:'var(--red-dim)', border:'1px solid var(--red)', color:'var(--red)', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, cursor:'pointer', animation:'badge-pop 2s infinite' }}>
              🧠 {criticals}
            </div>
          )}
          {valueBets > 0 && (
            <div onClick={() => switchTab('predictions')} style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, cursor:'pointer' }}>
              💎 {valueBets}
            </div>
          )}
        </div>
      </div>

      {/* LIVE ODDS TICKER */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', overflow:'hidden', height:28, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', animation:'ticker 25s linear infinite', whiteSpace:'nowrap' }}>
          {['Arsenal 2.40','Man City 2.10','Real Madrid 1.85','BTTS YES 1.72','Over 2.5 1.62','Liverpool 2.20','PSG 1.45','Dortmund 1.90',
            'Arsenal 2.40','Man City 2.10','Real Madrid 1.85','BTTS YES 1.72'].map((t,i) => (
            <span key={i} style={{ fontSize:11, padding:'0 18px', color:'var(--text2)', display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ color:'var(--green)' }}>▲</span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>

        {/* ── HOME ── */}
        {tab==='home' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--green)', fontWeight:600, marginBottom:3 }}>
                📅 {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </div>
              <div style={{ fontSize:22, fontWeight:800 }}>Good evening, {userName} 👋</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginTop:3 }}>
                {predictions.length} predictions ready · {vipPreds.length} VIP locked
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
              {[['73%','Win Rate','var(--green)'],['8','Today','var(--gold)'],[`🔥${stats.streak}`,'Streak','var(--green)']].map(([v,l,c])=>(
                <div key={l as string} style={{ ...card, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:c as string }}>{v}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{l as string}</div>
                </div>
              ))}
            </div>

            {/* Human Intel alert */}
            {criticals > 0 && (
              <div onClick={() => switchTab('intel')} style={{ background:'linear-gradient(135deg,#1a0808,#2a0d0d)', border:'1px solid var(--red)', borderRadius:12, padding:14, marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>🧠</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>{criticals} Critical Alert{criticals>1?'s':''}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>Player/coach signals affect today's odds</div>
                </div>
                <span style={{ color:'var(--red)', fontSize:16 }}>›</span>
              </div>
            )}

            {/* Value bet alert */}
            {valueBets > 0 && (
              <div onClick={() => switchTab('predictions')} style={{ background:'linear-gradient(135deg,#1a1500,#2a1f00)', border:'1px solid var(--gold)', borderRadius:12, padding:14, marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>💎</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>{valueBets} Value Bet{valueBets>1?'s':''} Detected</div>
                  <div style={{ fontSize:11, color:'#8a7a40', marginTop:2 }}>Human factors diverge from base model — odds mispriced</div>
                </div>
                <span style={{ color:'var(--gold)', fontSize:16 }}>›</span>
              </div>
            )}

            {/* AdSense — above fold, highest CTR */}
            <AdSlot format="banner" slotId={import.meta.env.VITE_ADSENSE_SLOT_BANNER} />

            {/* Telegram CTA */}
            <div style={{ background:'linear-gradient(135deg,#0d1020,#0a1428)', border:'1px solid #4facfe28', borderRadius:14, padding:14, marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:26 }}>✈️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>Join Telegram VIP</div>
                <div style={{ fontSize:11, color:'var(--text2)' }}>Daily picks · 1-tap bet alerts · 3,400 members</div>
              </div>
              <button onClick={()=>{ track('telegram_click'); window.open(import.meta.env.VITE_TELEGRAM_LINK||'https://t.me','_blank') }} style={{ background:'#229ED9', color:'#fff', border:'none', padding:'9px 13px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>Join →</button>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:15, fontWeight:700 }}>🔥 Hot Picks Today</span>
              <span onClick={()=>switchTab('predictions')} style={{ fontSize:12, color:'var(--green)', cursor:'pointer' }}>See all →</span>
            </div>

            {predLoading ? (
              <div style={{ textAlign:'center', padding:20, color:'var(--text2)' }}>Loading predictions...</div>
            ) : freePreds.slice(0,2).map(p => {
              const adj = applyHumanAdjustment(p, profiles[p.home_team], profiles[p.away_team])
              return (
                <div key={p.id} onClick={()=>{ track('prediction_view',{league:p.league,prediction_id:p.id}); switchTab('predictions') }}
                  style={{ ...card, marginBottom:10, borderLeft:'3px solid var(--green)', cursor:'pointer', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:'-100%', width:'60%', height:'100%', background:'linear-gradient(90deg,transparent,#00e87a06,transparent)', animation:'shimmer 3s ease-in-out infinite', pointerEvents:'none' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:10, color:'var(--text3)' }}>{p.league_flag} {p.league}</span>
                    <span style={{ fontSize:11, color:'var(--green)', background:'var(--green-dim)', padding:'3px 9px', borderRadius:20, fontWeight:600 }}>{p.match_time}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{p.home_team}</div>
                      <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:4 }}>
                        {(p.home_form||[]).slice(0,5).map((f,i)=>(<div key={i} style={{ width:8, height:8, borderRadius:'50%', background:f==='W'?'var(--green)':f==='D'?'var(--text3)':'var(--red)' }}/>))}
                      </div>
                    </div>
                    <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, alignSelf:'center' }}>VS</div>
                    <div style={{ textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{p.away_team}</div>
                      <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:4 }}>
                        {(p.away_form||[]).slice(0,5).map((f,i)=>(<div key={i} style={{ width:8, height:8, borderRadius:'50%', background:f==='W'?'var(--green)':f==='D'?'var(--text3)':'var(--red)' }}/>))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                    {[[p.home_team,p.home_odds],[`Draw`,p.draw_odds],[p.away_team,p.away_odds]].map(([lbl,val],i)=>{
                      const picked = (i===0&&p.prediction_type.includes('home'))||(i===2&&p.prediction_type.includes('away'))||(i===1&&p.prediction_type==='draw')
                      return (
                        <div key={i} style={{ flex:1, background:picked?'var(--green-dim)':'var(--bg2)', border:`1px solid ${picked?'var(--green)':'var(--border2)'}`, borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                          <div style={{ fontSize:9, color:'var(--text3)' }}>{lbl as string}</div>
                          <div style={{ fontSize:15, fontWeight:800, color:picked?'var(--green)':'var(--text)' }}>{Number(val).toFixed(2)}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:10, color:'var(--text2)' }}>AI+Human</span>
                    <div style={{ flex:1, height:5, background:'var(--border2)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${adj.adjusted_confidence}%`, background:adj.adjusted_confidence>=75?'var(--green)':adj.adjusted_confidence>=60?'var(--gold)':'var(--red)', borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:adj.adjusted_confidence>=75?'var(--green)':'var(--gold)' }}>{adj.adjusted_confidence}%</span>
                    {adj.value_bet_flag && <span style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>💎 VALUE</span>}
                  </div>
                </div>
              )
            })}

            {/* AdSense — mid feed rectangle (best performing) */}
            <AdSlot format="rectangle" slotId={import.meta.env.VITE_ADSENSE_SLOT_RECT} />

            {/* VIP lock */}
            {vipPreds.length > 0 && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, marginTop:4 }}>
                  <span style={{ fontSize:15, fontWeight:700 }}>⭐ VIP Picks</span>
                  <span style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:10, padding:'2px 8px', borderRadius:20 }}>PREMIUM</span>
                </div>
                <div style={{ ...card, marginBottom:14, border:'1px solid #f5c51825', position:'relative', overflow:'hidden' }}>
                  <div style={{ filter:'blur(5px)', pointerEvents:'none', userSelect:'none' }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Chelsea vs Liverpool · 91% conf</div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>Liverpool WIN · Analyst override · {vipPreds.length} VIP picks today</div>
                  </div>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#08090aee,#0e0d0aee)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ fontSize:26 }}>🔒</span>
                    <span style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{vipPreds.length} VIP PICKS LOCKED</span>
                    <span style={{ fontSize:11, color:'var(--text2)', textAlign:'center', padding:'0 24px' }}>85–94% confidence · Expert analyst overrides</span>
                    <button onClick={()=>{ track('vip_unlock_click'); switchTab('profile') }}
                      style={{ background:'var(--gold)', color:'#080b0e', border:'none', padding:'10px 28px', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer' }}>
                      Unlock VIP — GHS 99/mo
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Daily Challenge */}
            <div style={{ background:'linear-gradient(135deg,#150d20,#1a0d28)', border:'1px solid #a855f730', borderRadius:14, padding:16, marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'var(--purple)' }}>⚡ Daily Challenge</span>
                <span style={{ fontSize:13, fontWeight:800, color:'var(--gold)', fontFamily:'monospace' }}>{timer}</span>
              </div>
              <div style={{ fontSize:13, marginBottom:8, lineHeight:1.5 }}>Predict the correct scoreline for today's featured match. Earn double XP!</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginBottom:8 }}>Reward: <span style={{ color:'var(--gold)', fontWeight:700 }}>+200 XP</span> · <span style={{ color:'var(--gold)', fontWeight:700 }}>🏅 Scorer Badge</span></div>
              <div style={{ height:8, background:'var(--bg3)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:'40%', background:'linear-gradient(90deg,var(--purple),#d946ef)', borderRadius:4 }}/>
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{ ...card, marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>🏆 Top Tipsters This Week</div>
              {[['🥇','Kwame A.','340 pts',true],['🥈','Seun E.','298 pts',false],['🥉','Ama B.','275 pts',false],['👤','You','189 pts',true]].map(([medal,name,pts,highlight])=>(
                <div key={name as string} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', background:name==='You'?'var(--green-dim)':undefined }}>
                  <span style={{ fontSize:16, width:24 }}>{medal}</span>
                  <span style={{ flex:1, fontSize:13, fontWeight:name==='You'?700:400 }}>{name as string}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'var(--green)' }}>{pts as string}</span>
                </div>
              ))}
            </div>

            {/* Affiliate CTA */}
            <div onClick={()=>track('affiliate_click',{affiliate:'sportybet'})} style={{ background:'linear-gradient(135deg,#120d00,#1e1500)', border:'1px solid #f5c51828', borderRadius:14, padding:14, display:'flex', alignItems:'center', gap:12, marginBottom:14, cursor:'pointer' }}>
              <span style={{ fontSize:28 }}>🎰</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>Sportybet 200% Bonus</div>
                <div style={{ fontSize:11, color:'#8a7a40' }}>Ghana users · Min deposit GHS 10</div>
              </div>
              <button style={{ background:'var(--gold)', color:'#080b0e', border:'none', padding:'9px 14px', borderRadius:9, fontSize:12, fontWeight:800, cursor:'pointer' }}>Claim →</button>
            </div>

            {/* Bottom anchor ad */}
            <AdSlot format="anchor" slotId={import.meta.env.VITE_ADSENSE_SLOT_ANCHOR} />

            <div style={{ textAlign:'center', fontSize:10, color:'var(--text3)', lineHeight:1.6, paddingBottom:8 }}>
              <span style={{ border:'1px solid var(--text3)', padding:'2px 6px', borderRadius:3, fontWeight:700 }}>18+</span> Predictions are for informational purposes only. Gamble responsibly.
            </div>
          </div>
        )}

        {/* ── PREDICTIONS ── */}
        {tab==='predictions' && (
          <div>
            <div style={{ padding:'14px 16px 4px' }}>
              <div style={{ fontSize:22, fontWeight:800 }}>Today's Predictions</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginTop:3 }}>{predictions.length} tips · AI + Human Intelligence</div>
            </div>
            <div style={{ display:'flex', gap:7, overflowX:'auto', padding:'8px 16px', scrollbarWidth:'none' }}>
              {['All','1X2','BTTS','Over/Under','EPL','UCL','La Liga','Bundesliga'].map(f=>(
                <div key={f} style={chip(predFilter===f)} onClick={()=>setFilter(f)}>{f}</div>
              ))}
            </div>
            <AdSlot format="anchor" slotId={import.meta.env.VITE_ADSENSE_SLOT_ANCHOR} />
            <div style={{ padding:'0 16px' }}>
              {freePreds.map(p => {
                const adj = applyHumanAdjustment(p, profiles[p.home_team], profiles[p.away_team])
                return (
                  <div key={p.id} style={{ ...card, marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'var(--green-dim)', color:'var(--green)' }}>{p.pick_label}</span>
                      <span style={{ fontSize:10, color:'var(--text3)' }}>🧠 AI+Human · {p.source}</span>
                    </div>
                    <div style={{ textAlign:'center', padding:'10px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:10 }}>
                      <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{p.home_team} vs {p.away_team}</div>
                      <div style={{ fontSize:11, color:'var(--text2)' }}>{p.league_flag} {p.league} · {p.match_time}</div>
                    </div>
                    <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:10 }}>{p.analysis}</p>
                    {[['Win prob.',adj.adjusted_confidence],['BTTS',p.btts_pct],['Over 2.5',p.over25_pct]].map(([lbl,val])=>(
                      <div key={lbl as string} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:11, color:'var(--text2)', width:72 }}>{lbl as string}</span>
                        <div style={{ flex:1, height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${val}%`, background:(val as number)>=70?'var(--green)':(val as number)>=50?'var(--gold)':'var(--red)', borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:(val as number)>=70?'var(--green)':(val as number)>=50?'var(--gold)':'var(--red)', minWidth:34, textAlign:'right' }}>{val}%</span>
                      </div>
                    ))}
                    <HumanAdjustedBadge original={p.confidence} adjusted={adj.adjusted_confidence} valueBet={adj.value_bet_flag} reason={adj.adjustment_reason} edge={adj.human_edge} homeTeam={p.home_team} awayTeam={p.away_team} />
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <div style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:10, padding:8, textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text3)' }}>Best Odds</div>
                        <div style={{ fontSize:16, fontWeight:800, color:'var(--green)' }}>{p.best_odds}</div>
                      </div>
                      <button onClick={()=>track('affiliate_click',{affiliate:'bet',prediction_id:p.id})} style={{ flex:2, background:'var(--green)', color:'#080b0e', border:'none', padding:10, borderRadius:10, fontWeight:800, fontSize:13, cursor:'pointer' }}>BET NOW →</button>
                    </div>
                  </div>
                )
              })}
              <AdSlot format="rectangle" slotId={import.meta.env.VITE_ADSENSE_SLOT_RECT} />
              {/* VIP LOCKED */}
              {vipPreds.length > 0 && (
                <div style={{ position:'relative', marginBottom:16 }}>
                  <div style={{ ...card, filter:'blur(4px)', pointerEvents:'none', userSelect:'none', border:'1px solid #f5c51822' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>Chelsea vs Liverpool · VIP</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:6 }}>91% confidence · Analyst Override · Expert analysis</div>
                  </div>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#08090aee,#0e0d0aee)', borderRadius:14 }}>
                    <span style={{ fontSize:26 }}>🔒</span>
                    <span style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{vipPreds.length} VIP PICKS LOCKED</span>
                    <button onClick={()=>{ track('vip_unlock_click'); switchTab('profile') }} style={{ background:'var(--gold)', color:'#080b0e', border:'none', padding:'10px 28px', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer' }}>
                      Unlock → GHS 99/mo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HUMAN INTEL ── */}
        {tab==='intel' && <HumanIntelTab predictions={predictions} />}

        {/* ── TOOLS ── */}
        {tab==='tools' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:14 }}>Betting Tools</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {TOOLS.map(t=>(
                <div key={t.id} onClick={()=>{ setTool(t.id); track('calculator_used',{calculator:t.id}) }} style={{ ...card, cursor:'pointer', border:`1px solid ${activeTool===t.id?'var(--green)':'var(--border)'}`, background:activeTool===t.id?'var(--green-dim)':'var(--card)' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{t.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'var(--text2)' }}>{t.desc}</div>
                </div>
              ))}
            </div>
            {/* Stake */}
            {activeTool==='stake' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>🎯 Stake Calculator</div>
                {[['Bankroll (GHS)',br,(v:number)=>setBr(v)],['Risk % (2–5% recommended)',rsk,(v:number)=>setRsk(v)],['Odds',od,(v:number)=>setOd(v)]].map(([l,v,s])=>(
                  <div key={l as string} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>{l as string}</div>
                    <input type="number" value={v as number} onChange={e=>(s as Function)(parseFloat(e.target.value)||0)} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:12, borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }} />
                  </div>
                ))}
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Recommended Stake</div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--green)', fontFamily:'monospace' }}>GHS {c.stake}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Potential profit: GHS {c.profit} · Risk: {rsk}% of bankroll</div>
                </div>
              </div>
            )}
            {/* Acca */}
            {activeTool==='acca' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>📈 Accumulator Builder</div>
                {acOds.map((o,i)=>(
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>Leg {i+1} Odds</div>
                    <input type="number" value={o} onChange={e=>{const n=[...acOds];n[i]=parseFloat(e.target.value)||1;setAcOds(n)}} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:12, borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }} />
                  </div>
                ))}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>Stake (GHS)</div>
                  <input type="number" value={acSt} onChange={e=>setAcSt(parseFloat(e.target.value)||0)} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:12, borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }} />
                </div>
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Potential Return</div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--green)', fontFamily:'monospace' }}>GHS {ac.ret}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Combined odds: {ac.comb} · Profit: GHS {ac.profit}</div>
                </div>
              </div>
            )}
            {/* Profit */}
            {activeTool==='profit' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>💰 Profit Calculator</div>
                {[['Stake (GHS)',prSt,(v:number)=>setPrSt(v)],['Odds',prOd,(v:number)=>setPrOd(v)]].map(([l,v,s])=>(
                  <div key={l as string} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>{l as string}</div>
                    <input type="number" value={v as number} onChange={e=>(s as Function)(parseFloat(e.target.value)||0)} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:12, borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }} />
                  </div>
                ))}
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Potential Profit</div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--green)', fontFamily:'monospace' }}>GHS {pr.profit}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Total return: GHS {pr.ret}</div>
                </div>
              </div>
            )}
            {/* ROI */}
            {activeTool==='roi' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>📊 ROI Calculator</div>
                {[['Total Staked (GHS)',riSt,(v:number)=>setRiSt(v)],['Total Returns (GHS)',riRt,(v:number)=>setRiRt(v)]].map(([l,v,s])=>(
                  <div key={l as string} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>{l as string}</div>
                    <input type="number" value={v as number} onChange={e=>(s as Function)(parseFloat(e.target.value)||0)} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:12, borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }} />
                  </div>
                ))}
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>ROI</div>
                  <div style={{ fontSize:32, fontWeight:900, fontFamily:'monospace', color:ro.color }}>{parseFloat(ro.roi)>=0?'+':''}{ro.roi}%</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Net: GHS {ro.net} · {parseFloat(ro.roi)>20?'Excellent':parseFloat(ro.roi)>0?'Profitable':'Below breakeven'}</div>
                </div>
              </div>
            )}
            <div style={{ ...card, textAlign:'center', marginTop:8 }}>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>⚠️ Responsible Gambling</div>
              <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>Max 5% stake per bet. Set daily limits. Betting is entertainment, not income.</div>
            </div>
          </div>
        )}

        {/* ── TRACKER ── */}
        {tab==='tracker' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:14 }}>Bet Tracker</div>
            <div style={{ background:'linear-gradient(135deg,#0a1610,#0c1814)', border:'1px solid #00e87a25', borderRadius:16, padding:20, textAlign:'center', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}>Current Bankroll</div>
              <div style={{ fontSize:44, fontWeight:900, color:'var(--green)', fontFamily:'monospace', lineHeight:1 }}>GHS {stats.current_bankroll.toFixed(2)}</div>
              <div style={{ fontSize:13, color:'var(--green)', marginTop:6 }}>📈 +GHS {stats.net_profit.toFixed(2)} ({stats.roi > 0 ? '+' : ''}{stats.roi}%) this month</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
              {[[stats.won,'Won','var(--green)'],[stats.lost,'Lost','var(--red)'],[`${stats.win_rate}%`,'Win Rate','var(--gold)']].map(([v,l,c])=>(
                <div key={l as string} style={{ ...card, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:c as string }}>{v}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{l as string}</div>
                </div>
              ))}
            </div>
            <AdSlot format="anchor" slotId={import.meta.env.VITE_ADSENSE_SLOT_ANCHOR} />
            <div style={{ ...card, overflow:'hidden', padding:0 }}>
              <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700, display:'flex', justifyContent:'space-between' }}>
                <span>Recent Bets</span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>{bets.length} total</span>
              </div>
              {bets.slice(0,8).map(b=>(
                <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{b.match_label}</div>
                    <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{b.bet_type} · {b.odds} · GHS {b.stake}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:800, fontFamily:'monospace', color:b.result==='won'?'var(--green)':b.result==='lost'?'var(--red)':'var(--blue)' }}>
                      {b.result==='won'?`+GHS ${b.profit_loss}`:b.result==='lost'?`-GHS ${Math.abs(b.stake)}`:'Pending'}
                    </div>
                    <div style={{ fontSize:10, padding:'2px 8px', borderRadius:20, marginTop:2, display:'inline-block', background:b.result==='won'?'var(--green-dim)':b.result==='lost'?'var(--red-dim)':'var(--blue-dim)', color:b.result==='won'?'var(--green)':b.result==='lost'?'var(--red)':'var(--blue)' }}>
                      {b.result.toUpperCase()} {b.result==='won'?'✓':b.result==='lost'?'✗':'⏳'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROFILE / SUBSCRIPTIONS ── */}
        {tab==='profile' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ ...card, textAlign:'center', marginBottom:14 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,var(--green),#00a855)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#080b0e', margin:'0 auto 12px' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize:20, fontWeight:800 }}>{userName}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{user?.email}</div>
              <div style={{ display:'inline-flex', gap:6, background:'var(--border2)', padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, marginTop:10 }}>
                ⚽ FREE PLAN
              </div>
            </div>

            {/* Plan toggle */}
            <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Choose Your Plan</div>
            <div style={{ display:'flex', background:'var(--bg2)', borderRadius:10, padding:4, marginBottom:16 }}>
              {(['mo','yr'] as PlanPeriod[]).map(p=>(
                <div key={p} onClick={()=>setPeriod(p)} style={{ flex:1, padding:10, textAlign:'center', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', background:period===p?'var(--card)':'transparent', color:period===p?'var(--green)':'var(--text2)' }}>
                  {p==='mo'?'Monthly':'Annual '}{p==='yr'&&<span style={{ fontSize:11, color:'var(--green)' }}>Save 20%</span>}
                </div>
              ))}
            </div>

            {/* Free plan */}
            <div style={{ ...card, marginBottom:12 }}>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Free</div>
              <div style={{ fontSize:32, fontWeight:900, fontFamily:'monospace', marginBottom:4 }}>GHS 0</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>Forever free</div>
              {['3 free predictions/day','All betting tools','Bet tracker'].map(f=>(<div key={f} style={{ fontSize:13, display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)' }}><span style={{ color:'var(--green)', fontWeight:700 }}>✓</span>{f}</div>))}
              {['VIP predictions','Telegram VIP','No ads'].map(f=>(<div key={f} style={{ fontSize:13, display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)', color:'var(--text3)' }}><span>✗</span>{f}</div>))}
              <button style={{ width:'100%', background:'transparent', border:'1px solid var(--border2)', color:'var(--text2)', padding:14, borderRadius:12, fontWeight:700, fontSize:14, cursor:'default', marginTop:12 }}>Current Plan</button>
            </div>

            {/* Premium plan */}
            <div style={{ ...card, marginBottom:12, border:'1px solid #00e87a40', background:'linear-gradient(135deg,#0f1e14,#0e1c1a)', position:'relative' }}>
              <div style={{ position:'absolute', top:-11, right:16, background:'var(--green)', color:'#080b0e', fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:20 }}>BEST VALUE</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--green)', marginBottom:4 }}>Premium</div>
              <div style={{ fontSize:32, fontWeight:900, fontFamily:'monospace', color:'var(--green)', marginBottom:4 }}>{period==='mo'?'GHS 49':'GHS 470'}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>{period==='mo'?'per month · cancel anytime':'per year · save GHS 118'}</div>
              {['8+ daily predictions','Advanced AI+Human analysis','All betting tools + ROI','No ads'].map(f=>(<div key={f} style={{ fontSize:13, display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)' }}><span style={{ color:'var(--green)', fontWeight:700 }}>✓</span>{f}</div>))}
              {['VIP analyst picks'].map(f=>(<div key={f} style={{ fontSize:13, display:'flex', gap:8, padding:'5px 0', color:'var(--text3)' }}><span>✗</span>{f}</div>))}
              <button onClick={()=>handleSubscribe('premium')} style={{ width:'100%', background:'var(--green)', color:'#080b0e', border:'none', padding:14, borderRadius:12, fontWeight:900, fontSize:15, cursor:'pointer', marginTop:12 }}>
                Get Premium — {period==='mo'?'GHS 49/mo':'GHS 470/yr'}
              </button>
              <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:6 }}>📱 Mobile Money · 💳 Card · Paystack</div>
            </div>

            {/* VIP plan */}
            <div style={{ ...card, marginBottom:16, border:'1px solid #f5c51830', background:'linear-gradient(135deg,#151005,#1a1508)' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--gold)', marginBottom:4 }}>VIP</div>
              <div style={{ fontSize:32, fontWeight:900, fontFamily:'monospace', color:'var(--gold)', marginBottom:4 }}>{period==='mo'?'GHS 99':'GHS 950'}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>{period==='mo'?'per month · cancel anytime':'per year · save GHS 238'}</div>
              {['Everything in Premium','VIP analyst override picks','Telegram VIP group access','85–94% confidence picks','Early access + priority alerts'].map(f=>(<div key={f} style={{ fontSize:13, display:'flex', gap:8, padding:'5px 0', borderBottom:'1px solid var(--border)' }}><span style={{ color:'var(--gold)', fontWeight:700 }}>✓</span>{f}</div>))}
              <button onClick={()=>handleSubscribe('vip')} style={{ width:'100%', background:'var(--gold)', color:'#080b0e', border:'none', padding:14, borderRadius:12, fontWeight:900, fontSize:15, cursor:'pointer', marginTop:12 }}>
                Get VIP — {period==='mo'?'GHS 99/mo':'GHS 950/yr'}
              </button>
              <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:6 }}>📱 Mobile Money · 💳 Card · Paystack</div>
            </div>

            {/* Referral */}
            <div style={{ background:'linear-gradient(135deg,#120d00,#1a1200)', border:'1px solid #f5c51825', borderRadius:14, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)', marginBottom:4 }}>🎁 Refer & Earn</div>
              <div style={{ fontSize:12, color:'#8a7a40', marginBottom:10 }}>Share your code · Earn GHS 10 per signup · Unlimited</div>
              <div style={{ background:'var(--bg)', border:'1px dashed var(--gold)', borderRadius:10, padding:10, textAlign:'center', fontFamily:'monospace', fontSize:18, fontWeight:800, color:'var(--gold)', letterSpacing:3, margin:'10px 0' }}>
                {user?.user_metadata?.referral_code || 'REF-XXXXXX'}
              </div>
              <button onClick={()=>{ track('referral_share'); navigator.share?.({title:'AI Football Hub',text:'Get free football predictions!',url:window.location.origin}) }} style={{ width:'100%', background:'transparent', border:'1px solid var(--gold)', color:'var(--gold)', padding:10, borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                📤 Share Referral Link
              </button>
            </div>

            {/* Settings */}
            <div style={{ ...card, overflow:'hidden', padding:0, marginBottom:14 }}>
              {[['🔔','Notifications','Daily tips, streak alerts'],['💳','Billing','Manage plan & payments'],['📋','Responsible Gambling','Set deposit & bet limits'],['🔒','Security','Password & 2FA'],['⚽','Favourite Leagues','EPL, UCL, La Liga']].map(([icon,title,sub])=>(
                <div key={title as string} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:34, height:34, background:'var(--bg2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
                    <div><div style={{ fontSize:13, fontWeight:600 }}>{title as string}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{sub as string}</div></div>
                  </div>
                  <span style={{ color:'var(--text3)', fontSize:18 }}>›</span>
                </div>
              ))}
              {isAdmin && (
                <div onClick={()=>setShowAdmin(!showAdmin)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', background:'var(--green-dim)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:34, height:34, background:'var(--green-dim)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📊</div>
                    <div><div style={{ fontSize:13, fontWeight:600, color:'var(--green)' }}>Admin Analytics</div><div style={{ fontSize:11, color:'var(--text3)' }}>Revenue, events, users</div></div>
                  </div>
                  <span style={{ color:'var(--green)', fontSize:18 }}>{showAdmin?'▲':'▼'}</span>
                </div>
              )}
              <div onClick={signOut} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:34, height:34, background:'var(--bg2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🚪</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--red)' }}>Sign Out</div>
                </div>
              </div>
            </div>

            {showAdmin && isAdmin && <AdminAnalytics />}

            <div style={{ textAlign:'center', fontSize:10, color:'var(--text3)', lineHeight:1.6, paddingBottom:16 }}>
              <span style={{ border:'1px solid var(--text3)', padding:'2px 6px', borderRadius:3, fontWeight:700 }}>18+</span> Gamble responsibly · BeGambleAware.org<br/>© 2025 AI Football Hub · Made for Africa
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div style={{ background:'var(--bg2)', borderTop:'1px solid var(--border2)', display:'flex', padding:'6px 0 16px' }}>
        {([
          ['home','⚽','Home'],['predictions','🧠','Picks'],['intel','🔍','Intel'],
          ['tools','🔧','Tools'],['tracker','📊','Tracker'],['profile','👤','Profile']
        ] as [Tab,string,string][]).map(([t,icon,label])=>(
          <div key={t} onClick={()=>switchTab(t)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer', padding:'6px 0' }}>
            <span style={{ fontSize:20, color:tab===t?'var(--green)':'var(--text3)', transition:'color 0.2s', position:'relative' }}>
              {icon}
              {t==='intel' && criticals>0 && <span style={{ position:'absolute', top:-2, right:-4, width:8, height:8, background:'var(--red)', borderRadius:'50%', border:'2px solid var(--bg2)' }}/>}
              {t==='predictions' && valueBets>0 && <span style={{ position:'absolute', top:-2, right:-4, width:8, height:8, background:'var(--gold)', borderRadius:'50%', border:'2px solid var(--bg2)' }}/>}
            </span>
            <span style={{ fontSize:10, fontWeight:500, color:tab===t?'var(--green)':'var(--text3)' }}>{label}</span>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--green)', opacity:tab===t?1:0 }}/>
          </div>
        ))}
      </div>
    </div>
  )
}
