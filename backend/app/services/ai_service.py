"""
AI Article Generation Service v3.0 - Multi-Layer Newsroom Pipeline
==================================================================

Implements a 5-layer "Newsroom Workflow" using Gemini free tier models:
  Layer 1 (Router):       Decide which writer persona to use
  Layer 2 (Architect):    Write structured 700-word draft
  Layer 3 (Humanizer):    Split & humanize each chunk separately
  Layer 4 (Polisher):     Final flow check, grammar, paragraph breaks
  Layer 5 (SEO):          Generate meta title, meta description, tags

Plus 7 distinct writer personas and smart embed search.
"""
import httpx
import logging
import random
import re
from typing import Optional
from datetime import datetime
from app.config import settings
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

# ============================================================
# 7 Writer Personas - each with a unique voice and specialty
# ============================================================

AUTHOR_PROFILES = [
    {
        "name": "Marcus Johnson",
        "slug": "marcus-johnson",
        "title": "Senior NBA Analyst",
        "bio": "Marcus brings over 15 years of experience covering the NBA, from courtside at Madison Square Garden to the finals in LA. Known for his deep statistical analysis and insider connections.",
        "specialty": "NBA",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
        "social_twitter": "@marcusjohnson_nba",
        "persona_name": "The Stat Geek",
        "persona_style": (
            "Marcus Johnson, 'The Stat Geek', lives and breathes numbers. "
            "He liberally uses advanced metrics like PER, true shooting percentage, field goal percentage, "
            "usage rate, box plus/minus, and win shares. Every claim is backed by a stat. "
            "He compares players using statistical percentiles and historical averages. "
            "His sentences often lead with a number: 'Shooting 47.3% from the field...' or 'With a PER of 28.4...' "
            "He references analytics the way a poet references nature — constantly and naturally."
        ),
    },
    {
        "name": "Sarah Mitchell",
        "slug": "sarah-mitchell",
        "title": "NFL & College Football Expert",
        "bio": "Sarah has been breaking down NFL and NCAAF games for over a decade. A former collegiate player herself, she brings unique perspective from the field to the press box.",
        "specialty": "NFL",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        "social_twitter": "@sarahmitchell_nfl",
        "persona_name": "The Insider",
        "persona_style": (
            "Sarah Mitchell, 'The Insider', focuses on the stories behind the stories. "
            "She leads with trade rumors, locker room dynamics, and official statements from coaches and GMs. "
            "She phrases things like 'Sources tell me...' and 'Inside the organization, there's a growing sense that...' "
            "She references contract details, salary cap implications, and front-office strategy. "
            "Her tone is authoritative but conversational, like a trusted colleague giving you the real scoop."
        ),
    },
    {
        "name": "David Chen",
        "slug": "david-chen",
        "title": "MLB & NHL Correspondent",
        "bio": "David covers America's pastime and the fastest game on ice. His data-driven approach to baseball analytics and hockey analytics has made him a trusted voice in both sports.",
        "specialty": "MLB",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        "social_twitter": "@davidchen_sports",
        "persona_name": "The Analyst",
        "persona_style": (
            "David Chen, 'The Analyst', is balanced and methodical. "
            "He breaks down tactics, formations, and play-by-play sequences. "
            "He uses phrases like 'If you look at the tape...' and 'The key adjustment was...' "
            "He presents both sides of an argument before arriving at a measured conclusion. "
            "His writing is structured like a whitepaper: thesis, evidence, counterargument, synthesis. "
            "He references WAR, FIP, xG, Corsi, and other analytical frameworks naturally."
        ),
    },
    {
        "name": "Emily Rodriguez",
        "slug": "emily-rodriguez",
        "title": "F1 & Motorsport Specialist",
        "bio": "Emily has covered Formula 1 from every circuit on the calendar. Born in Sao Paulo and raised near Interlagos, racing is in her blood. She provides unparalleled insight into the world of motorsport.",
        "specialty": "F1",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
        "social_twitter": "@emilyrodriguez_f1",
        "persona_name": "The Storyteller",
        "persona_style": (
            "Emily Rodriguez, 'The Storyteller', writes with dramatic flair and emotional depth. "
            "She describes scenes cinematically: 'As the lights went out at Monza, the roar of twenty engines "
            "shook the grandstands like thunder...' She weaves narratives around drivers' personal journeys, "
            "rivalries, and the human drama behind the stopwatch. She uses metaphors freely, "
            "builds tension paragraph by paragraph, and delivers emotional payoff. "
            "Her pieces read like a novel chapter, not a race report."
        ),
    },
    {
        "name": "James O'Brien",
        "slug": "james-obrien",
        "title": "MMA & Boxing Analyst",
        "bio": "James is a third-degree black belt and former amateur boxer who transitioned to sports journalism. His technical breakdowns of fights are must-reads for combat sports fans worldwide.",
        "specialty": "MMA",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        "social_twitter": "@jamesobrien_mma",
        "persona_name": "The Hot-Take Artist",
        "persona_style": (
            "James O'Brien, 'The Hot-Take Artist', is aggressive, punchy, and unapologetic. "
            "He opens with bold one-liners: 'That fight was a robbery, period.' or 'He's done. Washed. Next.' "
            "He uses short, punchy sentences. Exclamation points are his friend. "
            "He makes controversial predictions and doubles down. "
            "He references knockout times, significant strike differentials, and fight IQ. "
            "His tone is what you'd hear at a sports bar — loud, confident, and entertaining."
        ),
    },
    {
        "name": "Priya Sharma",
        "slug": "priya-sharma",
        "title": "Cricket & International Sports Writer",
        "bio": "Priya grew up watching cricket in Mumbai and now covers the sport globally. From Test matches to T20 leagues, she brings passion and expertise to every match report and analysis piece.",
        "specialty": "Cricket",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
        "social_twitter": "@priyasharma_cr",
        "persona_name": "The Historian",
        "persona_style": (
            "Priya Sharma, 'The Historian', constantly draws parallels to the past. "
            "She references legends from the 90s and 2000s: 'Not since Sachin\\'s 1998 Sharjah desert storm "
            "have we seen...' She compares current players to historical greats, cites memorable innings from "
            "decades ago, and contextualizes every moment within cricket\\'s rich tapestry. "
            "She uses phrases like 'Rewind to 2003...' and 'History repeated itself today...' "
            "Her writing has a nostalgic, reverent quality that honors the game\\'s traditions."
        ),
    },
    {
        "name": "Alex Thompson",
        "slug": "alex-thompson",
        "title": "Multi-Sport Featured Columnist",
        "bio": "Alex is the ultimate utility player, covering everything from March Madness to the World Series. With 20 years in sports media, Alex brings a broad perspective and sharp writing to every story.",
        "specialty": "Multi-sport",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        "social_twitter": "@alexthompson_sports",
        "persona_name": "The Casual Fan",
        "persona_style": (
            "Alex Thompson, 'The Casual Fan', writes like your smartest friend explaining sports over a beer. "
            "No heavy jargon, no overwrought analysis — just clear, fun, accessible writing. "
            "He uses analogies from everyday life: 'Think of it like your fantasy league, but with real stakes.' "
            "He asks the questions a fan would ask and answers them simply. "
            "His tone is warm, humorous, and inclusive — he never talks down to the reader. "
            "He might say 'Look, I'm no analytics nerd, but even I can see this guy is different.'"
        ),
    },
]

