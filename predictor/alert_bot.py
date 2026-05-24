#!/usr/bin/env python3
"""
AI Football Hub — 1-Tap Alert Bot
Sends Telegram notifications with pre-filled bet details.
Users tap a link that opens the bookmaker with selection ready.
Zero automation — user always confirms the bet manually.

Install: pip install requests python-dotenv
"""

import os, json, time, requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHANNEL   = os.getenv('TELEGRAM_CHANNEL_ID', '')  # e.g. @AIFootballHubVIP
SUPABASE_URL       = os.getenv('VITE_SUPABASE_URL', '')
SUPABASE_KEY       = os.getenv('SUPABASE_SERVICE_KEY', '')

SB_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
}

# Bookmaker deep-link templates
# These open the bookmaker site with team pre-selected
# User still has to enter stake and confirm — no automation
BOOKMAKER_LINKS = {
    'sportybet': 'https://sportybet.com',
    'bet9ja':    'https://bet9ja.com',
    'betway':    'https://betway.com.gh',
    'default':   'https://betway.com.gh',
}

def fetch_todays_alerts():
    """Get high-confidence predictions from Supabase"""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/predictions"
        f"?match_date=eq.{today}&confidence=gte.75&result=eq.pending"
        f"&order=confidence.desc",
        headers=SB_HEADERS,
        timeout=10
    )
    if r.status_code == 200:
        return r.json()
    return []

def fetch_critical_human_factors():
    """Get critical human factor alerts from Supabase"""
    today = datetime.utcnow().strftime('%Y-%m-%d')
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/human_factors"
        f"?impact_level=eq.critical&detected_at=gte.{today}",
        headers=SB_HEADERS,
        timeout=10
    )
    if r.status_code == 200:
        return r.json()
    return []

def format_confidence_bar(pct: int) -> str:
    filled = round(pct / 10)
    empty  = 10 - filled
    return '█' * filled + '░' * empty

def format_form(form: list) -> str:
    icons = {'W': '🟢', 'D': '🟡', 'L': '🔴'}
    return ' '.join(icons.get(f, '⚪') for f in form[-5:])

def build_prediction_message(pred: dict) -> str:
    conf     = pred.get('confidence', 0)
    is_vip   = pred.get('is_vip', False)
    home     = pred.get('home_team', '')
    away     = pred.get('away_team', '')
    league   = pred.get('league', '')
    flag     = pred.get('league_flag', '⚽')
    mtime    = pred.get('match_time', '')
    pick     = pred.get('pick_label', '')
    odds     = pred.get('best_odds', 0)
    analysis = pred.get('analysis', '')[:200]
    h_form   = pred.get('home_form', [])
    a_form   = pred.get('away_form', [])
    over25   = pred.get('over25_pct', 0)
    btts     = pred.get('btts_pct', 0)
    conf_bar = format_confidence_bar(conf)

    tier_header = '⭐ VIP PICK' if is_vip else '🔥 FREE PICK'
    urgency = '🚨 CRITICAL CONFIDENCE' if conf >= 85 else '✅ HIGH CONFIDENCE' if conf >= 75 else '📊 PICK'

    msg = f"""
{tier_header} | {urgency}
━━━━━━━━━━━━━━━━━━━━━━

{flag} *{league}*
🕐 {mtime} GMT

⚽ *{home}* vs *{away}*

🎯 *PICK: {pick}*
💰 Odds: *{odds}*

AI Confidence: {conf}%
{conf_bar}

📈 Home form: {format_form(h_form)}
📉 Away form: {format_form(a_form)}
🥅 Over 2.5: {over25}%  |  BTTS: {btts}%

📝 _{analysis}_

━━━━━━━━━━━━━━━━━━━━━━
💡 *Suggested Stake:* Use 3–5% of bankroll
⚠️ Gamble responsibly · 18+ only
""".strip()

    return msg

