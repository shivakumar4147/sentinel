import re

def clean_json_str(content: str) -> str:
    """Robustly cleans LLM output to extract pure JSON string.
    
    Handles markdown code blocks (```json ... ```), preamble text,
    and postscript text.
    """
    if not content:
        return ""
    s = content.strip()
    if "```" in s:
        m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", s)
        if m:
            s = m.group(1).strip()
    first_brace = s.find("{")
    last_brace = s.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        s = s[first_brace:last_brace + 1]
    return s