# Sport -> Author specialty mapping
SPORT_AUTHOR_MAP = {
    "NBA": "NBA",
    "nba": "NBA",
    "NFL": "NFL",
    "nfl": "NFL",
    "MLB": "MLB",
    "mlb": "MLB",
    "NHL": "MLB",        # David Chen covers both
    "nhl": "MLB",
    "NCAAF": "NFL",       # Sarah covers both
    "ncaaf": "NFL",
    "NCAAB": "NBA",       # Marcus covers both
    "ncaab": "NBA",
    "Formula 1": "F1",
    "F1": "F1",
    "f1": "F1",
    "MMA": "MMA",
    "mma": "MMA",
    "Boxing": "MMA",      # James covers both
    "boxing": "MMA",
    "Cricket": "Cricket",
    "cricket": "Cricket",
}

# Article categories with system prompts for variety
ARTICLE_CATEGORIES = [
    {
        "category": "news",
        "system_prompt": "You are a breaking news reporter. Write a factual, urgent news article with a clear lead, supporting details, and quotes. Use inverted pyramid structure. Focus on what just happened and why it matters.",
    },
    {
        "category": "analysis",
        "system_prompt": "You are a data-driven analyst. Write a deep analytical piece using statistics, trends, and performance metrics. Break down the numbers and explain what they mean. Use specific stats and comparisons.",
    },
    {
        "category": "preview",
        "system_prompt": "You are a match preview writer. Write an engaging preview that builds anticipation. Cover key matchups, storylines, what to watch for, and make a prediction. Use energetic, forward-looking language.",
    },
    {
        "category": "recap",
        "system_prompt": "You are a game recap specialist. Write a comprehensive recap covering the key moments, turning points, standout performers, and what the result means going forward. Include specific plays and sequences.",
    },
    {
        "category": "opinion",
        "system_prompt": "You are a bold opinion columnist. Write a provocative, well-argued opinion piece that takes a clear stance. Back up your argument with evidence. Be confident and conversational.",
    },
    {
        "category": "feature",
        "system_prompt": "You are a longform feature writer. Write an immersive, narrative-driven feature that tells a story. Use descriptive language, human interest angles, and bring the subject to life.",
    },
    {
        "category": "power_rankings",
        "system_prompt": "You are a power rankings expert. Write an authoritative ranking with justifications for each position. Use recent performance, strength of schedule, and eye test to justify placements.",
    },
]


# ============================================================
# Gemini REST API Helper
# ============================================================

async def call_gemini_api(
    model: str,
    prompt: str,
    system_instruction: str = "",
    temperature: float = 0.8,
    max_tokens: int = 2048,
    model_key: str = "",
) -> Optional[str]:
    """
    Call the Google Gemini REST API.
    Uses rate limiter to track usage per model per day.
    Returns the generated text or None on error.
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not configured")
        return None

    # Determine rate limit key
    if not model_key:
        model_key = model

    # Check and record rate limit
    try:
        rate_limiter.record_call(model_key)
    except RuntimeError as e:
        logger.error(f"Rate limit hit: {e}")
        return None

    url = f"{settings.GEMINI_API_BASE}/{model}:generateContent?key={settings.GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }

    # Add system instruction if provided
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                # Filter out "thought" parts (internal reasoning from thinking models)
                # Models like gemini-2.5-flash and gemma-4-31b-it include thought parts
                # with {"thought": true} that contain internal reasoning, not actual output.
                actual_parts = [p for p in parts if not p.get("thought", False)]
                
                if actual_parts:
                    text = actual_parts[0].get("text")
                    if text:
                        return text
                
                # Fallback: if no non-thought parts, try first part anyway
                # (some models may not use the thought flag)
                if parts:
                    text = parts[-1].get("text")  # Last part is usually the actual response
                    if text:
                        logger.warning(f"Gemini response had only thought-flagged parts for {model}, using last part")
                        return text

            # Check for block reason
            block_reason = data.get("promptFeedback", {}).get("blockReason")
            if block_reason:
                logger.warning(f"Gemini blocked: {block_reason}")

            return None

    except httpx.HTTPStatusError as e:
        logger.error(f"Gemini API HTTP error ({model}): {e.response.status_code} - {e.response.text[:500]}")
        return None
    except Exception as e:
        logger.error(f"Gemini API error ({model}): {e}")
        return None


# ============================================================
# Layer 1: Router - Decide which writer persona to use
# ============================================================

async def route_to_writer(topic: str, sport_name: str) -> dict:
    """
    Layer 1: Use Gemini (gemma-4-31b-it) to decide which writer persona fits the topic best.
    Falls back to sport-based mapping if API unavailable.
    """
    writer_names = [a["name"] for a in AUTHOR_PROFILES]
    writer_descriptions = []
    for a in AUTHOR_PROFILES:
        writer_descriptions.append(f"- {a['name']} ({a['persona_name']}): {a['persona_style'][:120]}...")

    prompt = f"""You are the editor-in-chief of SportSurge, assigning a writer to cover a story.

