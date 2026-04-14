import os
from dotenv import load_dotenv

load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_TOKEN")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Your accounts
HANDLES = {
    "instagram": "active_jedi",
    "twitter": "active_jedi",
    "youtube": "active_jedi",
}

# Keywords to search across platforms
KEYWORDS = [
    "technology",
    "AI",
    "machine learning",
    "Claude",
    "drones",
    "AI tools",
    "automation",
]

# Scraper settings
DAYS_BACK = 7
MIN_VIEWS = 10_000
MIN_ENGAGEMENT_RATE = 2.0   # percent
VIRAL_VIEWS = 100_000
VIRAL_ER = 5.0              # percent

# Output paths
OUTPUT_DIR = "output"
SCRAPE_FILE = f"{OUTPUT_DIR}/scraped.json"
VALIDATED_FILE = f"{OUTPUT_DIR}/validated.json"
SCRIPT_FILE = f"{OUTPUT_DIR}/script.md"
HOOKS_FILE = f"{OUTPUT_DIR}/hooks.md"
VOICE_SCRIPTS_DIR = "scripts"
