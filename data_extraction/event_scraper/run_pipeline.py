#!/usr/bin/env python3
"""End-to-end pipeline runner for data_extraction.

Runs:
  1) Allevents spider -> data/allevents.json
  2) Eventbrite spider (Playwright) -> data/eventbrite.json
  3) District scraper (Playwright) -> data/district.json
  4) Output enhancer -> cleaned_data/*_cleaned.json
  5) Consolidation -> cleaned_data/events_master.json
  6) Load -> Supabase (geocode + upsert)

This is intended to be called from cron.

Usage:
  python3 run_pipeline.py
  python3 run_pipeline.py --skip-eventbrite   # useful for testing
  python3 run_pipeline.py --skip-load         # scrape only
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

# Scraper output files used to detect whether at least one scraper succeeded.
_SCRAPER_OUTPUTS = [
    SCRIPT_DIR / "data" / "allevents.json",
    SCRIPT_DIR / "data" / "eventbrite.json",
    SCRIPT_DIR / "data" / "district.json",
]


def _run(cmd: list[str]) -> None:
    p = subprocess.run(cmd, cwd=SCRIPT_DIR)
    if p.returncode != 0:
        raise SystemExit(p.returncode)


def _run_soft(cmd: list[str], label: str) -> bool:
    """Run a command but only warn on failure (soft fail).

    Returns True if the command succeeded, False otherwise.
    """
    p = subprocess.run(cmd, cwd=SCRIPT_DIR)
    if p.returncode != 0:
        print(
            f"[WARNING] {label} exited with code {p.returncode} — skipping this source.",
            file=sys.stderr,
        )
        return False
    return True


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-allevents", action="store_true")
    parser.add_argument("--skip-eventbrite", action="store_true")
    parser.add_argument("--skip-district", action="store_true")
    parser.add_argument("--skip-enhancer", action="store_true")
    parser.add_argument("--skip-consolidate", action="store_true")
    parser.add_argument("--skip-load", action="store_true")
    parser.add_argument("--skip-geocoding", action="store_true")
    args = parser.parse_args(argv)

    scraper_ok = False  # tracks whether at least one scraper produced output

    if not args.skip_allevents:
        _run_soft([sys.executable, str(SCRIPT_DIR / "run_allevents.py")], "allevents")

    if not args.skip_eventbrite:
        _run_soft([sys.executable, str(SCRIPT_DIR / "run_eventbrite.py")], "eventbrite")

    if not args.skip_district:
        _run_soft([sys.executable, str(SCRIPT_DIR / "run_district.py")], "district")

    # Check that at least one scraper left usable output before continuing.
    scraper_ok = any(p.exists() and p.stat().st_size > 2 for p in _SCRAPER_OUTPUTS)
    if not scraper_ok:
        print(
            "[ERROR] All scrapers failed or produced no output — aborting pipeline.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    if not args.skip_enhancer:
        _run([sys.executable, str(SCRIPT_DIR / "output_enhancer.py")])

    if not args.skip_consolidate:
        _run([sys.executable, str(SCRIPT_DIR / "consolidate_events.py")])

    if not args.skip_load:
        load_cmd = [sys.executable, str(SCRIPT_DIR / "load_to_supabase.py")]
        if args.skip_geocoding:
            load_cmd.append("--skip-geocoding")
        _run(load_cmd)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