Topic: {topic}
Sport: {sport_name}

Available writers:
{chr(10).join(writer_descriptions)}

Which writer is the BEST fit for this topic? Consider the sport, the angle of the story, and which writer's voice would produce the most engaging article.

Reply with ONLY the writer's full name, nothing else. Choose from: {', '.join(writer_names)}"""

    result = await call_gemini_api(
        model=settings.MODEL_ROUTER,
        prompt=prompt,
        system_instruction="You are an editor assigning stories. Reply with ONLY a name.",
        temperature=0.3,
        max_tokens=50,
        model_key="gemma-4-31b-it",
    )

    if result:
        # Clean up the response - extract just the name
        result = result.strip().strip('"').strip("'")
        for author in AUTHOR_PROFILES:
            if author["name"].lower() in result.lower():
                logger.info(f"Layer 1 (Router): Assigned {author['name']} to '{topic}'")
                return author

    # Fallback: use sport-based mapping
    logger.info(f"Layer 1 (Router): Fallback to sport-based mapping for '{topic}'")
    return get_author_for_sport(sport_name)


async def generate_secondary_keywords(topic: str, sport_name: str) -> list[str]:
    """
    Generate 3-4 relevant secondary SEO keywords for the primary topic.
    """
    prompt = f"Topic: {topic}\nSport: {sport_name}\nProvide exactly 3-4 relevant secondary SEO keywords for this topic, separated by commas. Return ONLY the comma-separated keywords."
    res = await call_gemini_api(
        model=settings.MODEL_ROUTER,
        prompt=prompt,
        system_instruction="You are an SEO assistant. Reply with only comma-separated keywords.",
        temperature=0.3,
        max_tokens=100,
        model_key="gemma-4-31b-it",
    )
    if res:
        return [k.strip() for k in res.split(",") if k.strip()]
    return [sport_name, "news", "analysis"]


# ============================================================
# Layer 2: Architect - Write structured draft + SEO metadata
# ============================================================

async def write_draft(topic: str, sport_name: str, category_info: dict, author: dict, secondary_keywords: list[str]) -> dict:
    """
    Layer 2: Generate SEO metadata (catchy clickbait title, desc, tags) AND the structured draft.
    Word count is randomized between 500 and 800 words to ensure human variation.
    Uses Gemini 2.5 Flash.
    """
    target_word_count = random.randint(520, 800)
    keywords_str = ", ".join(secondary_keywords)

    persona_instruction = (
        f"You are writing as {author['name']}, known as '{author['persona_name']}'. "
        f"Your writing style: {author['persona_style']} "
        f"IMPORTANT: Do NOT add your byline or name in the article text. "
        f"Write in third person as a journalist."
    )

    # Decide whether this category should likely include a table
    # News/Opinion/Feature rarely need tables; Analysis/Recap/Power Rankings often do
    TABLE_GUIDANCE = {
        "news":           "Tables are NOT needed for breaking news. Only add one if comparing specific stats (e.g. season stats of two players head-to-head). Default: no table.",
        "analysis":       "Include 1 markdown table ONLY if it adds value — e.g. a stats comparison or performance breakdown. Make columns match data exactly with zero mismatch.",
        "preview":        "Optionally include a key matchup comparison table. If it doesn't add value, skip it entirely.",
        "recap":          "Include 1 final stats/score table ONLY for game recaps. Ensure all column headers and data rows match perfectly.",
        "opinion":        "Do NOT include any tables. Opinion pieces flow as narrative prose only.",
        "feature":        "Do NOT include tables. Feature articles use storytelling, not grids.",
        "power_rankings": "Include a clean ranking table with Position, Team, and Change columns.",
    }
    table_rule = TABLE_GUIDANCE.get(category_info["category"], "Only include a table if it genuinely adds value.")

    system_prompt = (
        f"{category_info['system_prompt']} "
        f"{persona_instruction} "
        f"CRITICAL INSTRUCTIONS:\n"
        f"1. You must generate BOTH the SEO metadata and the article draft.\n"
        f"2. SEO Meta Title MUST be catchy, clickbait, and optimized for Google Discover (max 60 chars).\n"
        f"3. SEO Meta Description MUST be compelling with a call to action (max 150 chars).\n"
        f"4. Article length MUST be approximately {target_word_count} words. Adhere to this specific target for human-like length variation.\n"
        f"5. Structure MUST be highly professional: engaging intro hook, markdown headers (##, ###), subheadings, quoted text where relevant, bullet points where appropriate, and a clean conclusion.\n"
        f"6. TABLE RULE: {table_rule}\n"
        f"   If you do include a table, use proper Markdown table syntax (| Header | Header |\n|---|---|). Column headers MUST match the data rows exactly with zero mismatch or hallucination.\n"
        f"7. Naturally integrate the primary topic keywords and these secondary keywords: {keywords_str}.\n"
        f"8. Reply in EXACTLY this format, with nothing else before or after:\n"
        f"TITLE: <Catchy Clickbait Meta Title>\n"
        f"DESC: <Meta Description>\n"
        f"TAGS: <tag1>, <tag2>, <tag3>\n"
        f"===\n"
        f"# <Article Title>\n\n"
        f"<Article Content with headers, subheadings, optional quotes, optional tables, bullets, intro, conclusion>"
    )

    user_prompt = (
        f"Write a {sport_name} {category_info['category']} article about: {topic}. "
        f"Target word count: ~{target_word_count} words. "
        f"Secondary keywords to include: {keywords_str}. "
        f"Include real-sounding statistics, scores, tables, and quotes. "
        f"Published today ({datetime.now().strftime('%B %d, %Y')})."
    )

    response = await call_gemini_api(
        model=settings.MODEL_ARCHITECT,
        prompt=user_prompt,
        system_instruction=system_prompt,
        temperature=0.7,
        max_tokens=2500,
        model_key="gemini-2.5-flash",
    )

    metadata = {
        "meta_title": topic[:60],
        "meta_description": f"Read the latest {sport_name} analysis about {topic[:80]}. Expert coverage on SportSurge."[:150],
        "meta_tags": sport_name.lower(),
        "draft": "",
        "word_count": target_word_count,
    }

    if response:
        if "===" in response:
            parts = response.split("===", 1)
            meta_part = parts[0].strip()
            draft_part = parts[1].strip()
        else:
            meta_part = response
            draft_part = response

        # Parse metadata
        for line in meta_part.split("\n"):
            line = line.strip()
            if line.upper().startswith("TITLE:"):
                metadata["meta_title"] = line.split(":", 1)[1].strip()[:60]
            elif line.upper().startswith("DESC:"):
                metadata["meta_description"] = line.split(":", 1)[1].strip()[:150]
            elif line.upper().startswith("TAGS:"):
                metadata["meta_tags"] = line.split(":", 1)[1].strip()

        metadata["draft"] = draft_part
        logger.info(f"Layer 2 (Architect): Generated draft (~{len(draft_part.split())} words) + SEO metadata")
    else:
        logger.warning("Layer 2 (Architect): Failed to generate draft")

    return metadata


