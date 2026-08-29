import os
import re
from openai import OpenAI

_client = None
_chat_model = None

PLATFORM_CONSTRAINTS = {
    "twitter": "under 280 characters, punchy, no more than 2 hashtags",
    "instagram": "warm and visual, 1-3 short paragraphs, hashtag-friendly",
    "linkedin": "professional tone, value-driven, 2-4 short paragraphs",
    "facebook": "conversational, encourages comments, moderate length",
}


def _get_client():
    """Prefer Groq (free tier, OpenAI-compatible API) over OpenAI if both are set."""
    global _client, _chat_model
    if _client is not None:
        return _client

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key != "your_groq_api_key_here":
        try:
            _client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
            _chat_model = "openai/gpt-oss-20b"
            return _client
        except Exception:
            pass

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_key != "your_openai_api_key_here":
        try:
            _client = OpenAI(api_key=openai_key)
            _chat_model = "gpt-4o-mini"
            return _client
        except Exception:
            pass

    return None


def generate_caption(topic: str, platform: str = "instagram", tone: str = "casual") -> dict:
    client = _get_client()
    constraint = PLATFORM_CONSTRAINTS.get(platform, "general social media best practices")

    if client:
        try:
            response = client.chat.completions.create(
                model=_chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a social media copywriter. Write for {platform}: "
                        f"{constraint}. Tone: {tone}.",
                    },
                    {"role": "user", "content": f"Write a caption about: {topic}"},
                ],
                temperature=0.8,
            )
            caption_text = response.choices[0].message.content.strip()
            return {
                "platform": platform,
                "caption": caption_text,
                "model": _chat_model,
                "tone": tone,
            }
        except Exception:
            # Fallback to smart template generator
            pass

    # Built-in generator
    if platform == "twitter":
        caption_text = (
            f"🚀 {topic}\n\nKey takeaway: Focus on high-leverage outcomes and daily "
            "consistency.\n\n#Growth #Tech"
        )
    elif platform == "linkedin":
        caption_text = (
            f"Perspective on {topic}:\n\n1. Identify bottlenecks early\n"
            "2. Iterate rapidly based on data\n3. Build scalable distribution\n\n"
            "How is your organization approaching this?\n\n#Leadership #B2B #Innovation"
        )
    elif platform == "facebook":
        caption_text = (
            f"We are diving deep into {topic}! 💡 What has been your experience so far? "
            "Drop your insights below!"
        )
    else:  # Instagram
        caption_text = (
            f"✨ Exploring {topic}\n\nTransforming ideas into high-impact results takes the "
            "right strategy and focus. Double tap if you agree! 💫\n\n#GrowthMindset "
            "#CreatorCommunity #Innovation #Strategy"
        )

    return {"platform": platform, "caption": caption_text, "model": "local-ai-engine", "tone": tone}


def generate_hashtags(content: str, platform: str = "instagram", max_tags: int = 10) -> dict:
    client = _get_client()

    if client:
        try:
            response = client.chat.completions.create(
                model=_chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": f"Generate up to {max_tags} relevant, non-generic hashtags "
                        f"for {platform}. Return only the hashtags, space-separated, no "
                        "explanation.",
                    },
                    {"role": "user", "content": content},
                ],
                temperature=0.6,
            )
            raw = response.choices[0].message.content.strip()
            hashtags = re.findall(r"#\w+", raw)[:max_tags]
            if hashtags:
                return {"platform": platform, "hashtags": hashtags, "model": _chat_model}
        except Exception:
            pass

    # Clean words and build tags
    words = re.findall(r"[A-Za-z0-9]{4,}", content)
    derived = [f"#{w.capitalize()}" for w in words[:4]]
    defaults = [
        "#SocialMedia",
        "#ContentStrategy",
        "#DigitalMarketing",
        "#Growth",
        "#TechInnovation",
        "#CreatorEconomy",
        "#Productivity",
    ]
    unique_tags = list(dict.fromkeys(derived + defaults))[:max_tags]

    return {"platform": platform, "hashtags": unique_tags, "model": "local-ai-engine"}


def repurpose_content(content: str, source_platform: str, target_platforms: list) -> dict:
    client = _get_client()
    results = {}

    if client:
        try:
            for target in target_platforms:
                constraint = PLATFORM_CONSTRAINTS.get(target, "general social media best practices")
                response = client.chat.completions.create(
                    model=_chat_model,
                    messages=[
                        {
                            "role": "system",
                            "content": f"Rewrite the given {source_platform} post for "
                            f"{target}: {constraint}. Preserve the core message and intent.",
                        },
                        {"role": "user", "content": content},
                    ],
                    temperature=0.7,
                )
                results[target] = response.choices[0].message.content.strip()

            return {"sourcePlatform": source_platform, "repurposed": results, "model": _chat_model}
        except Exception:
            pass

    for target in target_platforms:
        if target == "twitter":
            trimmed = content[:260] + ("..." if len(content) > 260 else "")
            results[target] = f"{trimmed}\n\n#Tech #Insights"
        elif target == "linkedin":
            results[target] = (
                f"Key Insight:\n\n{content}\n\nWhy this matters for modern teams: continuous "
                "improvement drives long-term compound growth.\n\n#Leadership #BusinessStrategy"
            )
        elif target == "instagram":
            results[target] = (
                f"✨ {content}\n\nSave this for later! 📌\n\n#Creators #MarketingTips #Inspiration"
            )
        elif target == "facebook":
            results[target] = f"{content}\n\nWhat are your thoughts on this? Share below!"
        else:
            results[target] = content

    return {"sourcePlatform": source_platform, "repurposed": results, "model": "local-ai-engine"}
