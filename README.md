# ⚽ AI Football Hub

Africa's #1 AI-powered football prediction platform built for Ghana, Nigeria, Kenya and the broader African betting audience.

## 🚀 Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React + Vite + TypeScript + TailwindCSS | Free |
| Backend/Auth/DB | Supabase | Free |
| Hosting | Vercel | Free |
| ML Predictions | scikit-learn + football-data.co.uk CSVs | Free |
| Human Intelligence | Reddit JSON API (no key) | Free |
| Alerts | Telegram Bot API | Free |
| Payments | Paystack (Mobile Money + Card) | % per transaction |

**Total monthly infrastructure cost: $0**

---

## 📁 Project Structure

```
ai-football-hub/
├── src/
│   ├── components/
│   │   ├── HumanFactors.tsx      # Human factor cards + badges
│   │   └── HumanIntelTab.tsx     # Full human intelligence tab
│   ├── hooks/
│   │   ├── useAuth.tsx           # Supabase auth context
│   │   ├── usePredictions.ts     # Prediction data + fallback
│   │   ├── useStats.ts           # User bet tracking stats
│   │   └── useHumanFactors.ts    # Reddit scraper + sentiment engine
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── types.ts              # TypeScript types
│   │   └── humanFactors.types.ts # Human factor types
│   ├── pages/
│   │   ├── Landing.tsx           # Landing page
│   │   ├── Auth.tsx              # Sign in / Sign up
│   │   └── Dashboard.tsx         # Full dashboard (6 tabs)
│   ├── styles/index.css          # Global styles + CSS variables
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
├── predictor/
│   ├── run_daily.py              # ML prediction engine → Supabase
│   ├── alert_bot.py              # Telegram 1-tap alert bot
│   └── scheduler.py             # Daily job scheduler
├── supabase/
│   └── schema.sql               # Full database schema
├── .env.example                  # Environment variables template
├── vercel.json                   # Vercel SPA routing config
└── index.html                    # HTML entry + AdSense slot
```

---

## ⚙️ Setup (Step by Step)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/ai-football-hub.git
cd ai-football-hub
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) — create a free project
2. Go to **SQL Editor** → paste contents of `supabase/schema.sql` → Run
3. Go to **Settings → API** → copy your `URL` and `anon key`
4. Enable **Google OAuth**: Authentication → Providers → Google

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHANNEL_ID=@YourChannel
TELEGRAM_VIP_CHANNEL_ID=@YourVIPChannel
VITE_TELEGRAM_LINK=https://t.me/YourChannel
```

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (auto-detects Vite)
vercel

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

Or connect GitHub repo at [vercel.com](https://vercel.com) for auto-deploy on every push.

---

## 🧠 Running the ML Predictor

```bash
cd predictor

# Install Python dependencies
pip install pandas scikit-learn numpy requests supabase python-dotenv

# Run once manually
python run_daily.py

# Run daily scheduler (keeps running)
python scheduler.py
```

The predictor:
1. Downloads free CSV data from football-data.co.uk (no signup)
2. Trains a Gradient Boosting model on 25 seasons of data
3. Predicts 1X2 / BTTS / Over 2.5 for today's matches
4. Scans Reddit for human factors (injuries, suspensions, etc.)
5. Pushes everything to your Supabase database
6. Sends Telegram alerts with 1-tap bet links

Edit `TODAYS_MATCHES` in `run_daily.py` each morning with that day's fixtures.

---

## 📲 Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram → `/newbot`
2. Copy the token → add to `.env` as `TELEGRAM_BOT_TOKEN`
3. Create a public channel → add bot as admin
4. Add channel username to `.env` as `TELEGRAM_CHANNEL_ID`

The alert bot sends pre-filled bet details. Users tap a link that opens the bookmaker — **they always confirm manually.** No automated betting.

---

## 💰 Monetisation

### Google AdSense
Ad slots are pre-placed in `src/pages/Dashboard.tsx`:
- Above the fold (320×100) — highest CTR
- Between content (300×250) — best performing format  
- Bottom anchor (320×50) — persistent visibility

Uncomment the AdSense script in `index.html` and replace `ca-pub-XXXXXXXXXXXXXXXX`.

### Subscriptions
- **Free**: 3 predictions/day, ads shown
- **Premium (GHS 49/mo)**: 8+ predictions, no ads
- **VIP (GHS 99/mo)**: Premium + analyst overrides + Telegram VIP

Payment via Paystack (Mobile Money + Card). Wire up Paystack webhooks to update `subscriptions` table in Supabase.

### Affiliate Links
Replace `https://sportybet.com` / `https://betway.com.gh` CTAs with your affiliate tracking links. Standard commission: 25–40% of referred player losses.

### Referral System
Built in — users get a unique code, earn GHS 10 per converted signup. Tracked in `referrals` table.

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, subscription tier, XP, streak |
| `predictions` | ML + analyst predictions (written by Python script) |
| `human_factors` | Player/coach signals from Reddit + admin |
| `bet_entries` | User bet tracking |
| `subscriptions` | Paystack subscription records |
| `referrals` | Referral tracking |
| `notifications` | In-app notification queue |
| `admin_overrides` | VIP analyst pick overrides |

---

## 🧬 Human Intelligence System

The platform automatically scans:
- `r/soccer`, `r/PremierLeague`, `r/football`, `r/ChampionsLeague`
- Detects: injuries, suspensions, personal issues, coach conflicts, transfer rumours
- Scores sentiment: -1 (very negative) to +1 (very positive)
- Adjusts AI confidence scores based on detected factors
- Flags **value bets** where human factors diverge significantly from base model

No signup, no API key. Uses Reddit's free public JSON endpoint.

---

## ⚠️ Responsible Gambling

This platform:
- Displays 18+ warnings throughout
- Shows responsible gambling reminders in every betting context
- Includes budget/deposit limit settings in user profile
- Does NOT automate bets — users always confirm manually
- Does NOT guarantee winnings or use misleading language
- Complies with Ghana Gaming Commission requirements

---

## 📊 Performance Targets

- Lighthouse score: 90+
- First Contentful Paint: < 1.5s
- Mobile-first (420px max-width dashboard)
- PWA-ready (add manifest.json for install prompt)

---

*Built for Africa. © 2025 AI Football Hub*