# ============================================================
# Layer 3: Humanizer - Split & humanize each chunk
# ============================================================

async def humanize_text(
    text: str,
    author: dict,
    chunk_index: int = 0,
    total_chunks: int = 1,
    table_placeholders: list[str] = None
) -> Optional[str]:
    """
    Layer 3: Humanize a chunk of text with powerful instructions.
    Uses Gemini 3.1 Flash Lite.
    """
    structure_instruction = "Maintain all facts, statistics, scores, bullet points (-), and blockquotes (>) perfectly while humanizing the surrounding prose."
    if table_placeholders:
        placeholders_str = ", ".join(table_placeholders)
        structure_instruction = f"You will see placeholders like {placeholders_str}. Do NOT modify, translate, unpack, or remove them. Keep them EXACTLY as they are in your output. " + structure_instruction

    system_prompt = (
        f"You are an expert senior editor at SportSurge. "
        f"You are humanizing an article written by {author['name']} ({author['persona_name']}). Style: {author['persona_style']} "
        f"CRITICAL INSTRUCTIONS FOR FLAWLESS HUMANIZATION:\n"
        f"1. Optimize Perplexity & Burstiness: Ensure the writing rhythm feels completely natural and human. Avoid uniform AI sentence structures.\n"
        f"2. Extreme Sentence Variety: Mix very short, punchy sentences (even single-word fragments or short clauses with commas) with longer, flowing analytical sentences.\n"
        f"3. Voice & Tone: Use a seamless blend of active and passive voice. Introduce subtle human nuances, conversational phrasing, and occasional first-person perspective ('I', 'In my view', 'If you ask me') appropriate for an expert sports columnist.\n"
        f"4. STRICT PROHIBITION: Absolutely NO robotic, cliché, or AI-typical filler words (e.g., 'delve', 'testament', 'landscape', 'tapestry', 'moreover', 'furthermore', 'in conclusion', 'beacon', 'pivotal').\n"
        f"5. PRESERVE ALL STRUCTURE: {structure_instruction}\n"
        f"6. Do NOT add a byline or author name."
    )

    user_prompt = (
        f"Humanize this section ({chunk_index + 1} of {total_chunks}) to sound perfectly natural, engaging, and human-written by {author['name']}:\n\n{text}"
    )

    result = await call_gemini_api(
        model=settings.MODEL_HUMANIZER,
        prompt=user_prompt,
        system_instruction=system_prompt,
        temperature=0.6,
        max_tokens=2048,
        model_key="gemini-3.1-flash-lite",
    )

    if result:
        logger.info(f"Layer 3 (Humanizer): Section {chunk_index + 1}/{total_chunks} humanized successfully")

    return result


