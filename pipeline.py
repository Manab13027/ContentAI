"""Full 4-Agent Pipeline
Run: python pipeline.py
Run with topic: python pipeline.py "AI drone automation"
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents import scraper, validator, writer, hooks


def run(topic: str = None):
    print("\n" + "=" * 50)
    print("  CONTENT AI — 4-AGENT PIPELINE")
    print("=" * 50)

    # Agent 01 — Scrape
    posts = scraper.run()

    # Agent 02 — Validate
    validated = validator.run(posts)

    # Agent 03 — Write Script
    script = writer.run(validated, topic_override=topic)

    # Agent 04 — Generate Hooks
    hooks.run(validated, script=script, topic_override=topic)

    print("\n" + "=" * 50)
    print("  DONE. Files saved in output/")
    print("  - output/scraped.json")
    print("  - output/validated.json")
    print("  - output/script.md")
    print("  - output/hooks.md")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    topic = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else None
    run(topic)
