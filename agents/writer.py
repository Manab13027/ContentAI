"""Agent 03 — Script Writer
Writes a reel script in the user's voice using validated topic data.
Reads past scripts from scripts/ folder for voice training.
"""

import json
import os
import sys
import glob
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import VALIDATED_FILE, SCRIPT_FILE, OUTPUT_DIR, VOICE_SCRIPTS_DIR, ANTHROPIC_API_KEY


def load_past_scripts() -> str:
    files = glob.glob(f"{VOICE_SCRIPTS_DIR}/*.txt") + glob.glob(f"{VOICE_SCRIPTS_DIR}/*.md")
    if not files:
        return ""
    combined = []
    for i, f in enumerate(files[:30], 1):
        with open(f) as fp:
            combined.append(f"Script {i}:\n{fp.read().strip()}")
    return "\n\n".join(combined)


def build_prompt(topic: str, avg_views: int, past_scripts: str) -> str:
    voice_section = ""
    if past_scripts:
        voice_section = f"""
Here are my past reel scripts — study my voice carefully:

{past_scripts}

After reading, match:
- My vocabulary and words I never use
- My sentence length and rhythm
- My Hinglish mix (Hindi + English blend)
- My energy level
- My structure and CTA style
"""

    return f"""You are my personal script writer. Write a reel script for the topic below.
{voice_section}

TOPIC: {topic}
(This topic has avg {avg_views:,} views in niche — high signal)

RULES:
- Structure: [BEAT 1] → [BEAT 2] → [BEAT 3] → [CTA]
- Each beat: 2-3 sentences max — I talk fast
- Hinglish — natural mix of Hindi and English, not forced
- CTA must be a comment trigger (e.g. "ye topic chahiye toh 'YES' comment karo")
- NO hook — that is handled separately
- Never sound formal or generic
- Shorter is better

Output ONLY the script. No explanations. No labels beyond [BEAT 1] etc.
"""


def write_with_api(prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


def write_without_api(topic: str, avg_views: int, past_scripts: str) -> str:
    """Fallback: save the prompt to a file for manual use in Claude Code."""
    prompt = build_prompt(topic, avg_views, past_scripts)
    prompt_file = f"{OUTPUT_DIR}/writer_prompt.txt"
    with open(prompt_file, "w") as f:
        f.write(prompt)
    return f"[No API key] Prompt saved to {prompt_file} — paste it into Claude Code."


def run(validated: dict = None, topic_override: str = None, log=print) -> str:
    log("=== Agent 03: Script Writer ===")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if validated is None:
        with open(VALIDATED_FILE) as f:
            validated = json.load(f)

    rec = validated.get("recommended_topic", {})
    topic = topic_override or rec.get("topic", "AI tools")
    avg_views = rec.get("avg_views", 0)

    past_scripts = load_past_scripts()
    if past_scripts:
        log(f"  Loaded {len(past_scripts.split('Script '))-1} past scripts for voice training")
    else:
        log("  No past scripts found in scripts/ — writing in default Hinglish style")

    if ANTHROPIC_API_KEY:
        prompt = build_prompt(topic, avg_views, past_scripts)
        log(f"  Writing script for topic: {topic}")
        script = write_with_api(prompt)
    else:
        script = write_without_api(topic, avg_views, past_scripts)

    with open(SCRIPT_FILE, "w") as f:
        f.write(f"# Script: {topic}\n\n{script}")

    log(f"  Script saved → {SCRIPT_FILE}")
    log(f"\n{script}\n")
    return script


if __name__ == "__main__":
    topic = sys.argv[1] if len(sys.argv) > 1 else None
    run(topic_override=topic)