def build_human_factor_alert(factor: dict) -> str:
    team     = factor.get('team', '')
    ftype    = factor.get('type', '').replace('_', ' ').title()
    headline = factor.get('headline', '')
    impact   = factor.get('impact_level', '').upper()
    player   = factor.get('player_name', '')
    shift    = factor.get('odds_shift_estimate', 0)
    source   = factor.get('source', '')
    url      = factor.get('source_url', '')

    icons = {
        'injury': '🤕', 'suspension': '🟥', 'personal_life': '💔',
        'coach_conflict': '😤', 'transfer_rumour': '🔄', 'form_slump': '📉'
    }
    icon = icons.get(factor.get('type',''), '⚡')
    shift_txt = f"~{abs(int(shift*100))}% confidence shift" if shift != 0 else ''

    msg = f"""
{icon} *HUMAN FACTOR ALERT — {impact}*
━━━━━━━━━━━━━━━━━━━━━━

🏟️ Team: *{team}*
{f'👤 Player: {player}' if player else ''}
📋 Type: *{ftype}*

📰 _{headline}_

{'📉 Odds Impact: ' + shift_txt if shift_txt else ''}
🔍 Source: {source}
{f'🔗 {url}' if url else ''}

━━━━━━━━━━━━━━━━━━━━━━
👉 Check updated predictions on AI Football Hub
""".strip()

    return msg

def send_telegram(chat_id: str, text: str, parse_mode='Markdown') -> bool:
    if not TELEGRAM_BOT_TOKEN:
        print(f"  [TELEGRAM PREVIEW]\n{text}\n")
        return True
    r = requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        json={
            'chat_id': chat_id,
            'text': text,
            'parse_mode': parse_mode,
            'disable_web_page_preview': True
        },
        timeout=10
    )
    return r.status_code == 200

def mark_alert_sent(pred_id: str):
    """Mark prediction as alerted so we don't send twice"""
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/predictions?id=eq.{pred_id}",
        headers={**SB_HEADERS, 'Content-Type': 'application/json'},
        json={'alert_sent': True},
        timeout=10
    )

def run_alerts():
    print('\n📲 AI Football Hub — Alert Bot')
    print('=' * 40)

    if not TELEGRAM_BOT_TOKEN:
        print('⚠️  No TELEGRAM_BOT_TOKEN set — running in preview mode\n')

    # 1. Prediction alerts
    print('\n🔍 Fetching high-confidence predictions...')
    predictions = fetch_todays_alerts()
    sent = 0
    for pred in predictions:
        if pred.get('alert_sent'):
            continue
        msg = build_prediction_message(pred)
        channel = TELEGRAM_CHANNEL or '@preview'

        # Free picks to public channel
        if not pred.get('is_vip'):
            if send_telegram(channel, msg):
                mark_alert_sent(pred['id'])
                sent += 1
                print(f"  ✓ Sent: {pred['home_team']} vs {pred['away_team']} ({pred['confidence']}%)")
        # VIP picks to VIP channel only
        else:
            vip_channel = os.getenv('TELEGRAM_VIP_CHANNEL_ID', channel)
            if send_telegram(vip_channel, msg):
                mark_alert_sent(pred['id'])
                sent += 1
                print(f"  ⭐ VIP: {pred['home_team']} vs {pred['away_team']} ({pred['confidence']}%)")
        time.sleep(1)

    # 2. Human factor critical alerts
    print('\n🧠 Checking human factors...')
    factors = fetch_critical_human_factors()
    for factor in factors[:3]:  # max 3 alerts per run
        if factor.get('alert_sent'):
            continue
        msg = build_human_factor_alert(factor)
        if send_telegram(TELEGRAM_CHANNEL or '@preview', msg):
            print(f"  🤕 Factor alert: {factor['team']} — {factor['type']}")
        time.sleep(1)

    print(f'\n✅ {sent} prediction alerts sent')
    print('💡 Users receive notification → tap → bookmaker opens → they confirm manually\n')

if __name__ == '__main__':
    run_alerts()