async def humanize_draft(draft: str, author: dict) -> str:
    """
    Split draft into major sections/chunks, protecting markdown tables with placeholders to guarantee 100% perfect formatting.
    Max 2-3 calls to ensure complete humanization without unnatural context splits.
    """
    import re

    # Extract tables and replace them with placeholders so the humanizer cannot corrupt or misalign them
    tables = []
    def table_replacer(match):
        tables.append(match.group(0))
        return f"\n\n[[MARKDOWN_TABLE_{len(tables)}]]\n\n"

    # Match markdown tables (lines starting with or containing |, with a |---| separator line)
    draft_protected = re.sub(r'(\n?^[ \t]*\|[^\n]+\|\n[ \t]*\|[^\n]+\|\n(?:[ \t]*\|[^\n]+\|\n?)+)', table_replacer, draft, flags=re.MULTILINE)

    # Split by markdown headers (##) to ensure sections stay grouped
    sections = re.split(r'(?=\n##\s)', draft_protected)
    sections = [s.strip() for s in sections if s.strip()]

    if len(sections) <= 2:
        table_placeholders = re.findall(r'\[\[MARKDOWN_TABLE_\d+\]\]', draft_protected)
        result = await humanize_text(draft_protected, author, 0, 1, table_placeholders)
        full_article = result if result else draft_protected
    else:
        # Group sections into exactly 2 or 3 chunks
        num_chunks = min(3, len(sections))
        chunk_size = (len(sections) + num_chunks - 1) // num_chunks

        chunks = []
        for i in range(num_chunks):
            start = i * chunk_size
            end = min(start + chunk_size, len(sections))
            if start < end:
                chunks.append("\n\n".join(sections[start:end]))

        humanized_chunks = []
        for i, chunk in enumerate(chunks):
            table_placeholders = re.findall(r'\[\[MARKDOWN_TABLE_\d+\]\]', chunk)
            result = await humanize_text(chunk, author, i, len(chunks), table_placeholders)
            humanized_chunks.append(result if result else chunk)

        full_article = "\n\n".join(humanized_chunks)
        logger.info(f"Layer 3 (Humanizer): Full draft humanized in {len(chunks)} calls")

    # Restore exact original tables using robust regex to handle any escaping or spacing variations by the AI
    for i, table_content in enumerate(tables, 1):
        # Match [[MARKDOWN_TABLE_1]], [[MARKDOWN TABLE 1]], [[TABLE 1]], \[\[MARKDOWN_TABLE_1\]\], [ [ MARKDOWN_TABLE_1 ] ], etc.
        pattern = r'\\?\[\s*\\?\[\s*(?:MARKDOWN[_\s]*)?TABLE[_\s]*' + str(i) + r'\s*\\?\]\s*\\?\]'
        full_article = re.sub(pattern, f"\n\n{table_content.strip()}\n\n", full_article, flags=re.IGNORECASE)

    return full_article


# ============================================================
# Internal Linking Engine
# Post-processing step: inject 2-4 real internal links
# ============================================================

