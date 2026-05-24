#!/usr/bin/env python3
"""
AI Football Hub — Daily Scheduler
Run this once. It runs predictions at 9am and alerts at 10am daily.

Usage:
  python predictor/scheduler.py

On Windows: python predictor/scheduler.py
On Mac/Linux: python3 predictor/scheduler.py
Or add to cron: 0 9 * * * /usr/bin/python3 /path/to/run_daily.py
"""

import time, subprocess, sys
from datetime import datetime

JOBS = [
    { 'hour': 9,  'minute': 0,  'script': 'predictor/run_daily.py',  'label': '🧠 ML Predictions' },
    { 'hour': 10, 'minute': 0,  'script': 'predictor/alert_bot.py',  'label': '📲 Telegram Alerts' },
    { 'hour': 14, 'minute': 0,  'script': 'predictor/alert_bot.py',  'label': '📲 Afternoon Alerts' },
    { 'hour': 17, 'minute': 0,  'script': 'predictor/alert_bot.py',  'label': '📲 Evening Alerts' },
]

run_today = set()

def should_run(job: dict) -> bool:
    now = datetime.now()
    key = f"{job['script']}-{now.date()}-{job['hour']}:{job['minute']}"
    if now.hour == job['hour'] and now.minute == job['minute'] and key not in run_today:
        run_today.add(key)
        return True
    return False

def run_job(job: dict):
    print(f"\n{'='*40}")
    print(f"⏰ {datetime.now().strftime('%H:%M')} — Running {job['label']}")
    print(f"{'='*40}")
    try:
        result = subprocess.run(
            [sys.executable, job['script']],
            capture_output=False,
            timeout=120
        )
        if result.returncode == 0:
            print(f"✅ {job['label']} completed successfully")
        else:
            print(f"⚠️  {job['label']} exited with code {result.returncode}")
    except subprocess.TimeoutExpired:
        print(f"⏱️  {job['label']} timed out after 120s")
    except Exception as e:
        print(f"❌ {job['label']} error: {e}")

print("\n🚀 AI Football Hub Scheduler Started")
print(f"   Jobs scheduled: {[j['label'] for j in JOBS]}")
print("   Press Ctrl+C to stop\n")

while True:
    for job in JOBS:
        if should_run(job):
            run_job(job)
    time.sleep(30)  # check every 30 seconds
