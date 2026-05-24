interface LandingProps {
  onGetStarted: () => void
}

const LIVE_WINS = [
  { name: 'Kofi A.', pick: 'Man City WIN', amount: '+GHS 84' },
  { name: 'Ama O.', pick: 'Over 2.5 ✓', amount: '+GHS 46' },
  { name: 'Seun B.', pick: 'BTTS Acca', amount: '+GHS 210' },
  { name: 'Kwesi T.', pick: 'Liverpool WIN', amount: '+GHS 62' },
  { name: 'Chidi N.', pick: 'Real Madrid ✓', amount: '+GHS 138' },
]

const FEATURES = [
  { icon: '🧠', title: 'AI Predictions', desc: 'ML model trained on 25 seasons of data' },
  { icon: '👥', title: 'Human Intel', desc: 'Player injuries, coach mood, social signals' },
  { icon: '🔥', title: 'Daily Streaks', desc: 'Build habits, earn XP, climb the board' },
  { icon: '📊', title: 'Bet Tracker', desc: 'ROI, bankroll, win rate analytics' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Compete with Africa\'s best tipsters' },
  { icon: '📱', title: '1-Tap Alerts', desc: 'Instant Telegram alerts with pre-filled bets' },
]

export function Landing({ onGetStarted }: LandingProps) {
  const card = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: 14,
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', scrollbarWidth: 'none', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px 40px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>⚽</div>
          <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, margin: 0 }}>
            AI <span style={{ color: 'var(--green)' }}>Football</span><br />Hub
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 10, lineHeight: 1.5 }}>
            Africa's #1 AI prediction platform<br />Ghana · Nigeria · Kenya
          </p>
        </div>

        {/* Trust bar */}
        <div style={{ ...card, display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
          {[['73%','Accuracy'],['47K+','Users'],['8/day','Free Tips'],['GHS 0','To Start']].map(([v,l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--green)' }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Live wins social proof */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'live-pulse 1s infinite' }} />
            LIVE — Recent wins today
          </div>
          {LIVE_WINS.map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < LIVE_WINS.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
              <span style={{ color: 'var(--text2)' }}>{w.name} · {w.pick}</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>{w.amount}</span>
            </div>
          ))}
        </div>

        {/* Human Intel feature highlight */}
        <div style={{ background: 'linear-gradient(135deg,#0d1020,#0a1428)', border: '1px solid #4facfe28', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#4facfe', marginBottom: 8 }}>🧠 NEW: Human Intelligence Layer</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>
            We scan Reddit, social media and news feeds in real-time for player injuries, coach conflicts, personal issues and transfer rumours — then adjust our AI confidence scores before the bookmakers react.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['🤕 Injury alerts','😤 Coach mood','💔 Personal life','🔄 Transfers'].map(tag => (
              <span key={tag} style={{ fontSize: 10, background: '#4facfe15', border: '1px solid #4facfe25', color: '#4facfe', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', flex: '0 0 auto' }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={card}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* 1-Tap Bet Alert preview */}
        <div style={{ background: 'linear-gradient(135deg,#0f1e14,#0e1c1a)', border: '1px solid #00e87a28', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)', marginBottom: 8 }}>📲 1-Tap Bet Alerts</div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>AI Football Hub · just now</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🔥 HIGH CONFIDENCE PICK READY</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Man City WIN vs Arsenal · 82% confidence · Odds 2.10 · Recommended stake: GHS 25</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'var(--green)', color: '#080b0e', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 800, textAlign: 'center' }}>Open Bet Slip →</div>
              <div style={{ flex: 1, background: 'var(--border2)', color: 'var(--text2)', padding: '8px', borderRadius: 8, fontSize: 12, textAlign: 'center' }}>Dismiss</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
            Receive alerts via Telegram or in-app. One tap opens the bookmaker with the bet pre-filled. You confirm — full control, zero automation.
          </div>
        </div>

        {/* Testimonials */}
        {[
          { init: 'KA', name: 'Kwame A.', loc: 'Accra, Ghana', text: '"The Human Intel feature spotted a Salah fitness issue before the odds moved. Made GHS 200 on that tip alone."', win: '+GHS 200 in one bet', color: 'var(--green)' },
          { init: 'OA', name: 'Olu A.', loc: 'Lagos, Nigeria', text: '"The 1-tap alerts are genius. Notification comes, I tap, bet is pre-filled. Done in 10 seconds before odds move."', win: '7/10 correct this month', color: '#4facfe' },
        ].map(t => (
          <div key={t.name} style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${t.color}20`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{t.init}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.loc}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--gold)', fontSize: 12 }}>★★★★★</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>{t.text}</div>
            <span style={{ background: 'var(--green-dim)', border: '1px solid #00e87a30', color: 'var(--green)', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>{t.win}</span>
          </div>
        ))}

        {/* CTA */}
        <button onClick={onGetStarted} style={{ display: 'block', width: '100%', background: 'var(--green)', color: '#080b0e', border: 'none', padding: 16, borderRadius: 12, fontWeight: 900, fontSize: 17, cursor: 'pointer', marginBottom: 10, letterSpacing: 0.3 }}>
          🚀 Get Free Predictions
        </button>
        <button onClick={onGetStarted} style={{ display: 'block', width: '100%', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', padding: 15, borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>
          Sign In to Account
        </button>

        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', lineHeight: 1.7 }}>
          <span style={{ border: '1px solid var(--text3)', padding: '2px 7px', borderRadius: 3, fontWeight: 700, marginRight: 6 }}>18+</span>
          Gamble responsibly. Never bet more than you can afford to lose.<br />
          AI Football Hub provides predictions for informational purposes only.<br />
          © 2025 AI Football Hub · Made for Africa
        </div>
      </div>
    </div>
  )
}
