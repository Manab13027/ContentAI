"""Agent 01 — Content Scraper
Pulls viral posts from Instagram, YouTube, Twitter using Apify.
"""

import json
import requests
from datetime import datetime, timedelta
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import APIFY_TOKEN, KEYWORDS, HANDLES, DAYS_BACK, SCRAPE_FILE, OUTPUT_DIR

BASE_URL = "https://api.apify.com/v2"
HEADERS = {"Content-Type": "application/json"}

# Verified actor IDs
ACTORS = {
    "instagram": "apify~instagram-scraper",
    "youtube":   "streamers~youtube-scraper",
    "twitter":   "quacker~twitter-scraper",
}


def run_actor(actor_id: str, input_data: dict, timeout: int = 120) -> list:
    url = f"{BASE_URL}/acts/{actor_id}/runs?token={APIFY_TOKEN}&waitForFinish={timeout}"
    resp = requests.post(url, headers=HEADERS, json=input_data, timeout=180)
    resp.raise_for_status()
    run_id = resp.json()["data"]["id"]
    items_url = f"{BASE_URL}/actor-runs/{run_id}/dataset/items?token={APIFY_TOKEN}&format=json"
    items_resp = requests.get(items_url, timeout=60)
    items_resp.raise_for_status()
    return items_resp.json()


def scrape_instagram(log=print) -> list:
    log("  Scraping Instagram...")
    results = []
    try:
        hashtags = [k.replace(" ", "").lower() for k in KEYWORDS[:5]]
        data = run_actor(ACTORS["instagram"], {
            "hashtags": hashtags,
            "resultsType": "posts",
            "resultsLimit": 30,
            "addParentData": False,
        })
        for item in data:
            views = item.get("videoViewCount") or item.get("likesCount", 0) * 10
            results.append({
                "platform": "Instagram",
                "format": "Reel" if item.get("type") == "Video" else "Post",
                "hook": (item.get("caption") or "")[:100],
                "caption": item.get("caption") or "",
                "views": views,
                "likes": item.get("likesCount") or 0,
                "comments": item.get("commentsCount") or 0,
                "url": item.get("url") or "",
                "date": item.get("timestamp") or "",
                "author": item.get("ownerUsername") or "",
            })
        log(f"  Instagram: {len(results)} posts")
    except Exception as e:
        log(f"  Instagram error: {e}")
    return results


def scrape_youtube(log=print) -> list:
    log("  Scraping YouTube...")
    results = []
    try:
        data = run_actor(ACTORS["youtube"], {
            "searchKeywords": " ".join(KEYWORDS[:4]),
            "maxResults": 30,
            "dateFilter": "week",
        })
        for item in data:
            results.append({
                "platform": "YouTube",
                "format": "Short" if (item.get("duration") or 999) < 61 else "Video",
                "hook": item.get("title") or "",
                "caption": item.get("description") or "",
                "views": item.get("viewCount") or 0,
                "likes": item.get("likes") or 0,
                "comments": item.get("commentsCount") or 0,
                "url": item.get("url") or "",
                "date": item.get("date") or "",
                "author": item.get("channelName") or "",
            })
        log(f"  YouTube: {len(results)} posts")
    except Exception as e:
        log(f"  YouTube error: {e}")
    return results


def scrape_twitter(log=print) -> list:
    log("  Scraping Twitter/X...")
    results = []
    try:
        since = (datetime.now() - timedelta(days=DAYS_BACK)).strftime("%Y-%m-%d")
        query = " OR ".join(KEYWORDS[:4])
        data = run_actor(ACTORS["twitter"], {
            "searchTerms": [query],
            "maxTweets": 50,
            "since": since,
            "lang": "en",
        })
        for item in data:
            views = item.get("viewCount") or item.get("retweetCount", 0) * 50
            results.append({
                "platform": "Twitter",
                "format": "Tweet",
                "hook": (item.get("text") or "")[:100],
                "caption": item.get("text") or "",
                "views": views,
                "likes": item.get("likeCount") or 0,
                "comments": item.get("replyCount") or 0,
                "url": item.get("url") or "",
                "date": item.get("createdAt") or "",
                "author": item.get("author", {}).get("userName") or "",
            })
        log(f"  Twitter: {len(results)} posts")
    except Exception as e:
        log(f"  Twitter error: {e}")
    return results


def add_metrics(post: dict) -> dict:
    views = post.get("views", 0)
    likes = post.get("likes", 0)
    comments = post.get("comments", 0)
    er = ((likes + comments) / views * 100) if views > 0 else 0
    post["engagement_rate"] = round(er, 2)
    post["viral"] = views >= 100_000 or er >= 5.0
    return post


def run(log=print) -> list:
    log("=== Agent 01: Content Scraper ===")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    all_posts = []
    all_posts.extend(scrape_instagram(log))
    all_posts.extend(scrape_youtube(log))
    all_posts.extend(scrape_twitter(log))

    all_posts = [add_metrics(p) for p in all_posts]
    all_posts.sort(key=lambda x: x["views"], reverse=True)

    with open(SCRAPE_FILE, "w") as f:
        json.dump(all_posts, f, indent=2)

    viral = sum(1 for p in all_posts if p["viral"])
    log(f"  Total: {len(all_posts)} posts, {viral} viral")
    return all_posts


if __name__ == "__main__":
    run()