async def add_internal_links(
    article_content: str,
    sport_slug: str,
    current_article_slug: str = "",
    db=None,
) -> str:
    """
    Inject natural internal links into the finished article.

    Rules (designed to feel editorial, not spammy):
    ─────────────────────────────────────────────────────
    1.  Fetch 6 recent published articles from the same sport
        plus 3 from any other sport (for cross-sport variety).
    2.  Match article titles against paragraph keywords.
        A link is inserted if ≥ 2 meaningful words from the
        candidate article's title appear in the same paragraph.
    3.  Maximum 3 inline keyword links per article.
        Minimum 0 (never force irrelevant links).
    4.  Insert ONE "📖 Also Read" block after the 2nd or 3rd
        section heading — never at top or bottom.
    5.  Links use absolute-path markdown: [anchor text](/sport/news/slug)
    6.  Never link the same article twice.
    7.  Never insert a link inside an existing markdown link,
        inside a code block, or inside a table.
    """
    if db is None:
        return article_content

    try:
        from sqlalchemy import select, and_
        from app.models import Article as ArticleModel, Sport

        # ── Fetch candidate articles from DB ──────────────────────────────
        sport_result = await db.execute(select(Sport).where(Sport.slug == sport_slug))
        sport_obj = sport_result.scalar_one_or_none()

        candidates = []
        if sport_obj:
            # Same-sport: 6 most recent (excluding current)
            q = (
                select(ArticleModel.slug, ArticleModel.title, ArticleModel.sport_id)
                .where(
                    and_(
                        ArticleModel.sport_id == sport_obj.id,
                        ArticleModel.is_published == True,
                        ArticleModel.slug != current_article_slug,
                    )
                )
                .order_by(ArticleModel.published_at.desc())
                .limit(6)
            )
            rows = (await db.execute(q)).fetchall()
            for row in rows:
                candidates.append({"slug": row.slug, "title": row.title, "sport_slug": sport_slug})

        # Cross-sport: 3 most recent from other sports
        q2 = (
            select(ArticleModel.slug, ArticleModel.title, Sport.slug.label("sport_slug"))
            .join(Sport, ArticleModel.sport_id == Sport.id)
            .where(
                and_(
                    ArticleModel.is_published == True,
                    ArticleModel.slug != current_article_slug,
                    Sport.slug != sport_slug,
                )
            )
            .order_by(ArticleModel.published_at.desc())
            .limit(3)
        )
        rows2 = (await db.execute(q2)).fetchall()
        for row in rows2:
            candidates.append({"slug": row.slug, "title": row.title, "sport_slug": row.sport_slug})

        if not candidates:
            return article_content

        # ── Keyword extraction helper ─────────────────────────────────────
        _stop = {
            "the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "and",
            "or", "with", "by", "from", "as", "its", "it", "was", "are", "be",
            "has", "had", "have", "will", "can", "how", "what", "this", "that",
            "not", "but", "vs", "vs.", "up", "down", "his", "her", "their",
        }

        def _keywords(text: str) -> set:
            return {w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', text) if w.lower() not in _stop}

        # ── Split article into paragraphs, skipping protected zones ───────
        # We only insert inline links into plain prose paragraphs
        # (skip lines inside tables, code blocks, existing markdown links)
        paragraphs = article_content.split("\n")
        in_code_block = False
        in_table = False
        used_slugs: set = set()
        inline_link_count = 0
        MAX_INLINE_LINKS = 3

        result_lines = list(paragraphs)  # mutable copy

        for line_idx, line in enumerate(result_lines):
            stripped = line.strip()

            # Track code blocks
            if stripped.startswith("```"):
                in_code_block = not in_code_block
            if in_code_block:
                continue

            # Track tables (lines with | characters)
            if re.match(r'^\s*\|', stripped):
                in_table = True
                continue
            else:
                in_table = False

            # Skip headings, blockquotes, bullets, existing links
            if stripped.startswith(("#", ">", "-", "*", "|", "!", "[")):
                continue
            if "](" in stripped:  # already has a link
                continue

            # Only process lines with enough prose (≥8 words)
            words_in_line = len(stripped.split())
            if words_in_line < 8:
                continue

            if inline_link_count >= MAX_INLINE_LINKS:
                break

            line_kw = _keywords(stripped)

            for candidate in candidates:
                if candidate["slug"] in used_slugs:
                    continue
                cand_kw = _keywords(candidate["title"])
                overlap = line_kw & cand_kw
                # Need ≥ 2 overlapping keywords for a natural link
                if len(overlap) < 2:
                    continue

                # Build the anchor text from the overlapping words (pick first matching phrase)
                anchor_words = [w for w in stripped.split() if w.lower().rstrip('.,;:!?') in overlap]
                if len(anchor_words) < 2:
                    continue
                anchor_text = " ".join(anchor_words[:3])

                href = f"/{candidate['sport_slug']}/news/{candidate['slug']}"
                link_md = f"[{anchor_text}]({href})"

                # Replace the first occurrence of anchor_words in the line
                anchor_plain = re.escape(anchor_text)
                new_line, n_subs = re.subn(
                    rf'\b{anchor_plain}\b', link_md, result_lines[line_idx], count=1, flags=re.IGNORECASE
                )
                if n_subs:
                    result_lines[line_idx] = new_line
                    used_slugs.add(candidate["slug"])
                    inline_link_count += 1
                    logger.info(f"[IntLink] Injected '{anchor_text}' → {href}")
                    break  # one link per paragraph

        # ── Insert ONE "Also Read" block after 2nd heading ────────────────
        also_read_candidates = [
            c for c in candidates
            if c["slug"] not in used_slugs and c["sport_slug"] == sport_slug
        ][:2]

        if also_read_candidates:
            heading_indices = [
                i for i, ln in enumerate(result_lines)
                if re.match(r'^#{2,3}\s', ln.strip())
            ]
            insert_after = heading_indices[1] if len(heading_indices) >= 2 else (
                heading_indices[0] if heading_indices else len(result_lines) // 2
            )
            # Find the end of that section (next non-blank line after the heading)
            insert_pos = insert_after + 1
            while insert_pos < len(result_lines) and not result_lines[insert_pos].strip():
                insert_pos += 1
            insert_pos += 2  # insert after first 2 lines of the section body

            also_read_lines = ["\n> 📖 **Also Read:**"]
            for c in also_read_candidates:
                href = f"/{c['sport_slug']}/news/{c['slug']}"
                also_read_lines.append(f"> - [{c['title']}]({href})")
            also_read_lines.append("")

            result_lines[insert_pos:insert_pos] = also_read_lines
            logger.info(f"[IntLink] Inserted 'Also Read' block with {len(also_read_candidates)} links")

        return "\n".join(result_lines)

    except Exception as e:
        logger.warning(f"[IntLink] Internal linking failed (returning original): {e}")
        return article_content



# ============================================================
# Full Pipeline: generate_article_v3
# ============================================================

async def generate_article_v3(topic: str, sport_name: str, category: str = None, sport_slug: str = "", article_slug: str = "", db=None) -> dict:
    """
    Full multi-layer article generation pipeline (Streamlined 3-Layer Architecture).
    Layer 1: Router (gemma-4-31b-it)
    Layer 2: Architect + SEO (gemini-2.5-flash) - Generates clickbait SEO metadata & rich draft with random word count (500-800 words)
    Layer 3: Humanizer (gemini-3.1-flash-lite) - Powerful humanization preserving tables/bullets/headers
    Post-Layer: Internal Linking Engine - Injects 2-4 real article links + Also Read block
    """
    logger.info(f"Starting v3.0 streamlined 3-layer pipeline for: '{topic}' ({sport_name})")

    if not category:
        category_info = random.choice(ARTICLE_CATEGORIES)
    else:
        category_info = next(
            (c for c in ARTICLE_CATEGORIES if c["category"] == category),
            random.choice(ARTICLE_CATEGORIES),
        )

    # ---- Layer 1: Router ----
    try:
        author = await route_to_writer(topic, sport_name)
    except Exception as e:
        logger.warning(f"Layer 1 failed, using fallback: {e}")
        author = get_author_for_sport(sport_name)

    # ---- Helper: Get Secondary Keywords ----
    try:
        secondary_keywords = await generate_secondary_keywords(topic, sport_name)
    except Exception as e:
        logger.warning(f"Secondary keywords generation failed: {e}")
        secondary_keywords = [sport_name, "news", "analysis"]

    # ---- Layer 2: Architect + SEO (Draft) ----
    meta_result = await write_draft(topic, sport_name, category_info, author, secondary_keywords)
    draft = meta_result.get("draft", "")
    if not draft:
        logger.warning("Layer 2 failed, using fallback article")
        draft = generate_fallback_article(topic, sport_name, category_info["category"])

    # ---- Layer 3: Humanizer ----
    try:
        humanized = await humanize_draft(draft, author)
    except Exception as e:
        logger.warning(f"Layer 3 failed, using draft: {e}")
        humanized = draft

    # ---- Post-Layer: Internal Linking ----
    try:
        if db is not None:
            humanized = await add_internal_links(
                article_content=humanized,
                sport_slug=sport_slug or sport_name.lower(),
                current_article_slug=article_slug,
                db=db,
            )
    except Exception as e:
        logger.warning(f"Internal linking post-layer failed (non-critical): {e}")

    word_count = len(humanized.split())
    logger.info(f"Pipeline complete: {word_count} words, author={author['name']}, category={category_info['category']}")

    return {
        "content": humanized,
        "author": author,
        "category": category_info["category"],
        "provider_used": "gemini-v3-pipeline",
        "meta_title": meta_result.get("meta_title", topic[:60]),
        "meta_description": meta_result.get("meta_description", ""),
        "meta_tags": meta_result.get("meta_tags", sport_name.lower()),
        "word_count": word_count,
        "pipeline_version": "3.0",
    }



# ============================================================
# Match Summary Generator
# ============================================================

async def generate_match_summary(
    home_team: str,
    away_team: str,
    sport_name: str,
    home_score: int,
    away_score: int,
    venue: str = "",
    match_date: str = "",
) -> Optional[str]:
    """
    Generate a 100-150 word AI summary for a finished match.
    Uses Gemini 3.1 Flash Lite (abundant quota).
    Rate limit: max 50 summaries/day.
    """
    try:
        rate_limiter.record_call("match_summary")
    except RuntimeError as e:
        logger.warning(f"Match summary rate limit: {e}")
        return None

    system_prompt = (
        "You are a sports match summary writer. Write a concise 100-150 word summary of a completed match. "
        "Include key moments, standout performers, and what the result means. "
        "Be factual and engaging. Do not add a byline."
    )

    date_info = f" on {match_date}" if match_date else ""
    venue_info = f" at {venue}" if venue else ""
    winner = home_team if home_score > away_score else away_team
    loser = away_team if home_score > away_score else home_team

    user_prompt = (
        f"Write a {sport_name} match summary ({home_score}-{away_score}) for {home_team} vs {away_team} "
        f"played{venue_info}{date_info}. "
        f"The {winner} defeated the {loser}. "
        f"Make it 100-150 words, engaging and informative."
    )

    result = await call_gemini_api(
        model=settings.MODEL_MATCH_SUMMARY,
        prompt=user_prompt,
        system_instruction=system_prompt,
        temperature=0.6,
        max_tokens=300,
        model_key="gemini-3.1-flash-lite",
    )

    if result:
        logger.info(f"Match summary generated: {home_team} vs {away_team}")

    return result


# ============================================================
# Smart Embed Search
# ============================================================

# Verified/big accounts for sports
VERIFIED_SOCIAL_ACCOUNTS = {
    # NBA
    "espn": "ESPN",
    "shams": "Shams Charania",
    "wojespn": "Adrian Wojnarowski",
    "theathletic": "The Athletic",
    "bleacherreport": "Bleacher Report",
    "nba": "NBA",
    "nbaontnt": "NBA on TNT",
    # NFL
    "nfl": "NFL",
    "adam_schefter": "Adam Schefter",
    "rapoport": "Ian Rapoport",
    "nflnetwork": "NFL Network",
    # MLB
    "mlb": "MLB",
    "jeffpassan": "Jeff Passan",
    "jonheyman": "Jon Heyman",
    # NHL
    "nhl": "NHL",
    "friedgenhl": "Elliotte Friedman",
    # F1
    "f1": "Formula 1",
    "autosport": "Autosport",
    "planetf1": "PlanetF1",
    # MMA/Boxing
    "ufc": "UFC",
    "arielhelwani": "Ariel Helwani",
    "marcraimondi": "Marc Raimondi",
    "boxingscene": "Boxing Scene",
    # Cricket
    "icc": "ICC",
    "cricbuzz": "Cricbuzz",
    "espncricinfo": "ESPNcricinfo",
    # General
    "cbssports": "CBS Sports",
    "si": "Sports Illustrated",
    "yahoosports": "Yahoo Sports",
}


def extract_embed_urls(html_content: str) -> list[dict]:
    """
    Extract tweet/Instagram URLs from scraped news article HTML content.
    Filters for verified/big accounts only.
    Returns list of embed-ready URLs with source info.
    """
    if not html_content:
        return []

    embeds = []

    # Twitter/X URLs
    twitter_pattern = r'https?://(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)/status/(\d+)'
    twitter_matches = re.finditer(twitter_pattern, html_content)

    for match in twitter_matches:
        username = match.group(1).lower()
        tweet_id = match.group(2)
        full_url = match.group(0)

        # Check if from a verified account
        is_verified = username in VERIFIED_SOCIAL_ACCOUNTS
        account_name = VERIFIED_SOCIAL_ACCOUNTS.get(username, username)

        embed_url = f"https://platform.twitter.com/embed/Tweet.html?id={tweet_id}"

        embeds.append({
            "platform": "twitter",
            "url": full_url,
            "embed_url": embed_url,
            "username": username,
            "account_name": account_name,
            "is_verified": is_verified,
            "tweet_id": tweet_id,
        })

    # Instagram URLs
    instagram_pattern = r'https?://(?:www\.)?instagram\.com/(?:p|reel)/([a-zA-Z0-9_-]+)'
    instagram_matches = re.finditer(instagram_pattern, html_content)

    for match in instagram_matches:
        post_id = match.group(1)
        full_url = match.group(0)

        # Instagram doesn't have easy username extraction from URL
        # Mark as verified if from known sports accounts
        embeds.append({
            "platform": "instagram",
            "url": full_url,
            "embed_url": f"https://www.instagram.com/p/{post_id}/embed/",
            "username": "",
            "account_name": "Instagram Post",
            "is_verified": False,
            "post_id": post_id,
        })

    # Sort: verified accounts first
    embeds.sort(key=lambda x: (0 if x["is_verified"] else 1, x["platform"]))

    # Remove duplicates by URL
    seen_urls = set()
    unique_embeds = []
    for embed in embeds:
        if embed["url"] not in seen_urls:
            seen_urls.add(embed["url"])
            unique_embeds.append(embed)

    # Only return verified embeds (filter out non-verified)
    verified_embeds = [e for e in unique_embeds if e["is_verified"]]

    return verified_embeds


# ============================================================
# Legacy v2 Compatibility Functions
# ============================================================

def get_author_for_sport(sport_name: str) -> dict:
    """Get the appropriate author for a given sport (fallback mapping)."""
    specialty = SPORT_AUTHOR_MAP.get(sport_name, "Multi-sport")
    matching = [a for a in AUTHOR_PROFILES if a["specialty"] == specialty]
    if matching:
        return matching[0]
    return AUTHOR_PROFILES[-1]  # Alex Thompson as fallback


async def generate_article_via_openrouter(
    topic: str,
    sport_name: str,
    category_info: dict,
) -> Optional[str]:
    """Generate article using OpenRouter API (legacy v2 support)."""
    if not settings.OPENROUTER_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://sportsurge.com",
                },
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": f"{category_info['system_prompt']} Write 500-700 words for SportSurge, a major sports media outlet. Use markdown formatting with headers. Include specific team names, player references, and statistics. Write in a professional but engaging tone.",
                        },
                        {
                            "role": "user",
                            "content": f"Write a {sport_name} {category_info['category']} article about: {topic}. Make it informative, engaging, and suitable for a sports news website published today ({datetime.now().strftime('%B %d, %Y')}).",
                        },
                    ],
                    "temperature": 0.8,
                    "max_tokens": 1500,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content")

    except Exception as e:
        logger.error(f"OpenRouter generation error: {e}")
        return None


