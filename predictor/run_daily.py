#!/usr/bin/env python3
"""
AI Football Hub — Master Prediction Engine
Zero external API keys. Runs on your laptop daily.
Pushes predictions + human factors directly to Supabase.

Install once:
  pip install pandas scikit-learn numpy requests supabase python-dotenv
"""

import os, json, re, time, warnings
from datetime import datetime, date
import pandas as pd
import numpy as np
import requests
from dotenv import load_dotenv
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split

warnings.filterwarnings('ignore')
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')  # use service key for writes
SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
}

# ── SUPABASE REST HELPERS ─────────────────────────────────────────────────────
def sb_upsert(table: str, rows: list) -> bool:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print(f"  ⚠️  Supabase not configured — printing {table} to stdout instead")
        print(json.dumps(rows, indent=2, default=str))
        return True
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=SUPABASE_HEADERS,
        json=rows
    )
    if r.status_code in (200, 201):
        print(f"  ✓ {len(rows)} rows → {table}")
        return True
    print(f"  ✗ {table} error {r.status_code}: {r.text[:120]}")
    return False

# ── 1. FOOTBALL DATA FETCH (no signup) ───────────────────────────────────────
LEAGUE_CODES = {
    'EPL':        ('E0', 'Premier League', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
    'Championship':('E1', 'Championship',  '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
    'LaLiga':     ('SP1','La Liga',        '🇪🇸'),
    'SerieA':     ('I1', 'Serie A',        '🇮🇹'),
    'Bundesliga': ('D1', 'Bundesliga',     '🇩🇪'),
    'Ligue1':     ('F1', 'Ligue 1',        '🇫🇷'),
}

def fetch_csv(code: str, season='2425') -> pd.DataFrame:
    url = f'https://www.football-data.co.uk/mmz4281/{season}/{code}.csv'
    try:
        df = pd.read_csv(url, on_bad_lines='skip')
        df = df.dropna(subset=['HomeTeam','AwayTeam','FTHG','FTAG','FTR'])
        df['FTHG'] = pd.to_numeric(df['FTHG'], errors='coerce').fillna(0)
        df['FTAG'] = pd.to_numeric(df['FTAG'], errors='coerce').fillna(0)
        print(f"  ✓ {code}: {len(df)} rows")
        return df.reset_index(drop=True)
    except Exception as e:
        print(f"  ✗ {code}: {e}")
        return pd.DataFrame()

# ── 2. FEATURE ENGINEERING ────────────────────────────────────────────────────
def team_form(df: pd.DataFrame, team: str, n=5, before_idx=None) -> dict:
    mask = (df['HomeTeam'] == team) | (df['AwayTeam'] == team)
    matches = df[mask]
    if before_idx is not None:
        matches = matches[matches.index < before_idx]
    matches = matches.tail(n)
    if matches.empty:
        return {'w':0,'d':0,'l':0,'gf':0,'ga':0,'pts':0,'form_str':'LLLLL'}

    w=d=l=gf=ga=0
    form_chars=[]
    for _, row in matches.iterrows():
        if row['HomeTeam'] == team:
            gf+=row['FTHG']; ga+=row['FTAG']
            if row['FTR']=='H': w+=1; form_chars.append('W')
            elif row['FTR']=='D': d+=1; form_chars.append('D')
            else: l+=1; form_chars.append('L')
        else:
            gf+=row['FTAG']; ga+=row['FTHG']
            if row['FTR']=='A': w+=1; form_chars.append('W')
            elif row['FTR']=='D': d+=1; form_chars.append('D')
            else: l+=1; form_chars.append('L')

    return {'w':w,'d':d,'l':l,'gf':gf,'ga':ga,'pts':w*3+d,
            'form_str':''.join(form_chars).ljust(5,'L')}

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    rows=[]
    for idx, row in df.iterrows():
        try:
            hf = team_form(df, row['HomeTeam'], 5, idx)
            af = team_form(df, row['AwayTeam'],  5, idx)
            h2h = df[
                ((df['HomeTeam']==row['HomeTeam'])&(df['AwayTeam']==row['AwayTeam'])) |
                ((df['HomeTeam']==row['AwayTeam'])&(df['AwayTeam']==row['HomeTeam']))
            ]
            h2h = h2h[h2h.index < idx].tail(5)
            total_goals = (row['FTHG'] + row['FTAG'])
            rows.append({
                'h_w':hf['w'],'h_d':hf['d'],'h_l':hf['l'],
                'h_gf':hf['gf'],'h_ga':hf['ga'],'h_pts':hf['pts'],
                'a_w':af['w'],'a_d':af['d'],'a_l':af['l'],
                'a_gf':af['gf'],'a_ga':af['ga'],'a_pts':af['pts'],
                'h2h_hw':len(h2h[h2h['FTR']=='H']),
                'h2h_aw':len(h2h[h2h['FTR']=='A']),
                'result': row['FTR'],
                'over25': int(total_goals > 2.5),
                'btts':   int(row['FTHG'] > 0 and row['FTAG'] > 0),
            })
        except:
            continue
    return pd.DataFrame(rows)

FEATURE_COLS = ['h_w','h_d','h_l','h_gf','h_ga','h_pts',
                'a_w','a_d','a_l','a_gf','a_ga','a_pts',
                'h2h_hw','h2h_aw']

# ── 3. TRAIN MODELS ───────────────────────────────────────────────────────────
def train(df_feat: pd.DataFrame):
    X = df_feat[FEATURE_COLS]
    # 1X2 model
    y1 = df_feat['result']
    X_tr, X_te, y_tr, y_te = train_test_split(X, y1, test_size=0.2, random_state=42)
    m1 = GradientBoostingClassifier(n_estimators=200, learning_rate=0.05,
                                     max_depth=4, random_state=42)
    m1.fit(X_tr, y_tr)
    acc = m1.score(X_te, y_te)
    print(f"  ✓ 1X2 model accuracy: {acc:.1%}")

    # Over 2.5 model
    y2 = df_feat['over25']
    m2 = GradientBoostingClassifier(n_estimators=150, learning_rate=0.05, random_state=42)
    m2.fit(X, y2)

    # BTTS model
    y3 = df_feat['btts']
    m3 = GradientBoostingClassifier(n_estimators=150, learning_rate=0.05, random_state=42)
    m3.fit(X, y3)

    return m1, m2, m3

# ── 4. PREDICT MATCH ─────────────────────────────────────────────────────────
def predict(m1, m2, m3, df: pd.DataFrame, home: str, away: str) -> dict:
    hf = team_form(df, home)
    af = team_form(df, away)
    h2h = df[
        ((df['HomeTeam']==home)&(df['AwayTeam']==away)) |
        ((df['HomeTeam']==away)&(df['AwayTeam']==home))
    ].tail(5)

    feat = [[hf['w'],hf['d'],hf['l'],hf['gf'],hf['ga'],hf['pts'],
             af['w'],af['d'],af['l'],af['gf'],af['ga'],af['pts'],
             len(h2h[h2h['FTR']=='H']), len(h2h[h2h['FTR']=='A'])]]

    probs = dict(zip(m1.classes_, m1.predict_proba(feat)[0]))
    o25_p = float(m2.predict_proba(feat)[0][1])
    btts_p = float(m3.predict_proba(feat)[0][1])

    h_pct = round(probs.get('H',0.33)*100, 1)
    d_pct = round(probs.get('D',0.33)*100, 1)
    a_pct = round(probs.get('A',0.33)*100, 1)
    over25_pct = round(o25_p*100, 1)
    btts_pct = round(btts_p*100, 1)

    # Best pick
    best_1x2 = max([('H',h_pct),('D',d_pct),('A',a_pct)], key=lambda x:x[1])
    best_market = 'over25' if over25_pct > max(h_pct, a_pct) else '1x2'
    if best_market == 'over25' and over25_pct >= 70:
        pick_type = 'over25'; pick_label = 'Over 2.5 Goals'; best_odds_est = 1.65
        confidence = int(over25_pct)
    elif btts_pct >= 75:
        pick_type = 'btts'; pick_label = 'BTTS — Yes'; best_odds_est = 1.72
        confidence = int(btts_pct)
    elif best_1x2[0] == 'H':
        pick_type = 'win_home'; pick_label = f'{home} WIN'; best_odds_est = round(100/h_pct, 2)
        confidence = int(h_pct)
    elif best_1x2[0] == 'A':
        pick_type = 'win_away'; pick_label = f'{away} WIN'; best_odds_est = round(100/a_pct, 2)
        confidence = int(a_pct)
    else:
        pick_type = 'draw'; pick_label = 'Draw'; best_odds_est = round(100/d_pct, 2)
        confidence = int(d_pct)

    return {
        'prediction_type': pick_type,
        'pick_label': pick_label,
        'best_odds': min(best_odds_est, 9.99),
        'home_odds': round(100/max(h_pct,1), 2),
        'draw_odds': round(100/max(d_pct,1), 2),
        'away_odds': round(100/max(a_pct,1), 2),
        'confidence': min(confidence, 94),
        'home_win_pct': h_pct,
        'draw_pct': d_pct,
        'away_win_pct': a_pct,
        'btts_pct': btts_pct,
        'over25_pct': over25_pct,
        'home_form': list(hf['form_str']),
        'away_form': list(af['form_str']),
    }

# ── 5. HUMAN FACTOR SCANNER (Reddit JSON — no key) ───────────────────────────
HUMAN_KEYWORDS = {
    'injury':    ['injured','injury','out','doubtful','ruled out','fitness','scan','surgery','limped','knock'],
    'suspension':['suspended','red card','ban','banned','disciplinary','sent off'],
    'personal_life':['divorce','baby','birth','family','arrested','tragedy','hospital','personal'],
    'coach_conflict':['sacked','fired','resigned','under pressure','slammed','criticized','manager row'],
    'transfer_rumour':['transfer','wants to leave','contract','unhappy','dropped','benched'],
}
POS_WORDS = ['confident','fit','sharp','motivated','brilliant','ready','happy','scored','unstoppable']
NEG_WORDS = ['injured','suspended','doubt','miss','out','struggling','sacked','crisis','banned','arrested']

def classify_reddit_post(title: str, teams: list) -> tuple:
    t = title.lower()
    team = next((tm for tm in teams if tm.lower() in t), None)
    if not team:
        return None, None, None, 0

    for factor_type, keywords in HUMAN_KEYWORDS.items():
        if any(k in t for k in keywords):
            impact = 'critical' if factor_type in ('injury','suspension') else 'high'
            shift = {'injury':-0.18,'suspension':-0.12,'personal_life':-0.08,
                     'coach_conflict':-0.10,'transfer_rumour':-0.07}[factor_type]
            return team, factor_type, impact, shift
    return team, None, None, 0

def score_sentiment(text: str) -> float:
    t = text.lower()
    pos = sum(1 for w in POS_WORDS if w in t)
    neg = sum(1 for w in NEG_WORDS if w in t)
    total = pos + neg
    if total == 0: return 0.0
    return round((pos-neg)/total, 2)

def extract_player(title: str) -> str:
    match = re.search(r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b', title)
    return match.group(1) if match else ''

def scan_human_factors(teams: list, match_map: dict) -> list:
    factors = []
    subs = ['soccer','PremierLeague','football','ChampionsLeague']
    seen_ids = set()

    for sub in subs:
        try:
            r = requests.get(
                f'https://www.reddit.com/r/{sub}/new.json?limit=50',
                headers={'User-Agent': 'AIFootballHub/1.0'},
                timeout=8
            )
            if r.status_code != 200: continue
            posts = r.json().get('data',{}).get('children',[])

            for item in posts:
                p = item.get('data',{})
                title = p.get('title','')
                post_id = p.get('id','')
                if post_id in seen_ids: continue
                seen_ids.add(post_id)

                team, ftype, impact, shift = classify_reddit_post(title, teams)
                if not team or not ftype: continue

                sentiment = score_sentiment(title + ' ' + p.get('selftext',''))
                player = extract_player(title)
                match_ids = match_map.get(team, [])

                factors.append({
                    'id': post_id,
                    'player_name': player or None,
                    'team': team,
                    'type': ftype,
                    'headline': title[:200],
                    'detail': (p.get('selftext','') or '')[:300],
                    'impact_level': impact,
                    'impact_direction': 'negative' if shift < 0 else 'positive',
                    'odds_shift_estimate': shift,
                    'source': f'r/{sub}',
                    'source_url': f"https://reddit.com{p.get('permalink','')}",
                    'verified': False,
                    'detected_at': datetime.utcnow().isoformat(),
                    'match_ids': match_ids,
                    'sentiment_score': sentiment,
                    'social_buzz': min(100, int((p.get('score',0) or 0) / 5))
                })
            time.sleep(0.5)  # polite delay
        except Exception as e:
            print(f"  Reddit r/{sub}: {e}")
            continue

    print(f"  ✓ {len(factors)} human factors detected from Reddit")
    return factors

# ── 6. ANALYSIS TEXT GENERATOR ───────────────────────────────────────────────
def generate_analysis(home: str, away: str, result: dict, hf: dict, af: dict) -> str:
    lines = []
    h_pts = sum(3 if c=='W' else 1 if c=='D' else 0 for c in result['home_form'])
    a_pts = sum(3 if c=='W' else 1 if c=='D' else 0 for c in result['away_form'])
    lines.append(f"{home} last 5: {''.join(result['home_form'])} ({h_pts}pts). "
                 f"{away} last 5: {''.join(result['away_form'])} ({a_pts}pts).")
    if result['home_win_pct'] > 50:
        lines.append(f"Home advantage strong — {home} win probability {result['home_win_pct']}%.")
    if result['btts_pct'] >= 65:
        lines.append(f"Both teams likely to score ({result['btts_pct']}% BTTS probability).")
    if result['over25_pct'] >= 65:
        lines.append(f"High-scoring match expected — {result['over25_pct']}% Over 2.5 probability.")
    return ' '.join(lines)

# ── 7. TODAY'S UPCOMING MATCHES (edit daily or automate) ─────────────────────
# Format: (home, away, league_key, match_time, is_vip)
TODAYS_MATCHES = [
    ('Arsenal',      'Man City',    'EPL',        '20:00', False),
    ('Real Madrid',  'Bayern Munich','LaLiga',     '21:00', False),
    ('Dortmund',     'Leipzig',     'Bundesliga',  '18:30', False),
    ('Chelsea',      'Liverpool',   'EPL',         '16:30', True ),
    ('PSG',          'Lyon',        'Ligue1',      '20:45', True ),
]

# ── 8. MAIN ───────────────────────────────────────────────────────────────────
def main():
    print('\n🧠 AI Football Hub — Prediction Engine')
    print('=' * 50)
    today = date.today().isoformat()

    # Load data
    print('\n📊 Loading football data...')
    all_data = {}
    for key, (code, label, flag) in LEAGUE_CODES.items():
        df = fetch_csv(code)
        if not df.empty:
            all_data[key] = (df, label, flag)

    if not all_data:
        print('❌ No data loaded. Check internet connection.')
        return

    # Train primary model on EPL (most data)
    primary_key = next(iter(all_data))
    print(f'\n🤖 Training ML model on {primary_key}...')
    primary_df = all_data[primary_key][0]
    features = build_features(primary_df)
    if features.empty:
        print('❌ Feature building failed'); return
    m1, m2, m3 = train(features)

    # Generate predictions
    print('\n⚽ Generating predictions...')
    predictions = []
    teams_in_play = []
    match_map = {}  # team -> [match_id]

    for home, away, league_key, mtime, is_vip in TODAYS_MATCHES:
        df, label, flag = all_data.get(league_key, (primary_df, 'Football', '⚽'))
        result = predict(m1, m2, m3, df, home, away)
        hf_data = team_form(df, home)
        af_data = team_form(df, away)
        analysis = generate_analysis(home, away, result, hf_data, af_data)
        match_id = f"{home.replace(' ','')}-{away.replace(' ','')}-{today}"

        teams_in_play += [home, away]
        match_map.setdefault(home, []).append(match_id)
        match_map.setdefault(away, []).append(match_id)

        row = {
            'id': match_id,
            'home_team': home, 'away_team': away,
            'league': label, 'league_flag': flag,
            'match_date': today, 'match_time': mtime,
            'analysis': analysis,
            'is_vip': is_vip, 'is_featured': not is_vip,
            'source': 'ml_engine', 'result': 'pending',
            'created_at': datetime.utcnow().isoformat(),
            **result
        }
        predictions.append(row)
        status = '⭐ VIP' if is_vip else '🆓 FREE'
        print(f"  {status} {home} vs {away}: {result['pick_label']} ({result['confidence']}% conf)")

    # Scan human factors from Reddit
    print('\n🔍 Scanning human factors (Reddit)...')
    factors = scan_human_factors(list(set(teams_in_play)), match_map)

    # Push to Supabase
    print('\n🚀 Pushing to Supabase...')
    if predictions:
        sb_upsert('predictions', predictions)
    if factors:
        sb_upsert('human_factors', factors)

    print(f'\n✅ Done — {len(predictions)} predictions, {len(factors)} human signals')
    print(f'   Run this script daily at 09:00 for fresh picks\n')

if __name__ == '__main__':
    main()
