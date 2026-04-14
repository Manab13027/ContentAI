"""Agent 04 — Hook Generator
Generates 5 Hinglish hook variations for the script topic.
"""

import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import VALIDATED_FILE, HOOKS_FILE, OUTPUT_DIR, ANTHROPIC_API_KEY


HOOK_PATTERNS = [
    ("Aspirational", 'Aisi honi chahiye X — shows the better version'),
    ("Pain point", "Name a frustration the viewer feels right now"),
    ("Exclusivity", '"Log nahi jaante" — insider knowledge feel'),
    ("Time/Money claim", "Specific number, specific result"),
    ("Curiosity gap", "Ask something they cannot answer without watching"),
]


def build_prompt(topic: str, script: str) -> str:
    patterns_text = "\n".join(
        f"  Hook {i+1} ({name}): {desc}"
        for i, (name, desc) in enumerate(HOOK_PATTERNS)
    )
    return f"""Generate exactly 5 Hinglish hooks for this reel topic.

TOPIC: {topic}
SCRIPT CONTEXT:
{script[:500]}

RULES FOR EVERY HOOK:
- Maximum 2 lines
- Must be speakable in under 4 seconds
- Hinglish — natural mix of Hindi and English, not forced
- Never start with "Aaj main" or "Is video mein"

PATTERNS TO USE:
{patterns_text}

FOR EACH HOOK, after writing it, add on the next line:
Pattern: [name] | Confidence: [X/10] | Why: [one sentence]

Output ONLY the 5 hooks with their metadata. No intro text.
"""


def generate_with_api(prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text


def generate_without_api(topic: str, script: str) -> str:
    prompt = build_prompt(topic, script)
    prompt_file = f"{OUTPUT_DIR}/hooks_prompt.txt"
    with open(prompt_file, "w") as f:
        f.write(prompt)
    return f"[No API key] Prompt saved to {prompt_file} — paste it into Claude Code."


def run(validated: dict = None, script: str = "", topic_override: str = None, log=print) -> str:
    log("=== Agent 04: Hook Generator ===")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if validated is None:
        with open(VALIDATED_FILE) as f:
            validated = json.load(f)

    rec = validated.get("recommended_topic", {})
    topic = topic_override or rec.get("topic", "AI tools")

    if ANTHROPIC_API_KEY:
        prompt = build_prompt(topic, script)
        log(f"  Generating 5 hooks for: {topic}")
        hooks = generate_with_api(prompt)
    else:
        hooks = generate_without_api(topic, script)

    with open(HOOKS_FILE, "w") as f:
        f.write(f"# Hooks: {topic}\n\n{hooks}")

    log(f"  Hooks saved → {HOOKS_FILE}")
    log(f"\n{hooks}\n")
    return hooks


if __name__ == "__main__":
    topic = sys.argv[1] if len(sys.argv) > 1 else None
    run(topic_override=topic)