async def generate_article_via_openai(
    topic: str,
    sport_name: str,
    category_info: dict,
) -> Optional[str]:
    """Generate article using OpenAI API (legacy v2 support)."""
    if not settings.OPENAI_API_KEY:
        return None

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        completion = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"{category_info['system_prompt']} Write 500-700 words for SportSurge, a major sports media outlet. Use markdown formatting with headers. Include specific team names, player references, and statistics.",
                },
                {
                    "role": "user",
                    "content": f"Write a {sport_name} {category_info['category']} article about: {topic}. Published today ({datetime.now().strftime('%B %d, %Y')}).",
                },
            ],
            temperature=0.8,
            max_tokens=1500,
        )
        return completion.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI generation error: {e}")
        return None


def generate_fallback_article(topic: str, sport_name: str, category: str) -> str:
    """Generate a fallback article when AI is not available."""
    return f"""# {topic}

In the ever-evolving landscape of {sport_name}, few storylines capture the imagination quite like this one. As the season progresses, fans and analysts alike are paying close attention to the developments surrounding this topic, and for good reason.

## The Current Situation

The {sport_name} world has been buzzing with excitement over recent developments. This story has the potential to reshape the competitive landscape and create new narratives that will define the season. Teams and players across the league are taking notice, and the ripple effects are already being felt throughout the sport.

## What the Experts Say

Analysts have been weighing in from all corners, and the consensus is clear: this is a significant moment for {sport_name}. The implications extend beyond just the immediate impact, potentially setting the stage for broader changes across the sport. Multiple sources have confirmed that the situation is developing rapidly, and the coming days could bring further clarity.

"Moments like these are what make {sport_name} so compelling," noted one veteran observer. "The way teams and players respond to these situations often defines their legacy and shapes the narrative for years to come."

## Key Takeaways

Several key factors are at play here. First, the competitive balance in {sport_name} has never been more delicate, with multiple teams positioning themselves for a deep postseason run. Second, the individual performances we are witnessing this season are historically significant, with several players on pace for career-best numbers. Third, the strategic adjustments being made by coaching staffs across the league reflect a new era of innovation in the sport.

## Looking Ahead

As we look to the rest of the season, several key questions remain unanswered. How will this affect the playoff picture? What adjustments will teams make in response? And most importantly, who will rise to the occasion when it matters most? The answers to these questions will determine not just this season's champions, but the trajectory of {sport_name} for years to come.

## The Bottom Line

For {sport_name} fans, this is exactly the kind of drama that makes following the sport so rewarding. Whether you are a casual observer or a die-hard fanatic, there is no denying the impact this will have on the season's trajectory. Stay tuned to SportSurge for continued coverage and in-depth analysis of all the latest developments in {sport_name}."""


