# Bangalore Events Data Extraction

Automated web scraping system that extracts events from multiple sources in Bangalore and consolidates them into a unified JSON database.

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Linux/macOS Setup

**Option 1: Without Virtual Environment (Global Install)**
```bash
cd data_extraction
pip3 install -r requirements.txt
playwright install chromium
```

**Option 2: With Virtual Environment (Recommended)**
```bash
cd BangaloreNow  # Project root
python3 -m venv venv
source venv/bin/activate
pip install -r data_extraction/requirements.txt
playwright install chromium
```

### Windows Setup

**Option 1: Without Virtual Environment (Global Install)**
```cmd
cd data_extraction
pip install -r requirements.txt
playwright install chromium
```

**Option 2: With Virtual Environment (Recommended)**
```cmd
cd BangaloreNow  # Project root
python -m venv venv
venv\Scripts\activate
pip install -r data_extraction\requirements.txt
playwright install chromium
```

### Verify Installation
```bash
python3 -m scrapy version  # Linux/macOS
python -m scrapy version   # Windows
playwright --version
```

## Quick Start

### Linux/macOS

```bash
cd event_scraper

# Grab each source separately
python3 run_allevents.py      # Pull allevents.in listings
python3 run_eventbrite.py     # Pull eventbrite.com listings

# Merge everything into the master file
python3 consolidate_events.py

# Optional: refresh Eventbrite every 3 hours
python3 schedule_eventbrite.py  # Keep Eventbrite in sync
```

### Windows

```cmd
cd event_scraper

REM Grab each source separately
python run_allevents.py      REM Pull allevents.in listings
python run_eventbrite.py     REM Pull eventbrite.com listings

REM Merge everything into the master file
python consolidate_events.py

REM Optional: refresh Eventbrite every 3 hours
python schedule_eventbrite.py  REM Keep Eventbrite in sync
```

**Note**: The scripts automatically detect and use virtual environment if present at `../venv/`. Otherwise, they use system Python.

## Execution Times

- **allevents.in scraper**: ~2-3 minutes (77 events across ~10 pages)
- **eventbrite.com scraper**: ~3-5 minutes (18 events across ~20 pages, Playwright rendering adds overhead)
- **Consolidation script**: ~5-10 seconds (merges & deduplicates)
- **Total end-to-end run**: ~5-8 minutes

*Times may vary based on network speed and system performance.*

## Data Files

```
event_scraper/data/
├── allevents.json       ← allevents.in events
├── eventbrite.json      ← eventbrite.com events
└── events_master.json   ← CONSOLIDATED: All sources (95 events)
```

## Architecture

### Scrapers (90-day window)
- `event_scraper/spiders/allevents.py` - Scrapes allevents.in
- `event_scraper/spiders/eventbrite.py` - Scrapes eventbrite.com (with Playwright for JS rendering)

### Runners (Cross-platform: Linux/macOS/Windows)
- `run_allevents.py` - Execute allevents scraper
- `run_eventbrite.py` - Execute eventbrite scraper
- `consolidate_events.py` - Merge all sources into master
- `schedule_eventbrite.py` - Auto-run every 3 hours (optional)

### Logs
All runs logged with timestamps: `event_scraper/logs/`

## Event Data Structure

```json
{
  "event_id": "unique_id",
  "event_key": "source:id",
  "event_name": "Event Title",
  "event_url": "https://...",
  "source": "allevents.in" | "eventbrite",
  "start_date": "2026-01-30",
  "start_time": "18:00",
  "end_date": "2026-01-30",
  "end_time": "20:00",
  "venue_name": "Venue Name",
  "venue_address": "Full Address",
  "organizer_name": "Organizer",
  "categories": "Business, Networking",
  "description": "Event description...",
  "ticket_price": "₹500" | "Free",
  "ticket_url": "https://...",
  "city": "Bangalore",
  "source_url": "https://...",
  "last_updated": "2026-01-17T20:00:00.000000"
}
```

## Field Coverage (Master File: 95 events)

| Field | Coverage | Notes |
|-------|----------|-------|
| event_id | 100% | Always present |
| event_name | 100% | Always present |
| start_date | 100% | Always present |
| start_time | 100% | Always present |
| venue_address | 90% | Most events have address |
| venue_name | 81% | Most events have venue |
| end_date | 78% | When available on source |
| end_time | 78% | When available on source |
| categories | 45% | Varies by source |
| organizer_name | 34% | Not always listed |
| ticket_url | 32% | When tickets available |
| ticket_price | 25% | Often not disclosed |

## Sources Breakdown

- **allevents.in**: 77 events (81%)
- **eventbrite.com**: 18 events (19%)

**Date Range**: 90 days from current date

## Dependencies

See Installation & Setup section above for detailed instructions.

**Core Dependencies:**
- scrapy >= 2.14.0
- scrapy-playwright >= 0.0.45
- playwright >= 1.57.0
- itemadapter >= 0.13.0
- python-dotenv >= 1.0.0

## Notes

- **Deduplication**: Events merged by `event_key` (source:event_id)
- **Updates**: Each run overwrites source JSON files
- **Consolidation**: Run `consolidate_events.py` after scraping to merge
- **Scheduling**: Use `schedule_eventbrite.py` for automated runs
- **Logs**: All runs logged in `event_scraper/logs/` with timestamps

## Troubleshooting

**Playwright issues?**
```bash
playwright install chromium
```

**Python not found?**
- Ensure Python 3.8+ is installed: `python3 --version` (Linux/macOS) or `python --version` (Windows)
- Download from https://www.python.org/downloads/

**Permission denied (Linux/macOS)?**
```bash
chmod +x event_scraper/*.py
```

**Module not found?**
- If using venv: Ensure it's activated before running scripts
- If global: Reinstall dependencies with `pip install -r requirements.txt`

**Virtual environment not detected?**
- Venv must be at `../venv/` relative to event_scraper directory
- Or just use system Python (venv is optional)
