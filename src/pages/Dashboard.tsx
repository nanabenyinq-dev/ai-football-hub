import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePredictions } from '../hooks/usePredictions'
import { useStats } from '../hooks/useStats'
import { useHumanFactors } from '../hooks/useHumanFactors'
import { HumanAdjustedBadge } from '../components/HumanFactors'
import { HumanIntelTab } from '../components/HumanIntelTab'

type Tab = 'home' | 'predictions' | 'intel' | 'tools' | 'tracker' | 'profile'

const FILTERS = ['All','1X2','BTTS','Over/Under','EPL','UCL','La Liga','Bundesliga']
const TOOLS = [
  { id:'stake',  icon:'🎯', name:'Stake Calc',    desc:'Kelly Criterion' },
  { id:'acca',   icon:'📈', name:'Acca Builder',  desc:'Multi-bet returns' },
  { id:'profit', icon:'💰', name:'Profit Calc',   desc:'Expected return' },
  { id:'roi',    icon:'📊', name:'ROI Tracker',   desc:'Performance stats' },
]

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { predictions, loading: predLoading } = usePredictions()
  const { stats, bets } = useStats()
  const { factors, profiles, loading: hfLoading, applyHumanAdjustment, refresh: refreshHF } = useHumanFactors(predictions)

  const [tab, setTab] = useState<Tab>('home')
  const [predFilter, setPredFilter] = useState('All')
  const [activeTool, setActiveTool] = useState('stake')
  const [timer, setTimer] = useState('')
  const [planPeriod, setPlanPeriod] = useState<'mo'|'yr'>('mo')

  // Calc states
  const [br, setBr] = useState(500); const [rsk, setRsk] = useState(5); const [od, setOd] = useState(2.10)
  const [acOds, setAcOds] = useState([1.85,2.10,1.72]); const [acSt, setAcSt] = useState(20)
  const [prSt, setPrSt] = useState(50); const [prOd, setPrOd] = useState(2.40)
  const [riSt, setRiSt] = useState(200); const [riRt, setRiRt] = useState(260)

  // Countdown timer
  useEffect(() => {
    const tick = () => {
      const now = new Date(), end = new Date()
      end.setHours(23,59,59,0)
      const d = end.getTime() - now.getTime()
      const h = String(Math.floor(d/3600000)).padStart(2,'0')
      const m = String(Math.floor((d%3600000)/60000)).padStart(2,'0')
      const s = String(Math.floor((d%60000)/1000)).padStart(2,'0')
      setTimer(`${h}:${m}:${s}`)
    }
    tick(); const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Champ'
  const freePreds = predictions.filter(p => !p.is_vip)
  const vipPreds  = predictions.filter(p => p.is_vip)
  const criticalFactors = factors.filter(f => f.impact_level === 'critical').length

  const calcStake = () => { const s=br*(rsk/100); return { stake: s.toFixed(2), profit: (s*(od-1)).toFixed(2) } }
  const calcAcca  = () => { const c=acOds.reduce((a,b)=>a*b,1); const r=c*acSt; return { combined:c.toFixed(2), ret:r.toFixed(2), profit:(r-acSt).toFixed(2) } }
  const calcProfit= () => { const r=prSt*prOd; return { ret:r.toFixed(2), profit:(r-prSt).toFixed(2) } }
  const calcROI   = () => { const roi=((riRt-riSt)/riSt)*100; return { roi:roi.toFixed(1), net:(riRt-riSt).toFixed(2), color:roi>=0?'var(--green)':'var(--red)' } }

  const c = calcStake(); const ac = calcAcca(); const pr = calcProfit(); const ro = calcROI()

  const s = (style: React.CSSProperties) => style // inline style helper

  // ── STYLES ────────────────────────────────────────────────────────────────
  const card = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:14 }
  const chip = (active:boolean) => ({
    flex:'0 0 auto', padding:'7px 14px', borderRadius:20, fontSize:12, fontWeight:600,
    cursor:'pointer', whiteSpace:'nowrap' as const, border:'1px solid var(--border2)',
    background: active ? 'var(--green)' : 'transparent',
    color: active ? '#080b0e' : 'var(--text2)'
  })
  const navItem = (active:boolean) => ({
    flex:1, display:'flex', flexDirection:'column' as const, alignItems:'center',
    gap:3, cursor:'pointer', padding:'6px 0'
  })

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', maxWidth:420, margin:'0 auto' }}>

      {/* STREAK BAR */}
      <div style={{ background:'linear-gradient(90deg,#0d1a10,#0e1a18)', borderBottom:'1px solid #00e87a20', padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20, animation:'pulse-fire 1.5s ease-in-out infinite' }}>🔥</span>
        <div style={{ marginRight:4 }}>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--green)', lineHeight:1 }}>{stats.streak}</div>
          <div style={{ fontSize:10, color:'var(--text3)' }}>day streak</div>
        </div>
        <div style={{ flex:1, height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden', position:'relative' }}>
          <div style={{ height:'100%', width:'68%', background:'linear-gradient(90deg,var(--green),#00ffaa)', borderRadius:3 }} />
        </div>
        <div style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20 }}>
          Lv.7
        </div>
        {criticalFactors > 0 && (
          <div onClick={() => setTab('intel')} style={{ background:'var(--red-dim)', border:'1px solid var(--red)', color:'var(--red)', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, cursor:'pointer' }}>
            🧠 {criticalFactors} alert{criticalFactors>1?'s':''}
          </div>
        )}
      </div>

      {/* TICKER */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', overflow:'hidden', height:28, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', gap:0, animation:'ticker 25s linear infinite', whiteSpace:'nowrap' }}>
          {[...['Arsenal 2.40','Man City 2.10','Real Madrid 1.85','BTTS YES 1.72','Over 2.5 1.62','Chelsea 3.10','Liverpool 2.20'], ...['Arsenal 2.40','Man City 2.10','Real Madrid 1.85','BTTS YES 1.72']].map((t,i) => (
            <span key={i} style={{ fontSize:11, padding:'0 18px', color:'var(--text2)', display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ color:'var(--green)' }}>▲</span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>

        {/* ── HOME TAB ── */}
        {tab === 'home' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--green)', fontWeight:600, marginBottom:3 }}>
                📅 {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
              </div>
              <div style={{ fontSize:22, fontWeight:800 }}>Good evening, {userName} 👋</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginTop:3 }}>
                {predictions.length} predictions ready · {vipPreds.length} VIP locked
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
              {[['73%','Win Rate','var(--green)'],['8','Today','var(--gold)'],[`🔥${stats.streak}`,'Streak','var(--green)']].map(([v,l,c])=>(
                <div key={l} style={{ ...card, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:c as string }}>{v}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Human Intel alert */}
            {criticalFactors > 0 && (
              <div onClick={() => setTab('intel')} style={{ background:'linear-gradient(135deg,#1a0808,#2a0d0d)', border:'1px solid var(--red)', borderRadius:12, padding:14, marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>🧠</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>
                    {criticalFactors} Critical Human Factor{criticalFactors>1?'s':''} Detected
                  </div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>
                    Player/coach signals may affect today's odds · Tap to view
                  </div>
                </div>
                <span style={{ marginLeft:'auto', color:'var(--red)', fontSize:16 }}>›</span>
              </div>
            )}

            {/* Telegram */}
            <div style={{ background:'linear-gradient(135deg,#0d1020,#0a1428)', border:'1px solid #4facfe28', borderRadius:14, padding:14, marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:26 }}>✈️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>Join Telegram VIP</div>
                <div style={{ fontSize:11, color:'var(--text2)' }}>Daily high-confidence picks · 3,400 members</div>
              </div>
              <button style={{ background:'#229ED9', color:'#fff', border:'none', padding:'9px 13px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer' }}>Join →</button>
            </div>

            {/* AdSense slot */}
            <div style={{ background:'var(--card)', border:'1px dashed #ffffff12', borderRadius:12, height:80, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
              <span style={{ fontSize:10, color:'var(--text3)' }}>📢 Google AdSense — 320×100 (above fold)</span>
            </div>

            {/* Today's picks */}
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:15, fontWeight:700 }}>🔥 Hot Picks Today</span>
              <span onClick={() => setTab('predictions')} style={{ fontSize:12, color:'var(--green)', cursor:'pointer' }}>See all →</span>
            </div>

            {predLoading ? (
              <div style={{ textAlign:'center', padding:20, color:'var(--text2)' }}>Loading predictions...</div>
            ) : freePreds.slice(0,2).map(p => {
              const adj = applyHumanAdjustment(p,
                profiles[p.home_team], profiles[p.away_team])
              return (
                <div key={p.id} onClick={() => setTab('predictions')} style={{ ...card, marginBottom:10, borderLeft:'3px solid var(--green)', cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:10, color:'var(--text3)' }}>{p.league_flag} {p.league}</span>
                    <span style={{ fontSize:11, color:'var(--green)', background:'var(--green-dim)', padding:'3px 9px', borderRadius:20, fontWeight:600 }}>{p.match_time}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{p.home_team}</div>
                      <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:4 }}>
                        {p.home_form.map((f,i)=>(
                          <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:f==='W'?'var(--green)':f==='D'?'var(--text3)':'var(--red)' }}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12 }}>VS</div>
                    <div style={{ textAlign:'center', flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{p.away_team}</div>
                      <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:4 }}>
                        {p.away_form.map((f,i)=>(
                          <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:f==='W'?'var(--green)':f==='D'?'var(--text3)':'var(--red)' }}/>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                    {[
                      [p.home_team, p.home_odds.toFixed(2)],
                      ['Draw', p.draw_odds.toFixed(2)],
                      [p.away_team, p.away_odds.toFixed(2)]
                    ].map(([lbl,val],i) => (
                      <div key={i} style={{ flex:1, background:'var(--bg2)', border:`1px solid ${i===2&&p.prediction_type.includes('away')||i===0&&p.prediction_type.includes('home')?'var(--green)':'var(--border2)'}`, borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text3)' }}>{lbl}</div>
                        <div style={{ fontSize:15, fontWeight:800 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:10, color:'var(--text2)' }}>AI Conf.</span>
                    <div style={{ flex:1, height:5, background:'var(--border2)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${adj.adjusted_confidence}%`, background:'var(--green)', borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:'var(--green)' }}>{adj.adjusted_confidence}%</span>
                    <span style={{ background:'var(--green-dim)', border:'1px solid #00e87a22', color:'var(--green)', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>🧠 AI</span>
                    {adj.value_bet_flag && (
                      <span style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>💎 VALUE</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* VIP lock */}
            {vipPreds.length > 0 && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10, marginTop:8 }}>
                  <span style={{ fontSize:15, fontWeight:700 }}>⭐ VIP Picks</span>
                  <span style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', color:'var(--gold)', fontSize:10, padding:'2px 8px', borderRadius:20 }}>PREMIUM</span>
                </div>
                <div style={{ ...card, marginBottom:14, border:'1px solid #f5c51825', position:'relative', overflow:'hidden' }}>
                  <div style={{ filter:'blur(5px)', pointerEvents:'none', userSelect:'none' }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Chelsea vs Liverpool</div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>Liverpool WIN · 91% confidence · Analyst override</div>
                  </div>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#08090aee,#0e0d0aee)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ fontSize:26 }}>🔒</span>
                    <span style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>VIP PREDICTION</span>
                    <span style={{ fontSize:11, color:'var(--text2)', textAlign:'center', padding:'0 24px' }}>{vipPreds.length} premium picks · 85–94% confidence</span>
                    <button onClick={()=>setTab('profile')} style={{ background:'var(--gold)', color:'#080b0e', border:'none', padding:'10px 28px', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer' }}>
                      Unlock VIP
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Leaderboard */}
            <div style={{ ...card, marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>🏆 Top Tipsters This Week</div>
              {[['1','🥇','Kwame A.','340 pts'],['2','🥈','Seun E.','298 pts'],['7','👤','You','189 pts']].map(([rank,medal,name,pts])=>(
                <div key={rank} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', background:name==='You'?'var(--green-dim)':undefined }}>
                  <span style={{ fontSize:14, fontWeight:800, width:22, textAlign:'center' }}>{medal}</span>
                  <span style={{ flex:1, fontSize:13 }}>{name}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'var(--green)' }}>{pts}</span>
                </div>
              ))}
            </div>

            {/* Affiliate */}
            <div style={{ background:'linear-gradient(135deg,#120d00,#1e1500)', border:'1px solid #f5c51828', borderRadius:14, padding:14, display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <span style={{ fontSize:28 }}>🎰</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--gold)' }}>Sportybet 200% Bonus</div>
                <div style={{ fontSize:11, color:'#8a7a40' }}>For Ghanaian users · Min deposit GHS 10</div>
              </div>
              <button style={{ background:'var(--gold)', color:'#080b0e', border:'none', padding:'9px 14px', borderRadius:9, fontSize:12, fontWeight:800, cursor:'pointer' }}>Claim →</button>
            </div>

            {/* Daily challenge */}
            <div style={{ background:'linear-gradient(135deg,#150d20,#1a0d28)', border:'1px solid #a855f730', borderRadius:14, padding:16, marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'var(--purple)' }}>⚡ Daily Challenge</span>
                <span style={{ fontSize:13, fontWeight:800, color:'var(--gold)', fontFamily:'monospace' }}>{timer}</span>
              </div>
              <div style={{ fontSize:13, marginBottom:8, lineHeight:1.5 }}>Predict the correct scoreline for today's feature match to earn double XP.</div>
              <div style={{ fontSize:11, color:'var(--text2)', marginBottom:8 }}>Reward: <span style={{ color:'var(--gold)', fontWeight:700 }}>+200 XP</span> · <span style={{ color:'var(--gold)', fontWeight:700 }}>🏅 Scorer Badge</span></div>
              <div style={{ height:8, background:'var(--bg3)', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:'40%', background:'linear-gradient(90deg,var(--purple),#d946ef)', borderRadius:4 }}/>
              </div>
            </div>

            <div style={{ background:'var(--card)', border:'1px dashed #ffffff12', borderRadius:12, height:52, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
              <span style={{ fontSize:10, color:'var(--text3)' }}>📢 Google AdSense — 320×50 anchor</span>
            </div>

            <div style={{ textAlign:'center', fontSize:10, color:'var(--text3)', lineHeight:1.6, paddingBottom:8 }}>
              <span style={{ border:'1px solid var(--text3)', padding:'2px 6px', borderRadius:3, fontWeight:700 }}>18+</span> AI Football Hub does not guarantee winnings. Gamble responsibly.
            </div>
          </div>
        )}

        {/* ── PREDICTIONS TAB ── */}
        {tab === 'predictions' && (
          <div>
            <div style={{ padding:'14px 16px 4px' }}>
              <div style={{ fontSize:22, fontWeight:800 }}>Today's Predictions</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginTop:3 }}>{predictions.length} tips · AI + Human Intelligence</div>
            </div>
            <div style={{ display:'flex', gap:7, overflowX:'auto', padding:'8px 16px 8px', scrollbarWidth:'none' }}>
              {FILTERS.map(f=>(
                <div key={f} style={chip(predFilter===f)} onClick={()=>setPredFilter(f)}>{f}</div>
              ))}
            </div>
            <div style={{ background:'var(--card)', border:'1px dashed #ffffff12', borderRadius:12, height:52, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 16px 12px' }}>
              <span style={{ fontSize:10, color:'var(--text3)' }}>📢 AdSense Banner</span>
            </div>
            <div style={{ padding:'0 16px' }}>
              {freePreds.map(p => {
                const adj = applyHumanAdjustment(p, profiles[p.home_team], profiles[p.away_team])
                return (
                  <div key={p.id} style={{ ...card, marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'var(--green-dim)', color:'var(--green)' }}>{p.pick_label}</span>
                      <span style={{ fontSize:10, color:'var(--text3)' }}>🧠 ML Engine</span>
                    </div>
                    <div style={{ textAlign:'center', padding:'10px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:10 }}>
                      <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{p.home_team} vs {p.away_team}</div>
                      <div style={{ fontSize:11, color:'var(--text2)' }}>{p.league_flag} {p.league} · {p.match_time}</div>
                    </div>
                    <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6, marginBottom:10 }}>{p.analysis}</p>
                    {[['Win prob.', adj.adjusted_confidence, adj.adjusted_confidence],
                      ['BTTS', p.btts_pct, p.btts_pct],
                      ['Over 2.5', p.over25_pct, p.over25_pct]].map(([lbl,val,w])=>(
                      <div key={lbl as string} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:11, color:'var(--text2)', width:70 }}>{lbl}</span>
                        <div style={{ flex:1, height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${w}%`, background: (val as number)>=70?'var(--green)':(val as number)>=50?'var(--gold)':'var(--red)', borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:(val as number)>=70?'var(--green)':(val as number)>=50?'var(--gold)':'var(--red)', minWidth:34, textAlign:'right' }}>{val}%</span>
                      </div>
                    ))}
                    {/* Human Intelligence adjustment */}
                    <HumanAdjustedBadge
                      original={p.confidence}
                      adjusted={adj.adjusted_confidence}
                      valueBet={adj.value_bet_flag}
                      reason={adj.adjustment_reason}
                      edge={adj.human_edge}
                      homeTeam={p.home_team}
                      awayTeam={p.away_team}
                    />
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <div style={{ flex:1, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:10, padding:8, textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'var(--text3)' }}>Best Odds</div>
                        <div style={{ fontSize:16, fontWeight:800, color:'var(--green)' }}>{p.best_odds}</div>
                      </div>
                      <button style={{ flex:2, background:'var(--green)', color:'#080b0e', border:'none', padding:10, borderRadius:10, fontWeight:800, fontSize:13, cursor:'pointer' }}>BET NOW →</button>
                    </div>
                  </div>
                )
              })}

              {/* VIP locked */}
              {vipPreds.length > 0 && (
                <div style={{ position:'relative', marginBottom:12 }}>
                  <div style={{ ...card, filter:'blur(4px)', pointerEvents:'none', userSelect:'none', border:'1px solid #f5c51822' }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>Chelsea vs Liverpool · VIP Pick</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginTop:6 }}>Confidence: 91% · Analyst Override</div>
                  </div>
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg,#08090aee,#0e0d0aee)', borderRadius:14 }}>
                    <span style={{ fontSize:26 }}>🔒</span>
                    <span style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>{vipPreds.length} VIP PICKS LOCKED</span>
                    <button onClick={()=>setTab('profile')} style={{ background:'var(--gold)', color:'#080b0e', border:'none', padding:'10px 28px', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer' }}>
                      Unlock → GHS 49/mo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HUMAN INTEL TAB ── */}
        {tab === 'intel' && <HumanIntelTab predictions={predictions} />}

        {/* ── TOOLS TAB ── */}
        {tab === 'tools' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:14 }}>Betting Tools</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {TOOLS.map(t => (
                <div key={t.id} onClick={() => setActiveTool(t.id)} style={{ ...card, cursor:'pointer', border:`1px solid ${activeTool===t.id?'var(--green)':'var(--border)'}`, background: activeTool===t.id?'var(--green-dim)':'var(--card)' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{t.icon}</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'var(--text2)' }}>{t.desc}</div>
                </div>
              ))}
            </div>

            {activeTool === 'stake' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>🎯 Stake Calculator</div>
                {[['Bankroll (GHS)',br,setBr],['Risk %',rsk,setRsk],['Odds',od,setOd]].map(([lbl,val,set])=>(
                  <div key={lbl as string} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>{lbl as string}</div>
                    <input type="number" value={val as number} onChange={e=>(set as (v:number)=>void)(parseFloat(e.target.value)||0)}
                      style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'12px', borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }} />
                  </div>
                ))}
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Recommended Stake</div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--green)', fontFamily:'monospace' }}>GHS {c.stake}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Win: GHS {c.profit} profit · Risk: {rsk}% of bankroll</div>
                </div>
              </div>
            )}
            {activeTool === 'acca' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>📈 Accumulator Builder</div>
                {acOds.map((o,i)=>(
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>Leg {i+1} Odds</div>
                    <input type="number" value={o} onChange={e=>{const n=[...acOds];n[i]=parseFloat(e.target.value)||1;setAcOds(n)}} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'12px', borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }}/>
                  </div>
                ))}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>Stake (GHS)</div>
                  <input type="number" value={acSt} onChange={e=>setAcSt(parseFloat(e.target.value)||0)} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'12px', borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }}/>
                </div>
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Potential Return</div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--green)', fontFamily:'monospace' }}>GHS {ac.ret}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Combined: {ac.combined} · Profit: GHS {ac.profit}</div>
                </div>
              </div>
            )}
            {activeTool === 'profit' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>💰 Profit Calculator</div>
                {[['Stake (GHS)',prSt,setPrSt],['Odds',prOd,setPrOd]].map(([lbl,val,set])=>(
                  <div key={lbl as string} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>{lbl as string}</div>
                    <input type="number" value={val as number} onChange={e=>(set as (v:number)=>void)(parseFloat(e.target.value)||0)} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'12px', borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }}/>
                  </div>
                ))}
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Potential Profit</div>
                  <div style={{ fontSize:32, fontWeight:900, color:'var(--green)', fontFamily:'monospace' }}>GHS {pr.profit}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Return: GHS {pr.ret} · Profit: GHS {pr.profit}</div>
                </div>
              </div>
            )}
            {activeTool === 'roi' && (
              <div style={card}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>📊 ROI Calculator</div>
                {[['Total Staked (GHS)',riSt,setRiSt],['Total Returns (GHS)',riRt,setRiRt]].map(([lbl,val,set])=>(
                  <div key={lbl as string} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, color:'var(--text2)', marginBottom:5 }}>{lbl as string}</div>
                    <input type="number" value={val as number} onChange={e=>(set as (v:number)=>void)(parseFloat(e.target.value)||0)} style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--text)', padding:'12px', borderRadius:10, fontSize:16, fontWeight:700, outline:'none' }}/>
                  </div>
                ))}
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>ROI</div>
                  <div style={{ fontSize:32, fontWeight:900, fontFamily:'monospace', color:ro.color }}>{parseFloat(ro.roi)>=0?'+':''}{ro.roi}%</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:5 }}>Net: GHS {ro.net} · {parseFloat(ro.roi)>20?'Excellent':parseFloat(ro.roi)>0?'Profitable':'Below breakeven'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRACKER TAB ── */}
        {tab === 'tracker' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:14 }}>Bet Tracker</div>
            <div style={{ background:'linear-gradient(135deg,#0a1610,#0c1814)', border:'1px solid #00e87a25', borderRadius:16, padding:20, textAlign:'center', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}>Current Bankroll</div>
              <div style={{ fontSize:44, fontWeight:900, color:'var(--green)', fontFamily:'monospace', lineHeight:1 }}>GHS {stats.current_bankroll.toFixed(2)}</div>
              <div style={{ fontSize:13, color:'var(--green)', marginTop:6 }}>📈 +GHS {stats.net_profit.toFixed(2)} (+{stats.roi}%) this month</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
              {[[stats.won,'Won','var(--green)'],[stats.lost,'Lost','var(--red)'],[`${stats.win_rate}%`,'Win Rate','var(--gold)']].map(([v,l,c])=>(
                <div key={l as string} style={{ ...card, padding:12, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:c as string }}>{v}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{l as string}</div>
                </div>
              ))}
            </div>
            <div style={{ ...card, overflow:'hidden', padding:0 }}>
              <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700 }}>Recent Bets</div>
              {bets.slice(0,6).map(b=>(
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

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={{ padding:'14px 16px' }}>
            <div style={{ ...card, textAlign:'center', marginBottom:14 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,var(--green),#00a855)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#080b0e', margin:'0 auto 12px' }}>
                {userName.charAt(0)}
              </div>
              <div style={{ fontSize:20, fontWeight:800 }}>{userName}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{user?.email}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--border2)', padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, marginTop:10 }}>
                ⚽ FREE PLAN
              </div>
            </div>

            {/* Subscription plans */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>Choose Your Plan</div>
              <div style={{ display:'flex', background:'var(--bg2)', borderRadius:10, padding:4, marginBottom:14 }}>
                {(['mo','yr'] as const).map(p=>(
                  <div key={p} onClick={()=>setPlanPeriod(p)} style={{ flex:1, padding:9, textAlign:'center', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', background:planPeriod===p?'var(--card)':'transparent', color:planPeriod===p?'var(--green)':'var(--text2)' }}>
                    {p==='mo'?'Monthly':'Annual'}{p==='yr'&&<span style={{ fontSize:11, color:'var(--green)' }}> Save 20%</span>}
                  </div>
                ))}
              </div>

              {[
                { name:'Free', price:'GHS 0', period:'forever', features:['3 free predictions/day','All betting tools','Bet tracker'], locked:['VIP predictions','Telegram VIP'], btn:'Current Plan', btnStyle:{ background:'transparent', border:'1px solid var(--border2)', color:'var(--text2)' } },
                { name:'Premium', price:planPeriod==='mo'?'GHS 49':'GHS 470', period:planPeriod==='mo'?'per month':'per year · save GHS 118', features:['8+ daily predictions','Advanced AI analysis','No ads','All tools'], locked:['VIP analyst picks'], btn:'Get Premium', btnStyle:{ background:'var(--green)', color:'#080b0e' }, featured:true },
                { name:'VIP', price:planPeriod==='mo'?'GHS 99':'GHS 950', period:planPeriod==='mo'?'per month':'per year · save GHS 238', features:['Everything in Premium','VIP analyst overrides','Telegram VIP group','85–94% confidence picks'], locked:[], btn:'Get VIP Access', btnStyle:{ background:'var(--gold)', color:'#080b0e' } },
              ].map(plan=>(
                <div key={plan.name} style={{ ...card, marginBottom:12, border:plan.featured?'1px solid #00e87a40':'1px solid var(--border)', position:'relative', background:plan.featured?'linear-gradient(135deg,#0f1e14,#0e1c1a)':'var(--card)' }}>
                  {plan.featured && <div style={{ position:'absolute', top:-11, right:16, background:'var(--green)', color:'#080b0e', fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:20 }}>BEST VALUE</div>}
                  <div style={{ fontSize:20, fontWeight:800, color:plan.name==='VIP'?'var(--gold)':plan.featured?'var(--green)':'var(--text)' }}>{plan.name}</div>
                  <div style={{ fontSize:36, fontWeight:900, fontFamily:'monospace', margin:'8px 0 4px', color:plan.name==='VIP'?'var(--gold)':plan.featured?'var(--green)':'var(--text)' }}>{plan.price}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>{plan.period}</div>
                  {plan.features.map(f=>(<div key={f} style={{ fontSize:13, display:'flex', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border)' }}><span style={{ color:'var(--green)', fontWeight:700 }}>✓</span>{f}</div>))}
                  {plan.locked.map(f=>(<div key={f} style={{ fontSize:13, display:'flex', gap:8, padding:'4px 0', borderBottom:'1px solid var(--border)', color:'var(--text3)' }}><span style={{ fontWeight:700 }}>✗</span>{f}</div>))}
                  <button style={{ ...plan.btnStyle, width:'100%', padding:14, borderRadius:12, fontWeight:800, fontSize:15, cursor:'pointer', marginTop:12, border:'none' }}>{plan.btn}</button>
                  {plan.btn !== 'Current Plan' && <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', marginTop:6 }}>Mobile Money · Card · Paystack</div>}
                </div>
              ))}
            </div>

            {/* Referral */}
            <div style={{ background:'linear-gradient(135deg,#120d00,#1a1200)', border:'1px solid #f5c51825', borderRadius:14, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--gold)', marginBottom:4 }}>🎁 Refer & Earn</div>
              <div style={{ fontSize:12, color:'#8a7a40', marginBottom:10 }}>Share your code · Earn GHS 10 per signup</div>
              <div style={{ background:'var(--bg)', border:'1px dashed var(--gold)', borderRadius:10, padding:10, textAlign:'center', fontFamily:'monospace', fontSize:18, fontWeight:800, color:'var(--gold)', letterSpacing:3, margin:'10px 0' }}>
                {user?.user_metadata?.referral_code || 'REF-XXXXXX'}
              </div>
              <button style={{ width:'100%', background:'transparent', border:'1px solid var(--gold)', color:'var(--gold)', padding:10, borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                Share Referral Link
              </button>
            </div>

            {/* Settings */}
            <div style={{ ...card, overflow:'hidden', padding:0, marginBottom:14 }}>
              {[['🔔','Notifications','Daily tips, streak alerts'],['💳','Billing','Manage plan & payments'],['📋','Responsible Gambling','Set deposit & bet limits'],['🔒','Security','Password & 2FA'],['⚽','Favourite Leagues','EPL, UCL, La Liga']].map(([icon,title,sub])=>(
                <div key={title as string} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:34, height:34, background:'var(--bg2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{title}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{sub}</div>
                    </div>
                  </div>
                  <span style={{ color:'var(--text3)', fontSize:18 }}>›</span>
                </div>
              ))}
              <div onClick={signOut} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:34, height:34, background:'var(--bg2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🚪</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--red)' }}>Sign Out</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign:'center', fontSize:10, color:'var(--text3)', lineHeight:1.6, paddingBottom:8 }}>
              <span style={{ border:'1px solid var(--text3)', padding:'2px 6px', borderRadius:3, fontWeight:700 }}>18+</span> Gamble responsibly · BeGambleAware.org<br/>© 2025 AI Football Hub · Made for Africa
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div style={{ background:'var(--bg2)', borderTop:'1px solid var(--border2)', display:'flex', padding:'6px 0 16px', maxWidth:420, width:'100%' }}>
        {([
          ['home','⚽','Home'],
          ['predictions','🧠','Picks'],
          ['intel','🔍','Intel'],
          ['tools','🔧','Tools'],
          ['tracker','📊','Tracker'],
          ['profile','👤','Profile'],
        ] as [Tab,string,string][]).map(([t,icon,label])=>(
          <div key={t} onClick={()=>setTab(t)} style={navItem(tab===t)}>
            <span style={{ fontSize:20, color:tab===t?'var(--green)':'var(--text3)', transition:'color 0.2s', position:'relative' }}>
              {icon}
              {t==='intel' && criticalFactors > 0 && (
                <span style={{ position:'absolute', top:-2, right:-4, width:8, height:8, background:'var(--red)', borderRadius:'50%', border:'2px solid var(--bg2)' }}/>
              )}
            </span>
            <span style={{ fontSize:10, fontWeight:500, color:tab===t?'var(--green)':'var(--text3)', transition:'color 0.2s' }}>{label}</span>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--green)', opacity:tab===t?1:0, transition:'opacity 0.2s' }}/>
          </div>
        ))}
      </div>
    </div>
  )
}