async def generate_article(topic: str, sport_name: str, category: str = None) -> dict:
    """
    Legacy v2-compatible article generation.
    Tries v3 pipeline first (if Gemini key available), then falls back to v2 providers.
    Returns dict with content, author, category.
    """
    # Try v3 pipeline first
    if settings.GEMINI_API_KEY:
        try:
            return await generate_article_v3(topic, sport_name, category)
        except Exception as e:
            logger.warning(f"v3 pipeline failed, falling back to v2: {e}")

    # v2 fallback logic
    if not category:
        category_info = random.choice(ARTICLE_CATEGORIES)
    else:
        category_info = next(
            (c for c in ARTICLE_CATEGORIES if c["category"] == category),
            random.choice(ARTICLE_CATEGORIES),
        )

    author = get_author_for_sport(sport_name)
    content = None
    provider = settings.ai_provider

    if provider == "openrouter":
        content = await generate_article_via_openrouter(topic, sport_name, category_info)
    elif provider == "openai":
        content = await generate_article_via_openai(topic, sport_name, category_info)

    if not content:
        logger.info(f"AI providers unavailable, using fallback for: {topic}")
        content = generate_fallback_article(topic, sport_name, category_info["category"])

    return {
        "content": content,
        "author": author,
        "category": category_info["category"],
        "provider_used": provider,
        "meta_title": topic[:60],
        "meta_description": f"Read the latest {sport_name} analysis about {topic[:80]}. Expert coverage on SportSurge."[:150],
        "meta_tags": sport_name.lower(),
        "word_count": len(content.split()),
        "pipeline_version": "2.0-legacy",
    }


async def generate_daily_articles(topics: list[dict]) -> list[dict]:
    """
    Generate multiple articles for the daily batch.
    topics: list of {topic, sport_name, category?}
    """
    articles = []
    for topic_data in topics:
        result = await generate_article(
            topic=topic_data["topic"],
            sport_name=topic_data["sport_name"],
            category=topic_data.get("category"),
        )
        articles.append(result)
    return articles
