"""Agent 02 — Validation Agent
Scores, filters, and clusters posts. Outputs ranked topic recommendations.
"""

import json
import os
import sys
from collections import defaultdict
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import MIN_VIEWS, MIN_ENGAGEMENT_RATE, SCRAPE_FILE, VALIDATED_FILE, OUTPUT_DIR, KEYWORDS

TOPIC_MAP = {
    "ai": ["ai", "artificial intelligence", "chatgpt", "claude", "gpt", "llm", "machine learning", "ml"],
    "drones": ["drone", "uav", "fpv", "quadcopter", "aerial"],
    "automation": ["automation", "automate", "workflow", "n8n", "zapier", "no-code"],
    "coding": ["code", "coding", "programming", "developer", "vibe coding", "claude code"],
    "technology": ["tech", "technology", "gadget", "device", "innovation", "startup"],
}


def score_post(post: dict) -> float:
    views = post.get("views", 0)
    er = post.get("engagement_rate", 0)
    comments = post.get("comments", 0)

    view_score = min(views / 100_000, 1.0) * 40
    er_score = min(er / 10.0, 1.0) * 35
    comment_score = min(comments / 1000, 1.0) * 25
    return round(view_score + er_score + comment_score, 1)


def classify_topic(post: dict) -> str:
    text = (post.get("hook", "") + " " + post.get("caption", "")).lower()
    for topic, keywords in TOPIC_MAP.items():
        if any(kw in text for kw in keywords):
            return topic
    return "general"


def filter_posts(posts: list) -> list:
    filtered = []
    for p in posts:
        if p.get("views", 0) < MIN_VIEWS:
            continue
        if p.get("engagement_rate", 0) < MIN_ENGAGEMENT_RATE:
            continue
        filtered.append(p)
    return filtered


def cluster_by_topic(posts: list) -> dict:
    clusters = defaultdict(list)
    for p in posts:
        topic = classify_topic(p)
        clusters[topic].append(p)
    return dict(clusters)


def rank_topics(clusters: dict) -> list:
    ranked = []
    for topic, posts in clusters.items():
        avg_views = sum(p["views"] for p in posts) / len(posts)
        avg_er = sum(p["engagement_rate"] for p in posts) / len(posts)
        viral_count = sum(1 for p in posts if p.get("viral"))
        ranked.append({
            "topic": topic,
            "post_count": len(posts),
            "avg_views": int(avg_views),
            "avg_er": round(avg_er, 2),
            "viral_count": viral_count,
            "sustained": viral_count >= 3,
        })
    ranked.sort(key=lambda x: x["avg_views"], reverse=True)
    return ranked


def top_formats(posts: list) -> list:
    format_stats = defaultdict(lambda: {"views": 0, "count": 0})
    for p in posts:
        fmt = p.get("format", "Unknown")
        format_stats[fmt]["views"] += p.get("views", 0)
        format_stats[fmt]["count"] += 1
    result = []
    for fmt, stats in format_stats.items():
        result.append({
            "format": fmt,
            "avg_views": int(stats["views"] / stats["count"]),
            "count": stats["count"],
        })
    result.sort(key=lambda x: x["avg_views"], reverse=True)
    return result[:3]


def run(posts: list = None, log=print) -> dict:
    log("=== Agent 02: Validation Agent ===")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if posts is None:
        with open(SCRAPE_FILE) as f:
            posts = json.load(f)

    scored = []
    for p in posts:
        p["score"] = score_post(p)
        scored.append(p)

    filtered = filter_posts(scored)
    log(f"  {len(posts)} posts → {len(filtered)} after filtering")

    clusters = cluster_by_topic(filtered)
    ranked = rank_topics(clusters)
    formats = top_formats(filtered)

    # Recommendation: top topic with highest sustained signal
    recommended = next(
        (t for t in ranked if t["sustained"]),
        ranked[0] if ranked else {"topic": "AI tools", "avg_views": 0}
    )

    output = {
        "total_posts": len(filtered),
        "ranked_topics": ranked,
        "top_formats": formats,
        "recommended_topic": recommended,
        "clusters": {k: v for k, v in clusters.items()},
    }

    with open(VALIDATED_FILE, "w") as f:
        json.dump(output, f, indent=2)

    # Print summary table
    log(f"\n  {'Topic':<15} {'Posts':>5} {'Avg Views':>12} {'Avg ER':>8} {'Viral':>6}")
    log("  " + "-" * 50)
    for t in ranked[:5]:
        flag = " SUSTAINED" if t["sustained"] else ""
        log(f"  {t['topic']:<15} {t['post_count']:>5} {t['avg_views']:>12,} {t['avg_er']:>7}% {t['viral_count']:>6}{flag}")

    log(f"\n  Recommendation: Make a reel about [{recommended['topic'].upper()}]")
    log(f"  Top formats: {', '.join(f['format'] for f in formats)}")

    return output


if __name__ == "__main__":
    run()
